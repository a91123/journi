<template>
  <!-- AI 推薦側邊抽屜 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="show" class="fixed inset-0 z-50 flex justify-end" @click.self="close">
        <!-- 半透明遮罩 -->
        <div class="absolute inset-0 bg-black/20" @click="close"></div>
        <!-- 抽屜本體 -->
        <div class="relative w-96 h-full bg-white shadow-2xl flex flex-col overflow-hidden">
          <!-- 抽屜 Header -->
          <div class="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
            <div>
              <p class="font-bold text-stone-900 text-base">AI 景點推薦</p>
              <p class="text-xs text-stone-400 mt-0.5">{{ trip.destination }}</p>
            </div>
            <button @click="close" class="text-stone-300 hover:text-stone-600 text-2xl leading-none transition-colors">×</button>
          </div>
          <!-- 類別篩選 -->
          <div class="px-5 py-3 flex gap-2 flex-shrink-0 border-b border-stone-100">
            <button
              v-for="cat in aiCategories"
              :key="cat.key"
              @click="aiCategory = cat.key"
              class="text-xs px-3 py-1.5 rounded-full border transition-all"
              :class="aiCategory === cat.key
                ? 'bg-stone-900 border-stone-900 text-white font-semibold'
                : 'border-stone-200 text-stone-500 hover:border-stone-400'"
            >{{ cat.label }}</button>
          </div>
          <!-- 內容 -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <div v-if="aiLoading" class="flex flex-col items-center justify-center h-40 gap-3">
              <div class="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm text-stone-400">正在推薦中…</p>
            </div>
            <div v-else-if="currentBatch.length === 0" class="flex flex-col items-center justify-center h-40 gap-3">
              <p class="text-stone-400 text-sm">點擊開始獲取推薦</p>
              <button
                @click="fetchRecommendations"
                class="bg-amber-400 hover:bg-amber-500 text-stone-900 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
              >開始推薦</button>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in currentBatch"
                :key="item.id"
                class="border border-stone-100 rounded-xl p-4 hover:border-stone-200 hover:shadow-sm transition-all"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <p class="font-semibold text-stone-800 text-sm leading-snug">{{ item.name }}</p>
                  <button
                    @click="openSchedule(item)"
                    :disabled="addedIds.includes(item.id)"
                    class="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    :class="addedIds.includes(item.id) ? 'bg-stone-100 text-stone-400 cursor-default' : 'bg-amber-400 hover:bg-amber-500 text-stone-900'"
                  >{{ addedIds.includes(item.id) ? '✓ 已加入' : '排入' }}</button>
                </div>
                <p class="text-xs text-stone-400 leading-relaxed">{{ item.description }}</p>
                <p class="text-xs text-stone-300 mt-2">⏱ 約 {{ item.duration }} 小時</p>
              </div>
              <div class="flex justify-between items-center pt-1">
                <button @click="nextBatch" class="text-sm text-stone-400 hover:text-stone-700 transition-colors">換一批 →</button>
                <span class="text-xs text-stone-300">{{ batchIndex * 5 + 1 }}–{{ Math.min((batchIndex + 1) * 5, allRecommendations.length) }} / {{ allRecommendations.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- AI 推薦排入行程 dialog -->
  <div
    v-if="schedulingItem"
    class="fixed inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center p-4"
    @click.self="closeSchedule"
  >
    <div class="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
      <div>
        <p class="font-bold text-slate-800 text-base leading-snug">{{ schedulingItem.name }}</p>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ schedulingItem.description }}</p>
      </div>

      <button
        @click="addFromAi(schedulingItem); closeSchedule()"
        class="w-full py-2.5 rounded-xl text-sm font-bold bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors"
      >加入備用</button>

      <div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">或直接排入</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(day, i) in dayList"
            :key="day.date"
            @click="scheduleDay = day.date"
            class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border"
            :class="scheduleDay === day.date
              ? 'bg-amber-400 border-amber-400 text-slate-900'
              : 'bg-white border-stone-200 hover:border-amber-300 text-slate-600'"
          >Day {{ i + 1 }} {{ day.label }}</button>
        </div>
      </div>

      <div v-if="scheduleDay">
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">時間（選填）</label>
        <TimePicker v-model="scheduleTime" />
      </div>

      <div class="flex gap-2 pt-1">
        <button
          @click="scheduleAiItem"
          :disabled="!scheduleDay"
          class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
          :class="scheduleDay ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-stone-100 text-slate-300 cursor-not-allowed'"
        >排入行程</button>
        <button @click="closeSchedule" class="px-5 py-2.5 text-slate-400 hover:text-slate-600 text-sm transition-colors">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, TripEntry } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

