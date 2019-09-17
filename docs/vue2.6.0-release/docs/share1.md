### VUE 

> 万物起源

```javascript

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    // 如果this instanceof Vue 不是通过 new Vue()这种方式创建的对象抛出报错
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 待会讲这个
  this._init(options)
}

```


### mixins

>  挂载各种方法到Vue.prototype
```javascript

initMixin(Vue) //  _init, 


stateMixin(Vue) // $data, $props, $set, $delete, $watch

// 这里需要强调一点的是$data, $props分别作为对data, props的代理对象 只提供访问功能，不提供复制功能
// 如果用户有赋值行为 将会出发警告
// 设置目标对象为只读(readonly)时  重写set方法  后续将会出现更多这样处理的场景
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
Object.defineProperty(Vue.prototype, '$data', dataDef)
Object.defineProperty(Vue.prototype, '$props', propsDef)


eventsMixin(Vue) // $on, $once, $off, $emit
lifecycleMixin(Vue) // _update, $forceUpdate, $destroy, 

renderMixin(Vue) // $nextTick, _render,
// renderMixin中挂载的方法
export function installRenderHelpers (target: any) {
  target._o = markOnce
  target._n = toNumber
  target._s = toString
  target._l = renderList
  target._t = renderSlot
  target._q = looseEqual
  target._i = looseIndexOf
  target._m = renderStatic
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode
  target._e = createEmptyVNode
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}

 
initUse(Vue) //
initMixin(Vue) //
initExtend(Vue) // 
initAssetRegisters(Vue) //

```

### initGlobalAPI

```javascript

export function initGlobalAPI (Vue: GlobalAPI) {
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    // 禁止用户修改config对象 并给出警告
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 暴露出warn， extend, mergeOptions, defineReactive 方法 
  // extend是合并对象的工具方法 mergeOptions是options合并策略工具方法
  // 放置在构造函数对象上的方法  可以从外部 Vue访问到  用户可以使用这些 但是不建议这样做 有风险
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick


  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  // 很多地方用到这个方法创建比较干净的空对象  以null为原型创建对象 
  // 关于__proto__  prototype https://www.jianshu.com/p/686b61c4a43d
  // 示例html文件  object-create.html
  Vue.options = Object.create(null)
  
  // 在Vue.options上挂载三个空对象 components, filters, directives
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  // 挂载第一个全局组件的对象 KeepAlive
  extend(Vue.options.components, builtInComponents)
  // 组件对象的本质 就是这样一个对象
  {
    name: '',
    components: {},
    mixins: [],
    data () {},
    methods: {},
    ...
  }

  initUse(Vue) // Vue.use
  initMixin(Vue) // Vue.mixin
  initExtend(Vue) // Vue.extend
  
  initAssetRegisters(Vue) // 在Vue构造函数上挂载三个方法 component, filter, directive  如果存在则获取，如果不存在则赋值并获取
}

```w

### initAssetRegisters

```javascript

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}


```

### runtime/index.js

```javascript

// install platform specific utils
Vue.config.mustUseProp = mustUseProp // 稍后解释这个的作用
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
// 初始化directives对象和components对象
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function  
// 挂载__patch__方法
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
// 挂载$mount方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

```


### resolveConstructorOptions

> options数据的merge处理

```javascript

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 有super属性，说明Ctor是Vue.extend构建的子类
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

```

### initProxy

```javascript

let initProxy

if (process.env.NODE_ENV !== 'production') {
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )
  // pdd: here  就是经常出现的提示 未定义直接使用的警告
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

  // pdd: 保留字的占用提醒
  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }

  const hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy)

  if (hasProxy) {
    // pdd: 在修饰符中可能出现的str
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    // pdd: 代理处理keycode的设置处理 统一对可能的冲突进行拦截处理
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          target[key] = value
          return true
        }
      }
    })
  }

  const hasHandler = {
    has (target, key) {
      const has = key in target
      const isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      if (!has && !isAllowed) {
        // pdd: 如果是保留字段 提示占用  否则提示未定义
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }

  const getHandler = {
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return target[key]
    }
  }

  // 统一进行保留字段的校验处理
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
}

export { initProxy }

```


### initLifecycle

```javascript

export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  // 找寻父级组件链表中第一个非抽象组件  例如<transition></transition> <router-view>等类似
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

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

### initEvents


```javascript

