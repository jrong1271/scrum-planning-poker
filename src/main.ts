import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import {
  VApp,
  VCard,
  VCardItem,
  VCardTitle,
  VCardText,
  VMain,
  VTextField,
  VBtn,
  VAlert,
  VIcon,
  VProgressCircular,
} from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components: {
    VApp,
    VCard,
    VCardItem,
    VCardTitle,
    VCardText,
    VMain,
    VTextField,
    VBtn,
    VAlert,
    VIcon,
    VProgressCircular,
  },
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#42b883',
          secondary: '#2c3e50',
          accent: '#3aa876',
          error: '#e74c3c',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