export interface AiRecommendation {
  id: string
  name: string
  description: string
  duration: number | string
  category: string
}

const props = defineProps<{ trip: Trip; dayList: DayInfo[]; show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()
const tripsStore = useTripsStore()
const { geminiKey } = useGeminiKey()

const close = () => emit('update:show', false)

const aiCategories = [
  { key: 'all', label: '全部' },
  { key: 'food', label: '美食' },
  { key: 'culture', label: '文化' },
  { key: 'nature', label: '自然' },
  { key: 'shopping', label: '購物' }
]
const aiCategory = ref('all')
const aiLoading = ref(false)
const allRecommendations = ref<AiRecommendation[]>([])
const batchIndex = ref(0)
const addedIds = ref<string[]>([])

const currentBatch = computed(() => {
  const filtered = aiCategory.value === 'all'
    ? allRecommendations.value
    : allRecommendations.value.filter(r => r.category === aiCategory.value)
  return filtered.slice(batchIndex.value * 5, (batchIndex.value + 1) * 5)
})

const fetchRecommendations = async () => {
  aiLoading.value = true
  batchIndex.value = 0
  addedIds.value = []
  try {
    const res = await $fetch('/api/recommendations', {
      method: 'POST',
      body: { destination: props.trip.destination, category: aiCategory.value, apiKey: geminiKey.value }
    })
    allRecommendations.value = res.attractions
  } catch (e) {
    console.error(e)
  } finally {
    aiLoading.value = false
  }
}

const nextBatch = () => {
  const filtered = aiCategory.value === 'all'
    ? allRecommendations.value
    : allRecommendations.value.filter(r => r.category === aiCategory.value)
  const maxBatch = Math.ceil(filtered.length / 5) - 1
  batchIndex.value = batchIndex.value >= maxBatch ? 0 : batchIndex.value + 1
}

watch(aiCategory, () => {
  batchIndex.value = 0
})

const addFromAi = (item: AiRecommendation) => {
  tripsStore.addToStandby(props.trip.id, {
    category: item.category === 'food' ? 'food' : 'attraction',
    name: item.name,
    note: item.description,
    duration: item.duration,
    time: ''
  })
  addedIds.value = [...addedIds.value, item.id]
}

// 排入行程 dialog
const schedulingItem = ref<AiRecommendation | null>(null)
const scheduleDay = ref('')
const scheduleTime = ref('')

const openSchedule = (item: AiRecommendation) => {
  schedulingItem.value = item
  scheduleDay.value = ''
  scheduleTime.value = ''
}

const closeSchedule = () => {
  schedulingItem.value = null
}

const scheduleAiItem = () => {
  if (!schedulingItem.value || !scheduleDay.value) return
  const item = schedulingItem.value
  const dayEntries = (props.trip.itinerary || []).filter(e => e.date === scheduleDay.value)
  const maxOrder = dayEntries.reduce((m, e) => Math.max(m, e.order ?? 0), -1)
  const itinerary: TripEntry[] = [...(props.trip.itinerary || []), {
    id: Date.now().toString(),
    date: scheduleDay.value,
    time: scheduleTime.value,
    category: item.category === 'food' ? 'food' : 'attraction',
    name: item.name,
    note: item.description,
    order: maxOrder + 10
  }]
  tripsStore.updateTrip(props.trip.id, { itinerary })
  addedIds.value = [...addedIds.value, item.id]
  closeSchedule()
}
</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.25s ease; }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to { opacity: 0; }
.drawer-enter-from .relative { transform: translateX(100%); }
.drawer-leave-to .relative { transform: translateX(100%); }
</style>
