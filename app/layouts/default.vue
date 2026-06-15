<template>
  <div class="min-h-screen bg-stone-50">
    <header class="bg-slate-900 px-5 py-4 flex items-center justify-between">
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
