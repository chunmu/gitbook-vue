# 用于代码展示和定位


## 00001 new Vue() 

万物起源 

```javascript

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    // 如果this instanceof Vue 不是通过 new Vue()这种方式创建的对象抛出报错
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

```

### 1000001.1initGolbalAPI

```javascript


```


## 00002 _init

```javascript
vm._uid = uid++  // 计数Id

vm._isVue = true // 标记vm为vue实例 后面用来判断是否boserve

// mergeOptions tag 00003

/* istanbul ignore else */
// initProxy  tag 00004
if (process.env.NODE_ENV !== 'production') {
  initProxy(vm)
} else {
  vm._renderProxy = vm
}

initLifecycle(vm) // tag 00005
initEvents(vm) // tag 00006
```

### 00003 mergeOptions

### 00004 initProxy

```javascript
// 主要作用是拦截对象 重新定义get set  has行为 判断是否为全局保留变量集合或者全局变量集合 都没有找到则给出warn提示
// 通过友好的拦截给出提示  otherwise  就是js层级的报错 ReferenceError xxx is not defined
  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }
  
  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }
  
  // 关于proxy的各种API介绍  https://blog.csdn.net/wuyujin1997/article/details/89137999
  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      const options = vm.$options
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
  // 比较关键的地方  hasHandler和getHandler  拦截对象的has 和 get API
  // 分两种情况的场景
  // 1.用户书写模板 模板便已生成render函数  我们现在用的普遍都是这种方式  直接写好template
  // proxy代理中会拦截in操作符 with检查等 所以调用的是hasHandler
  // 关于with在proxy代理中  has会起作用的场景 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/has

  const state = new CodegenState(options)
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
    render: `with(this){return ${code}}`, // with语法会先检查属性是否属于this ===> vm  
    staticRenderFns: state.staticRenderFns
  }

  // 2. 用户自己编写render方法生成渲染函数的情况 直接是点操作符  所以调用getHandler
  render (h) {
    return h('div', this.prop) // 点操作符通过get拦截器 使用getHandler
  }
```

### 00005 initLifecycle

```javascript

export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  // 寻找父级组件 逐级往上寻找父级组件  且过滤父级组件为abstract的情况  
  // 有一些组件实例是abstract类型的  具体实例有  <keep-alive>  <transition>
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm) // 在父级组件中 放入$children
  }

  vm.$parent = parent // 定位父元素
  vm.$root = parent ? parent.$root : vm // 定位根元素
  
  // 本身的数据集  初始化一些属性标记
  vm.$children = [] 
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
```


### 00006 initEvents

```javascript

export function initEvents (vm: Component) {
  // 创建一个events的纯净集合
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  // 获取父组件放置的事件监听
  // <div @click="handleClick">  在html处理后已经放置了这些  先不讲这块
  // 这边需要强调一下parseHtml后获取的事件对象的数据结构  稍后补充
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

```

#### 00006.1 updateComponentListeners

```javascript

// 设置顶层变量 方便放置在同一层级的方法用 抽离出了updateListeners

let target = vm
function add (event, fn) {
  target.$on(event, fn)
}

function remove (event, fn) {
  target.$off(event, fn)
}

function createOnceHandler (event, fn) {
  const _target = target
  return function onceHandler () {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}

target = vm  // 指定target对象实例  
updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
target = undefined

```

#### 00006.2 updateListeners

