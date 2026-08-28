import Vue from 'vue'
import App from './App.vue'
import CustomTabBar from './components/CustomTabBar.vue'
import LazyImage from './components/LazyImage.vue'
import SiteHeader from './components/SiteHeader.vue'
import SiteInput from './components/SiteInput.vue'

Vue.config.productionTip = false
Vue.component('CustomTabBar', CustomTabBar)
Vue.component('LazyImage', LazyImage)
Vue.component('SiteHeader', SiteHeader)
Vue.component('SiteInput', SiteInput)

App.mpType = 'app'

const app = new Vue({
  render: h => h(App)
})
app.$mount()
