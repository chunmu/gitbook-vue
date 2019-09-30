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

let child = {
  props: {
    xxx: {}
  },
  template: `<div>
      <header slot="header"></header>
      <footer>xxx</footer>
    </div>`,
  name: 'child-component'
}

var app = new Vue({
  // app initial state
  props: {
    booll: {
      type: Boolean
    },
  },
  data: {
    users: [
      {
        name: 'chunmu.zhang',
        info: {
          weight: '120'
        },
        password: '123456'
      },
      {
        name: 'zeng.zeng',
        info: {
          weight: '120'
        },
        password: '34567'
      },
      {
        name: 'xiu.zhang',
        info: {
          weight: '120'
        },
        password: 'test'
      }
    ],
    form: {
      yyy: 'xxx'
    },
    inputType: 'text',
    yyy: 'yyy',
    xxx: 'propsXXXX',
    todos: todoStorage.fetch(),
    newTodo: '',
    editedTodo: null,
    visibility: 'all'
  },



  // computed properties
  // https://vuejs.org/guide/computed.html


  // methods that implement data logic.
  // note there's no DOM manipulation here at all.

  components: {
    'child-component': child
  },

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
app.$mount('.todoapp')
