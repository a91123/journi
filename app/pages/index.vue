<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold text-ink">我的旅程</h1>
        <div class="flex items-center gap-2 mt-0.5">
          <p class="text-sm font-mono text-ink-faint tracking-wide">{{ String(trips.length).padStart(2, '0') }} TRIPS</p>
          <span class="text-stub">·</span>
          <button @click="exportTrips" class="text-xs font-mono text-ink-faint hover:text-airmail-blue hover:underline underline-offset-2 transition-colors">匯出備份</button>
          <span class="text-stub">·</span>
          <button @click="triggerImport" class="text-xs font-mono text-ink-faint hover:text-airmail-blue hover:underline underline-offset-2 transition-colors">匯入備份</button>
        </div>
        <p v-if="importMessage" class="text-xs font-mono mt-1" :class="importError ? 'text-airmail-red' : 'text-stamp-gold'">{{ importMessage }}</p>
        <input ref="fileInputRef" type="file" accept="application/json" class="hidden" @change="onImportFile" />
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/trips/new"
          class="bg-airmail-red hover:bg-airmail-red/90 text-paper-raised px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          + 新增
        </NuxtLink>
      </div>
    </div>

    <div v-if="trips.length === 0" class="text-center py-20 border-2 border-dashed border-stub rounded-2xl">
      <div class="text-5xl mb-4">🌍</div>
      <p class="text-ink font-display font-semibold">還沒有旅程</p>
      <p class="text-ink-faint text-sm mt-1 font-mono">點右上角開始規劃你的第一趟旅程</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <NuxtLink
        v-for="trip in trips"
        :key="trip.id"
        :to="`/trips/${trip.id}`"
        class="group flex bg-paper-raised rounded-2xl border border-stub overflow-hidden hover:shadow-md hover:border-ink/25 transition-all"
      >
        <div class="airmail-stripe w-1.5 flex-shrink-0"></div>
        <div class="w-[72px] flex-shrink-0 flex flex-col items-center justify-center py-4">
          <span class="font-mono text-3xl font-semibold text-ink leading-none">{{ trip.days }}</span>
          <span class="font-mono text-[10px] tracking-widest text-ink-faint mt-1">DAYS</span>
        </div>
        <div class="w-px perforated-v flex-shrink-0"></div>
        <div class="flex-1 p-4 min-w-0">
          <h2 class="font-display font-bold text-ink text-lg group-hover:text-airmail-blue transition-colors truncate">
            {{ trip.destination }}
          </h2>
          <p class="font-mono text-xs text-ink-faint mt-1.5 tracking-wide">
            {{ formatDate(trip.startDate) }} → {{ formatDate(trip.endDate) }}
          </p>
          <div v-if="trip.budget" class="mt-2.5 inline-block font-mono text-[11px] text-stamp-gold border border-stamp-gold/40 rounded px-1.5 py-0.5">
            NT$ {{ Number(trip.budget).toLocaleString() }}
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip } from '~/stores/useTripsStore'

const tripsStore = useTripsStore()
onMounted(() => {
  tripsStore.load()
})
const trips = computed(() => tripsStore.trips)

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// JSON 匯出／匯入：換裝置或清瀏覽器資料時的保險絲
const fileInputRef = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importError = ref(false)

const exportTrips = () => {
  const data = JSON.stringify(tripsStore.trips, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journi-backup-${new Date().toISOString().substring(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const triggerImport = () => {
  importMessage.value = ''
  fileInputRef.value?.click()
}

const isValidTrip = (t: unknown): t is Trip => {
  if (!t || typeof t !== 'object') return false
  const trip = t as Record<string, unknown>
  return typeof trip.id === 'string' && typeof trip.destination === 'string'
    && typeof trip.startDate === 'string' && typeof trip.endDate === 'string'
    && typeof trip.days === 'number' && Array.isArray(trip.itinerary)
}

const onImportFile = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    const parsed = JSON.parse(await file.text())
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isValidTrip)) {
      throw new Error('invalid backup format')
    }
    if (!confirm(`確定要匯入這份備份嗎？共 ${parsed.length} 趟旅程，已存在的旅程不會被覆蓋。`)) return
    const { added, skipped } = tripsStore.importTrips(parsed)
    importError.value = false
    importMessage.value = `匯入完成：新增 ${added} 趟${skipped > 0 ? `，跳過 ${skipped} 趟重複` : ''}`
  } catch {
    importError.value = true
    importMessage.value = '匯入失敗，請確認是 journi 匯出的備份檔'
  }
}
</script>
