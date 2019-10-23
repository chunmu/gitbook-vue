// 关于展示插件安装js  编号 app00001

var localJson = {
  en: {
    'app.common.name': 'Vue Example'
  },
  zh: {
    'app.common.name': 'Vue关于插件安装示例程序'
  }
}

var $t1 = function () {
  Vue.prototype.$$t1 = function (key) {
    return localJson[this.appLang][key] + 'from func'
  }
}
var $t2 = {
  install: function () {
    Vue.prototype.$$t2 = function (key) {
      return localJson[this.appLang][key] + 'from object'
    }
  }
}

Vue.use($t2)

var app = new Vue({
  el: '.todoapp',
  data: {
    appLang: 'zh'
  }
})


