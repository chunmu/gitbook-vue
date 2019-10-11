# options

### normalizeInject

> inject的数据前置处理  <strong>为啥要用from 与default区分</strong>

```javascript

/**
 * Normalize all injections into Object-based format
 */
// 一种是数组类型  inject = ['format']  => 处理成  
/**
* result = {
*   format: {
*     from: 'format'
*   }
* }
* 
* */
// 一种是object  inject = {format: {default: 'xxx'}}
/**
* result = {
*   format: {
*     from: 'format',
*     default: 'xxx',
*     ...
*   }
* }
* */
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

```