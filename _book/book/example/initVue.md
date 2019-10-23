#  initVue


##### Vue构造函数定义  core/instance/index


```javascript

function Vue (options) {
  // 检测是不是通过new Vue()新建的对象  如果不是则告警
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

```


##### initMixin  core/instance/init

- 挂载_init方法  Vue.prototype._init


##### stateMixin core/instance/state

- $data & $props

```javascript

  /**
  * 在vue，用户定义的props&data各自代理在$props&$data 
  * 拦截set赋值器 阻止用户修改$data或者props指向的对象
  * eg: data () {username: 'chunmu.zhang'}
  * 把用户定义在data中的username移植到$data
  * 设置代理proxy  在用户this.username时  将指向this.$data.username
  * */
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  // $data  $props
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

```

- 挂载$set&del&watch

```javascript

  Vue.prototype.$set
  Vue.prototype.$delete
  Vue.prototype.$watch

```

##### eventsMixin  core/instance/events

- 挂载$on, $off, $once, $emit

```javascript

Vue.prototype.$on
Vue.prototype.$off
Vue.prototype.$once
Vue.prototype.$emit

```

##### lifecycleMixin core/instance/lifecycle

- 挂载_update，$forceUpdate，$destroy

```javascript
Vue.prototype.update
Vue.prototype.$forceUpdate
Vue.prototype.$destroy

```

##### renderMixin core/instance/render

- installRenderHelpers  

> 渲染相关函数装载

```javascript

export function installRenderHelpers (target: any) {
  target._o = markOnce  // 标记once
  target._n = toNumber
  target._s = toString
  target._l = renderList
  target._t = renderSlot // slot渲染
  target._q = looseEqual // 判断是否循环
  target._i = looseIndexOf
  target._m = renderStatic // 静态内容渲染
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode // 穿件text VNode
  target._e = createEmptyVNode // 创建空VNode
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}


```

- 装载$nextTick, _render

```javascript

Vue.prototype.$nextTick
Vue.prototype.render

```


##### initGlobalAPI  core/global-api/index

- config

```javascript
  /**
  * 重定义config的set 阻止用户修改配置对象引用
  * */
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

```

- Vue.util


```javascript

  /**
  * 对外暴露vue的工具方法以及options合并策略&对象合并策略方法等 以及对外暴露了一个warn方法
  * 修改这些方法具有很大的危险性 直接修改了内部的机制
  * */
  // 重写warn方法 捕捉Vue执行过程中的各种告警等  比如sentry上报
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

```
- 装载set

```javascript

  Vue.set = set   // 此处的set = Vue.prototype.$set 指向同一个方法 所以为啥还要这么挂载呢
  Vue.delete = del
  Vue.nextTick = nextTick
  Vue.observable = (obj) => {observe(obj)} // 构造obj为一个具有可观测的对象

```

- options

```javascript

  Vue.options = Object.create(null) // 创建一个比较纯净的对象
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })
  /**
  * 此时options的快照
  * Vue.options = {
  *   components: {},
  *   directives: {},
  *   filters: {}
  * }
  * */

```

- _base

```javascript

Vue.options._base = Vue // _base指向Vue构造函数

```

- 预置KeepAlive组件

```javascript

  // 先往components挂载一个全局组件对象 KeepAlive 缓存相关
  extend(Vue.options.components, builtInComponents)

```

##### initUse  core/global-api/use

- 挂载use  插件安装api

```javascript

Vue.use

// 以函数方式安装插件
Vue.use(function() {
  
}, arg1, arg2, arg3) // 插件安装函数可以这样获取用户输入参数  在use中处理过后 参数(this, arg1, arg2, arg3)  this指向Vue

// 以对象方式安装插件
Vue.use({
  install: function () {}
}, arg1, arg2, arg3)

```

##### initMixin core/global-api/mixin

- 挂载mixin  混入api

> 主要功能是合并 data&props&method以及各种生命周期钩子

```javascript
// 全局调用的mixin是对象  组件放入的是数组 
Vue.mixin({})
mixins: [mixin1, mixin2]

```

- 合并过程和策略 mergeOptions 1. 格式化 为合并做准备



```javascript

/**
* 定义一下  this.options 是childVal   mixins或者extends是parentVal 父
* */

// 1. 校验components  checkComponents 检查组件名称 不能是保留标签 内建标签  然后符合unicode编码就行

// 2. 格式化props处理  normalizeProps
/**
* props可以是数组  如果是数组  元素必须为string类型  props = ['username', userinfo']
* 格式化后 会成为 props = {
*   username: {
*     type: null
*   }
* }
* */

/**
* props可以是一个对象
* props = {
*   username: String,  在格式化时  会处理成 => {type: String} 
*   userinfo: {
*     type: [String] | String,
*     default: 'chunmu.zhang'
*   }
* }
* */

// 3. 格式化inject  normalizeInject  依赖注入  可以看成是多级的props传递
/**
* props可以是数组  如果是数组  元素必须为string类型  inject = ['username', userinfo']
* 格式化后 会成为 inject = {
*   username: {
*     from: 'username'
*   }
* }
* */

/**
* props可以是一个对象
* props = {
*   userinfo: {
*     from: 'userinfo'
*   }
* }
* */

// 格式化指令  normalizeDirectives
/**
* 如果是
* directives = {
*   'v-haha': function xx() {}
* }
* 
* 则 directives = {
*   'v-haha': {
*     bind: function xx() {},
*     update: function xx() {}
*   }
* }
* */


```

- 合并过程和策略 mergeOptions 2. 开始按照各自合并策略合并

```javascript

// 1. 默认的合并策略  以子级的值为准 如果是undefined才去拿父级

/**
* childVal === undefined
      ? parentVal
      : childVal
*/


// 2. data的合并策略  
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

// 子级优先
childData () {
   return {
     name: 'child',
     obj: {
       objName: 'childObj'
     }
   }
 },
parentData () {
   return {
     name: 'parent',
     obj: {
       objName: 'parentObj'
     },
     otherObj: {
       name: 'otherObj'
     },
     age: 12
   }
 }
//  合并结果
data = {
  name: 'child',
  obj: {
    objName: 'childObj'
  },
  otherObj: {
    name: 'otherObj'
  },
  age: 12
}

// 3.0 el, propsData的合并策略

/**
* 这个是创建新对象的时候会用到的继承 所以不会也不应该和子级冲突  所以用默认的合并策略
* */


// 4.0 watch合并策略

/**
* parent.concat(child)
* 如果不存在childVal  则使用parentVal
* 如果不存在parentVal, 则用childVal
* 如果都存在  则采用concat的策略  因为监听函数都需要生效 并不能丢弃
* 对应同名的key转换成数组类
* watch: {
*   value1: [{}, {}, {}]
* }
* */

// 5.0 props, methods, inject, computed的合并策略

  /**
  * 很明显是子会覆盖父
  * */
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
  
// 6.0 provide的合并策略  parentVal优先。。

// 7.0 hook的合并策略
parentVal.concat(childVal) // 看出来了吗  如果都有  先执行parentVal,后执行childVal

// 8.0 assets的合并策略  directives, components等
// 简单粗暴的子覆盖父


```


##### initExtend core/global-api/extend

- 挂载extend cid计数  ???????? 需要补充extend()方法的用例

```javascript

Vue.extend

```

##### initAssetRegisters  core/global-api/assets

- 注册全局api  Vue.filter()  Vue.component() Vue.directive()  ???????? 需要补充用例


##### 定义ssr相关变量  core/index

```javascript

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

```

