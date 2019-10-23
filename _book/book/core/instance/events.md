# events

## 流程图


![events](https://chunmu.github.io/gitbook-vue/assets/pictures/core-instance-events.jpg "core-instance-events.jpg")

### $on

```javascript

Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
  const vm: Component = this
  // 如果传进来的是数组  循环再执行$on
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      vm.$on(event[i], fn)
    }
  } else {
    // _events容器存放fn
    (vm._events[event] || (vm._events[event] = [])).push(fn)
    // optimize hook:event cost by using a boolean flag marked at registration
    // instead of a hash lookup
    // 检测是否有钩子事件
    if (hookRE.test(event)) {
      vm._hasHookEvent = true
    }
  }
  return vm
}

```

### $once

> 单次绑定  执行返回结果不为null时  解绑

```javascript

  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

```

### $off

> 事件解绑

```javascript


  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // 如果没有传进参数  this.$off()  则解绑所有事件
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // array of events
    // 如果是数组 循环解绑
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    // 如果不存在该事件  直接返回就行
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    // 如果没有传入函数参数 置为null
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // specific handler
    // 具体/完整 事件的解绑处理
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      // 解绑具体fn处理函数  解绑的本质是清除回调数组中对应的函数
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

```

### $emit

> 事件触发

```javascript

Vue.prototype.$emit = function (event: string): Component {
  const vm: Component = this
  if (process.env.NODE_ENV !== 'production') {
    const lowerCaseEvent = event.toLowerCase()
    if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
      // @update-Data="handler" 合法
      // this.$emit('update-Data') 非法   如果外部无人监听这个事件  那合法  没关系
      tip(
        `Event "${lowerCaseEvent}" is emitted in component ` +
        `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
        `Note that HTML attributes are case-insensitive and you cannot use ` +
        `v-on to listen to camelCase events when using in-DOM templates. ` +
        `You should probably use "${hyphenate(event)}" instead of "${event}".`
      )
    }
  }
  let cbs = vm._events[event]
  if (cbs) {
    cbs = cbs.length > 1 ? toArray(cbs) : cbs
    const args = toArray(arguments, 1)
    const info = `event handler for "${event}"`
    for (let i = 0, l = cbs.length; i < l; i++) {
      // 调用回调
      invokeWithErrorHandling(cbs[i], vm, args, vm, info)
    }
  }
  return vm
}

```