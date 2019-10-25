#  initVue


#### 1.0 Vue构造函数定义  core/instance/index


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


#### 1.1 initMixin  core/instance/init

- 挂载_init方法  Vue.prototype._init


#### 1.2 stateMixin core/instance/state

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

#### 1.3 eventsMixin  core/instance/events

- 挂载$on, $off, $once, $emit

```javascript

Vue.prototype.$on
Vue.prototype.$off
Vue.prototype.$once
Vue.prototype.$emit

```

#### 1.4 lifecycleMixin core/instance/lifecycle

- 挂载_update，$forceUpdate，$destroy

```javascript
Vue.prototype.update
Vue.prototype.$forceUpdate
Vue.prototype.$destroy

```

#### 1.5 renderMixin core/instance/render

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


#### 1.6 initGlobalAPI  core/global-api/index

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

#### 1.7 initUse  core/global-api/use

- 挂载use  插件安装api

![插件安装示例](/example/app-example-install-plugin.html)

```javascript

Vue.use

// 以函数方式安装插件
Vue.use(function() {
  
}, arg1, arg2, arg3) // 插件安装函数可以这样获取用户输入参数  在use中处理过后 参数(this, arg1, arg2, arg3)  this指向Vue

// 以对象方式安装插件
Vue.use({
  install: function () {}
}, arg1, arg2, arg3)

// 源码

  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      // 如果是对象配置的插件  执行install方法 且把plugin整个对象作为this执行  可以拿到plugin配置的内容
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 直接执行plugin  改变作用域为null
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
  
```

#### 1.8 initMixin core/global-api/mixin

- 挂载mixin  混入api  涉及到[mergeOptions](/example/mergeOptions)的调用


> 主要功能是合并 data&props&method以及各种生命周期钩子

```javascript
// 全局调用的mixin是对象  组件放入的是数组 
// mixins元素放的位置也有权重关系  后面的覆盖前面的内容
Vue.mixin({})
mixins: [mixin1, mixin2]

```

- extends和mixins的区别

```javascript
// extends是单个对象  mixins是一个数组 extends相当于一个mixins的元素
// 从下面这段代码顺序可以看出  extends的权重低于mixins
if (!child._base) {
  if (child.extends) {
    parent = mergeOptions(parent, child.extends, vm)
  }
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
}

```

#### 1.9 mergeOptions 合并options

> 这块单独拎出来讲  [mergeOptions](/example/mergeOptions)


#### initExtend core/global-api/extend

- 挂载extend cid计数  ???????? 需要补充extend()方法的用例

```javascript

Vue.extend

```

#### initAssetRegisters  core/global-api/assets

- 注册全局api  Vue.filter()  Vue.component() Vue.directive()  ???????? 需要补充用例


#### 定义ssr相关变量  core/index

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

#### config配置&options扩展&patch

```javascript

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop

```


#### $mount 方法定义挂载

```javascript

// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

```