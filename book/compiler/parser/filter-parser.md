# filter-parser



### parseFilters

> 解析filter

```javascript

/**
* 咱们以这个为例子想玲解析过程<h1 v-bind:xx="('haha' || yyy) | formatValue">todos</h1>
* 1. exp = ('haha' || yyy) | formatValue
* 2. i = 0, paren ++
* 3. i = 1, inSingle = true
* 4. i = 2, 3, 4, 5 haha
* 5. i = 6, inSingle = false
* 6. i = 7, c = '  inSingle = false
* 7, i = 8, 普通空格 
* 8, i = 9, i = \ 但是 i + 1 = | 不符合前后不为pipe的情况  所以不是管道符
* 9, i = 10, 11, 12, 13, 14, 15 = | yyy
* 10, i = 16, )  paren --   paren表示括号计数  此时 = 0
* 11, i = 17 普通空格
* 12, i = 18 |  前后没有管道符  此时括号 总括号  数组括号等计数为0  条件成立 获取expression = ('haha' || yyy)  此时expression结束undefined状态  下一次在匹配到  就是确实filter了
* 13, i = 19, 20, 21...29 结束循环匹配  各种计数也归零 inSingle等为false  如果expression不为undefined  则剩下的lastFilterIndex到i之间的string就是filter表达式
* 14, 上面没有列举多层filter的情况  如果有 则会在循环中处理中间的filter  末尾处理最后的filter  pushFilter
* */


export function parseFilters (exp: string): string {
  // 判断单双引号包裹
  let inSingle = false
  let inDouble = false
  let inTemplateString = false
  let inRegex = false
  let curly = 0
  let square = 0
  let paren = 0
  let lastFilterIndex = 0 // 下一个filter的开始   上一个filter的结束
  let c, prev, i, expression, filters

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)
    //
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) inSingle = false // 0x5C \
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) inDouble = false
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) inRegex = false
    } else if (
      c === 0x7C && // pipe
      // 表达式有可能是   v-bind:xx="'haha' | formatValue"  v-bind:xx='"haha" | formatValue'  v-bind:xx="('haha' || ifShow) | formatValue"
      // 判断是否在 |的前后是否不为|  且单引号 双引号 括号等计数为0
      // 从左侧开始  遇见第一个单引号  记为inSingle 且
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren
    ) {
      // 先提取表达式  在往后就是filter
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1
        expression = exp.slice(0, i).trim()
      } else {
        // expression表达式已经有了   接下来还走这里就是filter表达式了
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break         // "
        case 0x27: inSingle = true; break         // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break                 // (
        case 0x29: paren--; break                 // )
        case 0x5B: square++; break                // [
        case 0x5D: square--; break                // ]
        case 0x7B: curly++; break                 // {
        case 0x7D: curly--; break                 // }
      }
      if (c === 0x2f) { // /
        let j = i - 1
        let p
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true
        }
      }
    }
  }
  // 收尾处理 如果expression是undefined表示没有管道  就是普通一个表达式
  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    pushFilter()
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i])
    }
  }

  return expression
}

```

### wrapFilter

> 解析出filter表达式后  进行代码拼接处理

```javascript

/**
* 设 <h1 v-bind:xx="('haha' || yyy) | formatValue | formatSize">todos</h1>
* return _f("formatSize")(_f("formatValue")(('haha' || yyy)))  // 先知道这个结果  后面介绍怎么用
* */
function wrapFilter (exp: string, filter: string): string {
  const i = filter.indexOf('(')
  // 表示无参filter
  if (i < 0) {
    // _f: resolveFilter
    return `_f("${filter}")(${exp})`
  } else {
    const name = filter.slice(0, i)
    const args = filter.slice(i + 1)
    return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
  }
}

```