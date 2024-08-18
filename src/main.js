import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import 'vuetify/styles' // Import Vuetify's styles
import { createVuetify } from 'vuetify' // Import Vuetify
import * as components from 'vuetify/components' // Import all Vuetify components
import * as directives from 'vuetify/directives' // Import all Vuetify directives

// Create a Vuetify instance with the components and directives
const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)

// Use Vuetify instance in the app
app.use(vuetify)

app.mount('#app')
