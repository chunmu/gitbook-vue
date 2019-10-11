# 记录一些有趣的发现


##### 1. stringify

```javascript

JSON.stringify(undefined) = '""'   <div slot>show slot</div>  这样就是符合这个情况  然后会获取slot name="default"的去匹配

```

##### 2. .once修饰符的破解之法  如果handler中return null 则会被Vue处理为once未完成  将继续监听

##### 3. 解绑的本质是清除回调数组中对应的函数

##### 4. new Vue({el: '#app''}) 等价于 app = new Vue({}).$mount('#app')  调用mount的不同方式

> 可以看出 数据处理和视图是相互独立的

##### 5. computed属性的cache使用

- computed只有在依赖更新的时候才会更新值  所以每次拿都是某一上个时刻计算的值  
- 设置cache = false  取的时候都是临时再次执行一次获取最新的值 某些特殊场景需要这样  
- 视图只有在依赖更新的时候更新  所以cache = false的时候临时计算的值是js内存中的最新值  不一定反映到视图上