```javascript

// 主要功能
// 格式化特殊事件
event = normalizeEvent(name)

  // undefined的情况是 注册的时候 method没定义  @click="xxx"
  if (isUndef(cur)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Invalid handler for event "${event.name}": got ` + String(cur),
      vm
    )
  } else if (isUndef(old)) {
    // case: 具有新的事件方法  旧有事件对象为undefined的情况
    if (isUndef(cur.fns)) {
      // 如果invoker不存在 手动生成一个
      cur = on[name] = createFnInvoker(cur, vm)
    }
    if (isTrue(event.once)) {
      // 生成一个执行函数 执行后调用off卸载监听    
      cur = on[name] = createOnceHandler(event.name, cur, event.capture)
    }
    add(event.name, cur, event.capture, event.passive, event.params)
  } else if (cur !== old) {
    old.fns = cur
    on[name] = old
  }
}
for (name in oldOn) {
  if (isUndef(on[name])) {
    event = normalizeEvent(name)
    remove(event.name, oldOn[name], event.capture)
  }
}
```

#### 000006.2.1 normalizeEvent

```javascript
  // 这边和parsehtml有关联 稍后解释
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once, // 是否一次性消费的事件
    capture, // 是否冒泡标识
    passive // 是否passive标识
  }
  
  // 关于passive
  // pdd: 关于下面这段代码的详细解释 https://juejin.im/entry/59dd88ec51882578ce26e6c7
  // 查看是否支持passive选项设置
  // 总结一下原理  在移动端或者浏览器端引擎默认每个事件用户都会注入自定义处理逻辑 有可能打断浏览器的默认执行逻辑
  // 如果我事先告诉浏览器指定的事件链条里面用户不会往里面加额外的逻辑  浏览器执行起来就会非常流畅 不用考虑用户的二逼行为
  // 性能会有很大提升 在移动端表现为列表页流畅顺畅  参数就是{passive: true}
  // 但是不知道该浏览器支不支持这个特性 所有需要嗅探 supportsPassive
```

### 0004 initProps

```javascript

// props解析
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // ##########
  // 这边是将props父级的props数据获取 保存key到_propKeys数组中
  // 基于效率的考虑 具体查看example中新建的share下 share-0004-initProps.html
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      // key,ref,slot,slot-scope,is保留的关键字
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        // 子组件不再更新的情况下  设置setter
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      // 设置传进来的prop setter 如果父级组件修改了它的值 可以在子组件捕捉到
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

```

### 0005 validateProp 关于prop格式校验

```javascript
// 有几个比较重要的工具方法
// 1. getType 获取类型字符串 

const match = fn && fn.toString().match(/^\s*function (\w+)/)
Array || Function || Object || Boolean || String 


// 2. 判断类型是否相等

/**
* function isSameType (a, b) {
*   return getType(a) === getType(b)
* }
* */

// 3. getTypeIndex  这个在判断类型权重的时候有比较大的作用

function getTypeIndex (type, expectedTypes): number {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

// 关于获取boolean类型的默认值的逻辑
const booleanIndex = getTypeIndex(Boolean, prop.type)
if (booleanIndex > -1) {
  if (absent && hasOwn(prop, 'default')) {
    value = false
  } else if (value === '' || value === hyphenate(key)) {
    // only cast empty string / same name to boolean if
    // boolean has higher priority
    // type = [Boolean, String]前后关系具有权重关系 前者为优先
    // 如果值为空或者值为key设置为true
    const stringIndex = getTypeIndex(String, prop.type)
    if (stringIndex < 0 || booleanIndex < stringIndex) {
      value = true
    }
  }
}

if (value === undefined) {
  value = getPropDefaultValue(vm, prop, key)
  // since the default value is a fresh copy,
  // make sure to observe it.
  const prevShouldObserve = shouldObserve
  toggleObserving(true)
  observe(value)
  toggleObserving(prevShouldObserve)
}
```


### 0006 getPropDefaultValue 获取默认值的一个处理


```javascript

function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  // warn against non-factory defaults for Object & Array
  // 比较重要的一个提示   default要么是基本数据类型  要么是函数
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  // #####
  // 如果如果_props中已经存在 则直接返回已存在的值 不再启用默认值
  // 判断是否需要取默认值的逻辑
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  /**
   * props={
   *   obj: {
   *     default: () => {}
   *   }
   * }
   * */
  // #####
  // 还是需要取默认值 如果默认值为基本类型 直接返回  如果是函数类型  获取执行后的结果返回
  // 默认值为一个函数的逻辑
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

```
