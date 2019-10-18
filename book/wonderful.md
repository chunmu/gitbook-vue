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

##### 6. 虚拟dom技术

- 本质是把js对象表示dom节点  与真实dom对象相比  少了很多属性 有兴趣的同学可以get一个dom节点 for in 打印一下看看
- 好处是  在某些场景下并不需要真正创建dom，在虚拟节点中做出拒绝操作dom的命令  可以不必要的dom操作 提高性能
- 对于已经渲染的dom  始终都有一个VNode与之对应  这就有1个dom+1个VNode的情况
- 把比较是否视图更新的diff算法在VNode层实现 这样就节省了操作频繁操作dom的情况

##### 7. 钩子的注册形式  在mergehook的时候做了一层处理

- 单个函数

```javascript

created () {},

```

- 数组形式

```javascript

created: [fn1, fn2]

```

##### 8. 从模板中解析的各种表达式执行原理

> 记得说with语法会影响js的效率。。。

```javascript

let code = `with(this){return _m(0)}`

let render = new Function(code)

vm.render()

```