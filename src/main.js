import { createApp } from 'vue'
import App from './ui/App.vue'
import { AudioManager } from './audio/AudioManager.js'

AudioManager.init()
createApp(App).mount('#app')
