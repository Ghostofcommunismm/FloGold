import { createApp } from 'vue'
import App from './App.vue'
import LiquidGlass from '@wxperia/liquid-glass-vue'
import './style.css'

createApp(App)
  .use(LiquidGlass)
  .mount('#app')
