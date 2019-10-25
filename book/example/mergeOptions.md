# mergeOptions

> 关于父子数据合并或者组件数据扩展


相关资源在app-example-init-mixin-api.html


##### 1.9.1 校验数据且格式化数据，为合并做准备

- 校验components  checkComponents 检查组件名称 不能是保留标签 内建标签  然后符合unicode编码就行

```javascript

/**
 * Validate component names
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

export function validateComponentName (name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  // 是否保留字 保留标签 或者内建组件  slot  components  这些不能用
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

```

- 格式化props  

> 需要整合成正确格式好处理props的校验

```javascript

// 正常形式

props: {
  username: {
    type: String,
    default: 'chunmu.zhang'
  },
  userinfo: {
    type: [Array, String] | Number
  }
}


/**
* props可以是数组  如果是数组  元素必须为string类型  props = ['username', userinfo']
* 格式化后 会成为 
* */

props: {
  username: {
    type: null
  },
  userinfo: {
    type: null
  }
}

```

- 格式化inject   normalizeInject  依赖注入  可以看成是多级的props传递

```javascript

// 可以是数组  如果是数组  元素必须为string类型  
inject = ['username', 'userinfo']
// 格式化后
inject: {
  username: {
    from: 'username'
  },
  userinfo: {
    from: 'userinfo'
  }
}

```

- 格式化directives

```javascript

directives: {
  'v-haha': function xx() {}
}


==>

directives: {
  'v-hah': {
    bind: function xx() {},
    update: function xx() {}
  }
}

```


##### 1.9.2 开始合并处理


> 假设来源  src1 = Vue.mixin()  src2 = vm.extends({})  src3 = vm.mixins: [mixin, mixin2] src4 = vm


假设 mixin里面设置mixin会发生啥。。。??????????

```javascript

  // 合并策略处理
  const options = {}
  let key // key = data, props, method, hooks, etc
  // 合并共有数据
  for (key in parent) {
    mergeField(key)
  }
  // 合并parent中并没有的数据
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  // 合并策略
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }

```

- 默认合并策略

```javascript

// child没有就用parent  否则用child
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}

```

- data合并策略  src4 > src3 > src2 > src1

```javascript

/**
* 关于data的一个小知识点  理论上可以在组件内这样写
* {
*   data: {
*     appLang: 'zh'
*   }
* }
* 这样data是一个对象 并不是一个函数 这样是ok的  但是这样的写法在其它场景  比如说mixins 或者extends里面会被vue拦截并告警
* 提示data必须是一个函数
* 原因:
* 如果我顶一个这样一个配置来生成vue实例  则通过这个配置生成的所有vue实例都会共用这项配置的数据  也包括data
* 如果data是一个对象  则他们共享这个对象  会有串值得情况
* 如果是函数  返回的是一个新对象  每个vue实例用的都是属于自己的data  不会相互影响 666啊
* 
* data合并策略：
* 在没有vue实例的情况下，如果没有子级data则返回父级  没有父级则返回子级  如果都存在
* 则返回一个新函数 data函数已执行 构建一个新函数  在执行的时候 返回计算结果
* 在有vue实例的情况下
* data可以使用普通对象
* */

strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // 关于这里 data为什么必须是一个function  因为通过data方法执行获取到的对象是一个新的对象副本
    // 如果data为一个对象 则可能出现多个vue实例共享这个data对象 则可能出现不可控的问题 不同实例修改数据会反映在这一个data对象
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}


// 两个数据对象之间的合并  data有用到  provide有用到
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    // 如果这个对象已经被观测  会有__ob__这个key  忽略这个key
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      // 设置观测机制 这个后面会讲到
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      // 循环处理
      mergeData(toVal, fromVal)
    }
  }
  return to
}
```


- el, propsData的合并策略

```javascript

// 3.0 el, propsData的合并策略

/**
* 这个是创建新对象的时候会用到的继承 所以不会也不应该和子级冲突  所以用默认的合并策略
* */

```

- watch, hook合并策略

```javascript

// 执行顺序 src1 > src2 > src3 > src4  不会像data中覆盖的现象 都需要保留且执行
watch = src1.concat(src2.concat(src3.concat(src4)))

```

- props, methods, inject, computed的合并策略  

```javascript
src4 > src3 > src2 > src1

```

- props, methods, inject, computed, provide, components, filters, directives的合并策略  

```javascript
src4 > src3 > src2 > src1

```