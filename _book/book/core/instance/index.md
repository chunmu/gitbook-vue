# index

> 万物起源

## 流程

![instance主文件](https://chunmu.github.io/gitbook-vue/assets/pictures/core-instance-index.png "core-instance-index.png")

### Vue

```javascript

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    // 判断是否为new Vue新建的对象  如果不是  报错
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

```