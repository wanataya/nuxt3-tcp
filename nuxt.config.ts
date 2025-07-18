import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-17',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui'
  ],
  css: ['~/assets/css/main.css'],
  ssr: false,
  app: {       
    head: {
      title: 'Nuxt 3 TCP Communication',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Real-time TCP communication with Nuxt 3' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      socketPort: parseInt(process.env.SOCKET_PORT || '') || 3002,
      tcpPort: parseInt(process.env.TCP_PORT || '') || 3001
    }
  }
})