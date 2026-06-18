export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