vm._events = Object.create(null)
vm._hasHookEvent = false 
// init parent attached events
const listeners = vm.$options._parentListeners
if (listeners) {
  updateComponentListeners(vm, listeners)
}

```


### html-parser

```javascript

// 这边正则好复杂  等我学ok了再细看
// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 起始标签的左右尖括号
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
// 结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being pased as HTML comment when inlined in page
const comment = /^<!\--/
// 条件注释
const conditionalComment = /^<!\[/

// Special Elements (can contain anything)
// 特殊富文本标签  可以包含所有内容
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
}
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

function decodeAttr (value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, match => decodingMap[match])
}

export function parseHTML (html, options) {
  const stack = []
  const expectHTML = options.expectHTML
  //  <img />  这样的自闭和标签
  const isUnaryTag = options.isUnaryTag || no
  // 可以省略闭合标签的标签
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  let index = 0
  let last, lastTag
  while (html) {
    last = html
    // Make sure we're not in a plaintext content element like script/style
    // lastTag = 最后一个标签 ? 或者是最内层标签？ 还没弄懂
    // isPlainTextElement是否为富文本标签  不用分割处理 script style textarea
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // <div>xxx<div> textEnd是否为<  如果索引为0  则是标签解析开始 负责还是文字内容text部分
      let textEnd = html.indexOf('<')
      if (textEnd === 0) {
        // Comment: 注释标签
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              // 是否要保留注释内容  options.comment(内容, 注释开始位置 包括<!--, 注释结束位置 包括-->)
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
            }
            //  索引后移到注释之后
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        // 条件注释  没做处理 直接后移索引?
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype: doctype标签
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag: 结束标签匹配
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          // </custom-item>  endTagMatch[0] = </custom-item>  endTagMatch[1] = custom-item
          // <custom-item />  endTagMatch[0] = />  endTagMatch[1] = ''
          advance(endTagMatch[0].length)
          // 结束标签处理
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag: 放后面的原因是需要做相对较多的额外处理 所以从性能角度来讲放后面更优
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          // 处理开始标签
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }

      let text, rest, next
      if (textEnd >= 0) {
        rest = html.slice(textEnd)
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          // < 是富文本成员 忽略并把它作为text
          // 循环找出<  如果找到了且没有符合各种标签  则textend后移
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        // 如果存在某种标签匹配  则记录无匹配text段  后续控制index后移text长度
        text = html.substring(0, textEnd)
      }

      // 找不到html中的各种标签 表示为纯文本
      if (textEnd < 0) {
        text = html
      }

      // 找出text段 后移主索引
      if (text) {
        advance(text.length)
      }

      // options字符处理
      if (options.chars && text) {
        options.chars(text, index - text.length, index)
      }
    } else {
      let endTagLength = 0
      const stackedTag = lastTag.toLowerCase()
      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    if (html === last) {
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`, { start: index + html.length })
      }
      break
    }
  }

  // Clean up any remaining tags
  // html处理完成 清空stack
  parseEndTag()

  function advance (n) {
    // 索引后移&html切割
    index += n
    html = html.substring(n)
  }

  function parseStartTag () {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      let end, attr
      // 依次匹配 找出属性
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        attr.start = index
        advance(attr[0].length)
        attr.end = index
        if (attr[0].indexOf('@keyup.ente') > 0) {
        }
        match.attrs.push(attr)
      }
      if (end) {
        // <div></div> || <components /> end[1] = '' || '/'
        // 是否自闭和就看是否有值
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash

    // 个人猜测这个变量的意思是是否需要同步html的行为表现 比如p标签没有起始标签也可以通过
    // isNonPhrasingTag
    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    // 是否为自闭和标签
    const unary = isUnaryTag(tagName) || !!unarySlash

    const l = match.attrs.length
    // new Array(9) 直接构造一个指定长度的数组
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      const value = args[3] || args[4] || args[5] || ''
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length
        attrs[i].end = args.end
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      lastTag = tagName
    }
    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  // 处理结束标签内容
  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    // 找相隔最近的开始标签对齐
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
      // 逆向查找
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        // 如果tagName存在 则i == pos也就是回溯一个位置理论上应该找到起始标签
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`,
            { start: stack[i].start, end: stack[i].end }
          )
        }
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      // 移除放置在堆栈中的tag 配对完成 且更新lastTag
      // 如果tagName == null || '' 则会清空stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
      // 一下pos为-1的情况 br或者p标签都可以没有开始标签 也能够正常解析
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}


```
