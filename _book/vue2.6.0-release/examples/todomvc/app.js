// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~150 lines.

// localStorage persistence
var STORAGE_KEY = 'todos-vuejs-2.0'
var todoStorage = {
  fetch: function () {
    var todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    todos.forEach(function (todo, index) {
      todo.id = index
    })
    todoStorage.uid = todos.length
    return todos
  },
  save: function (todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }
}

// visibility filters
var filters = {
  all: function (todos) {
    return todos
  },
  active: function (todos) {
    return todos.filter(function (todo) {
      return !todo.completed
    })
  },
  completed: function (todos) {
    return todos.filter(function (todo) {
      return todo.completed
    })
  }
}

let grandSon = {
  inject: ['getMap'],
  props: {
    xxx: {}
  },
  template: `<div>
      <span @click="handleClick">grandSon click</span>
      <footer>grandSon</footer>
    </div>`,
  name: 'grandSon-component',
  methods: {
    handleClick () {
      this.$emit('update-Click')
    }
  }
}

let child = {
  components: { grandSon },
  inject: ['getMap'],
  props: {
    xxx: {}
  },
  template: `<div>
      <slot name="header"></slot>
      <slot></slot>
      <span @click="handleClick">child click</span>
      <footer>child</footer>
      <grand-son></grand-son>
    </div>`,
  name: 'child-component',
  methods: {
    handleClick () {
      this.$emit('update-Click')
    }
  }
}

var app = new Vue({
  el: '.todoapp',
  // app initial state
  data: {
    yyy: 'yyy',
    xxx: 'xxx'
  },
  beforeMount: [function () {
    console.log('beforeMount')
  }, function () {
    console.log('22222')
  }],
  methods: {
    handleClick () {
      this.yyy += 'kkkkk'
    }
  },


  // computed properties
  // https://vuejs.org/guide/computed.html


  // methods that implement data logic.
  // note there's no DOM manipulation here at all.


  // a custom directive to wait for the DOM to be updated
  // before focusing on the input field.
  // https://vuejs.org/guide/custom-directive.html
  directives: {
    'todo-focus': function (el, binding) {
      if (binding.value) {
        el.focus()
      }
    }
  }
})

// handle routing
function onHashChange () {
  var visibility = window.location.hash.replace(/#\/?/, '')
  if (filters[visibility]) {
    app.visibility = visibility
  } else {
    window.location.hash = ''
    app.visibility = 'all'
  }
}

window.addEventListener('hashchange', onHashChange)
onHashChange()

// mount
// app.$mount('.todoapp')
