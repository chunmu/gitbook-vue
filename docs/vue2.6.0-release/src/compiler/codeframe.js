/* @flow */

const range = 2

export function generateCodeFrame (
  source: string,
  start: number = 0,
  end: number = source.length
): string {
  const lines = source.split(/\r?\n/)
  let count = 0
  const res = []
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + 1
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue
        res.push(`${j + 1}${repeat(` `, 3 - String(j + 1).length)}|  ${lines[j]}`)
        const lineLength = lines[j].length
        if (j === i) {
          // push underline
          const pad = start - (count - lineLength) + 1
          const length = end > count ? lineLength - pad : end - start
          res.push(`   |  ` + repeat(` `, pad) + repeat(`^`, length))
        } else if (j > i) {
          if (end > count) {
            const length = Math.min(end - count, lineLength)
            res.push(`   |  ` + repeat(`^`, length))
          }
          count += lineLength + 1
        }
      }
      break
    }
  }
  return res.join('\n')
}

/**
 * 关于字符创重复拼接的实现  如果是我的话  应该是js自带的repeat方法  它这样效率更高还是？
 * */
function repeat (str, n) {
  let result = ''
  if (n > 0) {
    while (true) { // eslint-disable-line
      if (n & 1) result += str // pdd: &运算 转换成二进制 取否定或者肯定   111 & 1 = 110   1110 & 1 = 1111
      n >>>= 1 // pdd: 无符号右移 1111 >>>= 1 (111)  1001 >>>=1 (100)
      if (n <= 0) break
      // pdd: 恰好 如果右移 则str翻倍拼接
      str += str
    }
  }
  return result
}
