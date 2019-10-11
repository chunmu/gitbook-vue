# initProxy

> vm实例上的数据劫持 完成对实例变量的合法性校验  比如是否与保留字冲突 是否未定义等提示和告警

```javascript

{
  get (),
  set (),
  has ()
}

```

## 流程图

![proxy](https://chunmu.github.io/gitbook-vue/assets/pictures/core-instance-proxy.jpg "core-instance-proxy.jpg")

### hasHandler

> with语句块中 in 操作符调用的是数据对象的has api

```javascript

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

```


### getHandler

> 普通语句访问数据时调用get api

```javascript

    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return target[key]
    }

```