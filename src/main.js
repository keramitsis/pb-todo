import './app.css'
import App from './App.svelte'
import { registerServiceWorker } from './pwa'

const app = new App({
  target: document.getElementById('app')
})

registerServiceWorker()

export default app
