<template>
  <div class="min-h-screen bg-paper">
    <header class="bg-ink px-5 py-4 flex items-center gap-3 relative">
      <button
        v-if="!isHome"
        @click="router.back()"
        class="text-paper/50 hover:text-paper transition-colors text-2xl leading-none flex-shrink-0"
        aria-label="返回"
      >‹</button>
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="text-paper text-xl font-display font-bold tracking-tight">journi</span>
        <span class="text-airmail-red text-xs mt-0.5">✈</span>
      </NuxtLink>
      <button
        @click="openKeyModal"
        class="ml-auto flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-mono transition-colors border flex-shrink-0"
        :class="geminiKey ? 'text-stamp-gold border-stamp-gold/50 bg-stamp-gold/10 hover:bg-stamp-gold/20' : 'text-paper/50 bg-white/5 border-white/15 hover:border-white/30'"
      >
        <span class="text-sm leading-none">{{ geminiKey ? '◉' : '○' }}</span>
        <span>{{ geminiKey ? 'AI KEY SET' : 'AI KEY' }}</span>
      </button>
      <div class="absolute left-0 right-0 bottom-0 h-1 airmail-stripe"></div>
    </header>
    <main class="max-w-2xl lg:max-w-6xl mx-auto px-4 py-6">
      <slot />
    </main>

    <!-- API Key Modal -->
    <div
      v-if="showKeyModal"
      class="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4"
      @click.self="showKeyModal = false"
    >
      <div class="bg-paper-raised rounded-2xl w-full max-w-sm p-5 space-y-4 border border-stub">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-bold text-ink">Gemini API Key</h3>
          <button @click="showKeyModal = false" class="text-ink-faint hover:text-ink text-xl leading-none">×</button>
        </div>
        <p class="text-xs text-ink-faint">
          Key 儲存在本機，不會上傳到伺服器。到
          <span class="text-airmail-blue font-medium">aistudio.google.com</span>
          申請免費 Key。
        </p>
        <input
          v-model="keyInput"
          type="password"
          placeholder="AIza..."
          class="w-full border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue font-mono bg-paper"
          @keydown.enter="confirmKey"
        />
        <div class="flex gap-2">
          <button
            @click="confirmKey"
            class="flex-1 bg-airmail-blue hover:bg-airmail-blue/90 text-paper-raised py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            儲存
          </button>
          <button
            v-if="geminiKey"
            @click="clearKey"
            class="px-4 py-2.5 text-airmail-red/70 hover:text-airmail-red text-sm transition-colors"
          >
            清除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const isHome = computed(() => route.path === '/')

const { geminiKey, loadKey, saveKey } = useGeminiKey()

onMounted(() => {
  loadKey()
})

const showKeyModal = ref(false)
const keyInput = ref('')

const openKeyModal = () => {
  keyInput.value = geminiKey.value
  showKeyModal.value = true
}

const confirmKey = () => {
  saveKey(keyInput.value)
  showKeyModal.value = false
}

const clearKey = () => {
  saveKey('')
  keyInput.value = ''
  showKeyModal.value = false
}
</script>
