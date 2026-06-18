<template>
  <div class="min-h-screen bg-stone-50">
    <header class="bg-stone-900 px-5 py-4 flex items-center gap-3">
      <button
        v-if="!isHome"
        @click="router.back()"
        class="text-slate-400 hover:text-white transition-colors text-2xl leading-none flex-shrink-0"
        aria-label="返回"
      >‹</button>
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="text-amber-400 text-xl font-black tracking-tight">journi</span>
        <span class="text-slate-500 text-xs mt-0.5">✈</span>
      </NuxtLink>
    </header>
    <main class="max-w-2xl lg:max-w-6xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const isHome = computed(() => route.path === '/')
</script>
