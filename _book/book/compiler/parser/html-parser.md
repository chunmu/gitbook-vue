# html-parser


<br>
需要注意的点


```javascript

浏览器会替换掉<  自动转译该类字符  < 会被替换成&lt;

```

<br>

## 流程图 

![编译html的流程图](https://chunmu.github.io/gitbook-vue/assets/pictures/compiler-parser-html-parser.jpg "编译html的流程图")

### attribute

> 正则attribute分析

```javascript

const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

// 可以匹配到的情况如下  v-bind:xx="xx" v-bind:xx='xx'  @xx xx yy=ff #xx="xx" @xx="xx" <div xx>

// ^\s*([^\s"'<>\/=]+) 以空白符开头匹配零或多次且后续不能出现 \s"'<>\/= 特殊符号

// (?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))
// 第一层表达式  非捕获组 节省内存  

// \s*(=)
// 空白符开头  也就是属性名称和=号之间可以出现空白符和特殊字符  v-bind:xx ="xxx" 是合法的

// \s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+))
// \s*  =号之后出现空白符是合法的  例如 v-bind:xx = "xxx"
// 匹配双引号 单引号 或者不是这些开头  例子: xx=xxx

// "([^"]*)"+  这个+我没看懂  有大神看懂的跟我说一声  指的是"可以一个或者多个?

```

### dynamicArgAttribute

> 动态属性名称的正则匹配

```javascript

// dynamicArgAttribute 不同的点是匹配  v-bind[xxx]="xxx"  xxx是一个变量的情况
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

```

### parseHTML

> 这个比较复杂  


```javascript

export function parseHTML (html, options) {
  /**
  *  stack的用法   <div1><div2><img /></div2></div1>   这是正常情况
  * 1. stack.push(div1) stack = ['div1'] 2. stack.push(div2) stack = ['div1', 'div2'] img为自闭合标签 不放入stack  
  * 3. parseEndTag时   stack.pop()
  * */
  
  /**
  * 第一种异常情况
  * stack的用法   <div 1><div 2><div 3><img /></div 2></div 1>   
  * 1. stack.push(div 1) stack = ['div 1'] 
  * 2. stack.push(div 2) stack = ['div 2'] 
  * 3. stack.push(div 3) stack = ['div 3'] 
  * 4. 匹配到</div2> </div3> parseEndTag('div1, div2')之后 stack = ['div1']
  * 5. 在parseHtml最后 执行一次无参parseEndTag()  定位标记pos = 0 如果stack还有数据 铁定有匹配不到的  报错
  * */
  
  /**
  * 第二种异常情况
  * stack的用法   <div 1><div 2><img /></div 3></div 2></div 1>   
  * 1. stack.push(div 1) stack = ['div 1'] 
  * 2. stack.push(div 2) stack = ['div 2'] 
  * 3. </div 3> => <div 2>      </div 2> => <div 1>     </div 1> 找不到匹配的标签   
  * 4. pos = -1   跳过处理   在循环末尾处理为 pos = 0   stack.length = 0 清空堆栈
  * */
  const stack = []
  const expectHTML = options.expectHTML
  //  <img />  这样的自闭合标签
  const isUnaryTag = options.isUnaryTag || no
  // 可以省略闭合标签的标签  <p></p>  如果非自闭合标签 则会提示未找到对应标签的结束tag
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  let index = 0 // 游标 记录当前索引位置
  let last, lastTag // lastTag表示最深层次的标签   
  /**
  * eg. <div><div><img /></div></div>
  * */
  // 循环处理html内容 每进行一份内容的处理 调用advance向前移动索引 截取剩余html html = html.substring(index)
  while (html) {
    // last表示上一次所备份的string
    last = html
    // Make sure we're not in a plaintext content element like script/style
    // lastTag = 最后一个标签 ? 或者是最内层标签？ 还没弄懂
    // isPlainTextElement是否为富文本标签  不用分割处理 script style textarea
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // <div>xxx<div> textEnd是否为<  如果索引为0  则是标签解析开始 负责还是文字内容text部分
      let textEnd = html.indexOf('<')
      // 如果<的索引为0 起始位置  正常开局
      if (textEnd === 0) {
        // Comment: 注释标签
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              // 是否要保留注释内容  options.comment(内容, 注释开始位置 包括<!--, 注释结束位置 包括-->)
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
            }
            //  索引后移到注释内容之后
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        // 条件注释  没做处理 直接后移索引
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
        /**
         * 如果textEnd大于0 则在<之前的内容可以视为普通文本 <div>xxx<xxx</div>  示例  parse0001
         *
         * */
        rest = html.slice(textEnd)
        // console.log(!endTag.test(rest), !startTagOpen.test(rest), rest)
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
          // ##########
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
      // 如果存在lastTag或者lastTag为富文本标签 走这里
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
      // 格式不正确的处理告警
      // html = 'xxxx<////div>'
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
      // expectHTML 是否与浏览器保持行为一致   比如<p>标签内部是否允许嵌套块标签  <p><div></div></p>
      // <p>pp<div>div</div></p>   浏览器和vue的处理结果为  <p>pp</p><div>div</div><p></p>  
      // 浏览器自带优化机制  会填充至正确格式  要设置这个场景的话  重写html 可以发现vue表现和浏览器一致
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      // 这个比较好理解  lastTag 也就是堆栈 stack的最后一个标签元素  等于当前处理的标签元素
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
      // let html = 'v-html="html | xxxxxxxx"'  args[3]
      // let html = "v-html='html | xxxx'"  args[4]
      // let html = "v-html=html"   args[5]
      // 经过浏览器后 会统一被替换成args[3]  所以后两种可以直接在代码中设置  html = <div v-html='xxx'>
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
      // 如果是非自闭合标签  则push到stack中
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
      // 找出最靠近的对应标签
      for (let i = stack.length - 1; i >= pos; i--) {
        // 如果tagName存在 则i == pos也就是回溯一个位置理论上应该找到起始标签
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          // 没找到表示无匹配标签
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
      // 截取剩下的
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