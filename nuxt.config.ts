// Nuxt config — CopaDataHub 2026 (migração progressiva).
// Render: SPA (ssr: false). State: Pinia. PWA: @vite-pwa/nuxt.

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  css: [
    '~/assets/css/main.css'
  ],

  app: {
    head: {
      title: 'CopaDataHub 2026',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0a0e1a' },
        { name: 'description', content: 'Hub de dados do Mundial 2026 — partidas, escalações, estatísticas e palpites.' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'CopaDataHub 2026',
      short_name: 'CopaHub',
      description: 'Hub de dados do Mundial 2026',
      theme_color: '#0a0e1a',
      background_color: '#0a0e1a',
      display: 'standalone',
      lang: 'pt-BR',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico}']
    },
    client: { installPrompt: true }
  },

  imports: {
    dirs: ['stores', 'composables', 'utils']
  },

  typescript: { strict: false, shim: false }
})
