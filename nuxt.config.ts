export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  imports: {
    dirs: ['stores', 'app/stores']
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vant/nuxt',
    // '@nuxtjs/supabase', // TODO: 設定好 Supabase 帳號後開啟
  ],
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    public: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    }
  }
})
