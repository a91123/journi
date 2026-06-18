<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">我的旅程</h1>
        <p class="text-sm text-slate-400 mt-0.5">{{ trips.length }} 趟旅程</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="openKeyModal"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border"
          :class="geminiKey ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-slate-500 bg-white border-stone-200 hover:border-amber-300'"
        >
          <span class="text-base leading-none">🔑</span>
          <span>{{ geminiKey ? 'AI 已設定' : 'AI Key' }}</span>
        </button>
        <NuxtLink
          to="/trips/new"
          class="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          + 新增
        </NuxtLink>
      </div>
    </div>

    <div v-if="trips.length === 0" class="text-center py-24">
      <div class="text-5xl mb-4">🌍</div>
      <p class="text-slate-500 font-medium">還沒有旅程</p>
      <p class="text-slate-400 text-sm mt-1">點右上角開始規劃你的第一趟旅程</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <NuxtLink
        v-for="trip in trips"
        :key="trip.id"
        :to="`/trips/${trip.id}`"
        class="bg-white rounded-2xl border border-stone-200 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="font-bold text-slate-800 text-lg group-hover:text-amber-600 transition-colors">
              {{ trip.destination }}
            </h2>
            <p class="text-sm text-slate-400 mt-1">
              {{ formatDate(trip.startDate) }} → {{ formatDate(trip.endDate) }}
            </p>
          </div>
          <span class="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            {{ trip.days }} 天
          </span>
        </div>
        <div v-if="trip.budget" class="mt-3 text-xs text-slate-400">
          預算 NT$ {{ Number(trip.budget).toLocaleString() }}
        </div>
      </NuxtLink>
    </div>

    <!-- API Key Modal -->
    <div
      v-if="showKeyModal"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="showKeyModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800">Gemini API Key</h3>
          <button @click="showKeyModal = false" class="text-slate-300 hover:text-slate-500 text-xl leading-none">×</button>
        </div>
        <p class="text-xs text-slate-400">
          Key 儲存在本機，不會上傳到伺服器。到
          <span class="text-amber-600 font-medium">aistudio.google.com</span>
          申請免費 Key。
        </p>
        <input
          v-model="keyInput"
          type="password"
          placeholder="AIza..."
          class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 font-mono"
          @keydown.enter="confirmKey"
        />
        <div class="flex gap-2">
          <button
            @click="confirmKey"
            class="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            儲存
          </button>
          <button
            v-if="geminiKey"
            @click="clearKey"
            class="px-4 py-2.5 text-red-400 hover:text-red-600 text-sm transition-colors"
          >
            清除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const tripsStore = useTripsStore()
onMounted(() => {
  tripsStore.load()
  loadKey()
})
const trips = computed(() => tripsStore.trips)

const { geminiKey, loadKey, saveKey } = useGeminiKey()

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

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>
