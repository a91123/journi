<template>
  <!-- AI 推薦側邊抽屜 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="show" class="fixed inset-0 z-50 flex justify-end" @click.self="close">
        <!-- 半透明遮罩 -->
        <div class="absolute inset-0 bg-black/20" @click="close"></div>
        <!-- 抽屜本體 -->
        <div class="relative w-96 h-full bg-paper-raised shadow-2xl flex flex-col overflow-hidden">
          <!-- 抽屜 Header -->
          <div class="px-5 py-4 border-b border-stub/70 flex items-center justify-between flex-shrink-0">
            <div>
              <p class="font-display font-bold text-ink text-base">✨ AI 景點推薦</p>
              <p class="text-xs text-ink-faint mt-0.5">{{ trip.destination }}</p>
            </div>
            <button @click="close" class="text-ink-faint/60 hover:text-ink-faint text-2xl leading-none transition-colors">×</button>
          </div>
          <!-- 類別篩選 -->
          <div class="px-5 py-3 flex gap-2 flex-shrink-0 border-b border-stub/70">
            <button
              v-for="cat in aiCategories"
              :key="cat.key"
              @click="aiCategory = cat.key"
              class="text-xs px-3 py-1.5 rounded-full border transition-all"
              :class="aiCategory === cat.key
                ? 'bg-airmail-blue border-airmail-blue text-paper-raised font-semibold'
                : 'border-stub text-ink-soft hover:border-airmail-blue/40'"
            >{{ cat.label }}</button>
          </div>
          <!-- 內容 -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <div v-if="aiLoading" class="flex flex-col items-center justify-center h-40 gap-3">
              <div class="w-6 h-6 border-2 border-airmail-blue border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm text-ink-faint">正在推薦中…</p>
            </div>
            <div v-else-if="aiError" class="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
              <p class="text-airmail-red/80 text-sm">{{ aiError }}</p>
              <button
                @click="fetchRecommendations"
                class="bg-airmail-blue hover:bg-airmail-blue/90 text-paper-raised px-5 py-2 rounded-xl text-sm font-bold transition-colors"
              >重試</button>
            </div>
            <div v-else-if="currentBatch.length === 0" class="flex flex-col items-center justify-center h-40 gap-3">
              <p class="text-ink-faint text-sm">點擊開始獲取推薦</p>
              <button
                @click="fetchRecommendations"
                class="bg-airmail-blue hover:bg-airmail-blue/90 text-paper-raised px-5 py-2 rounded-xl text-sm font-bold transition-colors"
              >開始推薦</button>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in currentBatch"
                :key="item.id"
                class="border border-stub/70 rounded-xl p-4 hover:border-airmail-blue/30 hover:shadow-sm transition-all"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <p class="font-semibold text-ink text-sm leading-snug">{{ item.name }}</p>
                  <button
                    @click="openSchedule(item)"
                    :disabled="addedIds.includes(item.id)"
                    class="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    :class="addedIds.includes(item.id) ? 'bg-stub/40 text-ink-faint cursor-default' : 'bg-airmail-red hover:bg-airmail-red/90 text-paper-raised'"
                  >{{ addedIds.includes(item.id) ? '✓ 已加入' : '排入' }}</button>
                </div>
                <p class="text-xs text-ink-faint leading-relaxed">{{ item.description }}</p>
                <p class="text-xs text-ink-faint/60 mt-2 font-mono">⏱ 約 {{ item.duration }} 小時</p>
              </div>
              <div class="flex justify-between items-center pt-1">
                <button @click="nextBatch" class="text-sm text-ink-faint hover:text-ink transition-colors">換一批 →</button>
                <span class="text-xs text-ink-faint/60 font-mono">{{ batchIndex * 5 + 1 }}–{{ Math.min((batchIndex + 1) * 5, allRecommendations.length) }} / {{ allRecommendations.length }}</span>
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
    <div class="bg-paper-raised rounded-2xl w-full max-w-sm p-5 space-y-4 border border-stub">
      <div>
        <p class="font-display font-bold text-ink text-base leading-snug">{{ schedulingItem.name }}</p>
        <p class="text-xs text-ink-faint mt-1 leading-relaxed">{{ schedulingItem.description }}</p>
      </div>

      <button
        @click="addFromAi(schedulingItem); closeSchedule()"
        class="w-full py-2.5 rounded-xl text-sm font-bold bg-stub/30 hover:bg-stub/50 text-ink-soft transition-colors"
      >加入備用</button>

      <div>
        <p class="text-xs font-mono font-semibold text-ink-faint uppercase tracking-widest mb-2">或直接排入</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(day, i) in dayList"
            :key="day.date"
            @click="scheduleDay = day.date"
            class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border"
            :class="scheduleDay === day.date
              ? 'bg-ink border-ink text-paper'
              : 'bg-paper border-stub hover:border-airmail-blue/40 text-ink-soft'"
          >Day {{ i + 1 }} {{ day.label }}</button>
        </div>
      </div>

      <div v-if="scheduleDay">
        <label class="block text-xs font-mono font-semibold text-ink-faint uppercase tracking-widest mb-2">時間（選填）</label>
        <TimePicker v-model="scheduleTime" />
      </div>

      <div class="flex gap-2 pt-1">
        <button
          @click="scheduleAiItem"
          :disabled="!scheduleDay"
          class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
          :class="scheduleDay ? 'bg-airmail-red hover:bg-airmail-red/90 text-paper-raised' : 'bg-stub/40 text-ink-faint cursor-not-allowed'"
        >排入行程</button>
        <button @click="closeSchedule" class="px-5 py-2.5 text-ink-faint hover:text-ink-soft text-sm transition-colors">取消</button>
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
const aiError = ref('')
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
  aiError.value = ''
  batchIndex.value = 0
  addedIds.value = []
  try {
    const res = await $fetch('/api/recommendations', {
      method: 'POST',
      body: { destination: props.trip.destination, category: aiCategory.value, apiKey: geminiKey.value }
    })
    allRecommendations.value = res.attractions
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    aiError.value = err.data?.statusMessage || '推薦失敗，請稍後再試'
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
