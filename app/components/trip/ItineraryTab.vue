<template>
  <div class="pb-24 lg:pb-6">

    <!-- 手機視圖 -->
    <div class="lg:hidden">

      <!-- Day 選擇器 -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          v-for="(day, index) in dayList"
          :key="index"
          @click="emit('update:activeDay', index)"
          class="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border transition-all text-sm"
          :class="activeDay === index
            ? 'bg-amber-400 border-amber-400 text-stone-900 font-bold shadow-sm'
            : 'bg-white border-stone-200 text-stone-400 hover:border-amber-300 hover:text-stone-600'"
        >
          <span class="font-bold">Day {{ index + 1 }}</span>
          <span class="text-xs opacity-70">{{ day.label }}</span>
        </button>
      </div>

      <!-- Day 標頭 -->
      <div v-if="dayList[activeDay]" class="flex items-baseline gap-2 mb-3">
        <span class="text-base font-bold text-stone-900">Day {{ activeDay + 1 }}</span>
        <span class="text-sm text-stone-400">{{ dayList[activeDay]!.fullLabel }}</span>
      </div>

      <!-- 當天行程 -->
      <div class="space-y-2 mb-4">
        <div
          v-for="(entry, idx) in currentDayEntries"
          :key="entry.id"
          class="bg-white rounded-md shadow-sm overflow-hidden transition-shadow hover:shadow-md"
          :class="editingEntryId === entry.id ? 'ring-1 ring-amber-400' : ''"
        >
          <!-- 顯示列 -->
          <div class="flex">
            <!-- 左色條（按類別） -->
            <div class="w-1 flex-shrink-0" :class="categoryColor(entry.category)"></div>
            <div class="flex-1 px-3 py-3 cursor-pointer" @click="openInlineEdit(entry)">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="text-xs font-mono font-semibold text-amber-600">{{ entry.time || '--:--' }}</span>
                    <span class="text-xs text-stone-300">·</span>
                    <span class="text-xs text-stone-400">{{ categoryLabel(entry.category) }}</span>
                  </div>
                  <p class="font-bold text-stone-900 text-base leading-snug">{{ entry.name }}</p>
                  <p v-if="entry.note" class="text-sm text-stone-400 mt-0.5">{{ entry.note }}</p>
                  <!-- 地圖按鈕 -->
                  <button
                    v-if="entry.mapUrl"
                    @click.stop="toggleMap(entry.id)"
                    class="mt-1.5 flex items-center gap-1 text-xs text-stone-400 hover:text-amber-600 transition-colors"
                  >
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ openMapId === entry.id ? '收起地圖' : '展開地圖' }}
                  </button>
                </div>
                <button
                  @click.stop="removeEntry(entry.id)"
                  class="text-stone-200 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 mt-0.5"
                >×</button>
              </div>
            </div>
          </div>

          <!-- 地圖展開 -->
          <div v-if="openMapId === entry.id && entry.mapUrl" class="border-t border-stone-100">
            <iframe
              :src="`https://maps.google.com/maps?q=${encodeURIComponent(entry.name)}&output=embed`"
              class="w-full h-52 border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <div class="px-3 py-2 flex justify-end">
              <a :href="entry.mapUrl" target="_blank" rel="noopener" class="text-xs text-amber-600 hover:underline">在 Google Maps 開啟 ↗</a>
            </div>
          </div>

          <!-- Inline 編輯區 -->
          <div v-if="editingEntryId === entry.id" class="border-t border-stone-100 px-3 py-3 space-y-2 bg-stone-50">
            <div class="grid grid-cols-2 gap-2">
              <TimePicker v-model="inlineEdit.time" />
              <select v-model="inlineEdit.category" class="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 w-full bg-white">
                <option value="attraction">🏛 景點</option>
                <option value="food">🍜 美食</option>
                <option value="transport">🚌 交通</option>
                <option value="hotel">🏨 住宿</option>
                <option value="ticket">🎟 票券</option>
                <option value="other">📌 其他</option>
              </select>
            </div>
            <input v-model="inlineEdit.name" placeholder="活動名稱" class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
            <input v-model="inlineEdit.note" placeholder="備註（選填）" class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
            <input v-model="inlineEdit.mapUrl" placeholder="📍 Google Maps 連結（選填）" class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
            <div class="flex items-center justify-between gap-2">
              <div class="flex gap-1.5">
                <button
                  @click="reorderEntry(entry.id, 'up')"
                  :disabled="idx === 0"
                  class="text-xs border border-stone-200 rounded px-2 py-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 bg-white"
                >↑</button>
                <button
                  @click="reorderEntry(entry.id, 'down')"
                  :disabled="idx === currentDayEntries.length - 1"
                  class="text-xs border border-stone-200 rounded px-2 py-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 bg-white"
                >↓</button>
                <select
                  class="text-xs border border-stone-200 rounded px-2 py-1 outline-none bg-white text-stone-500 focus:border-amber-400"
                  @change="(e: Event) => { const s = e.target as HTMLSelectElement; moveEntryToDay(entry.id, s.value); s.value = '' }"
                >
                  <option value="" disabled selected>移至…</option>
                  <option v-for="(day, i) in dayList" :key="i" :value="day.date" :disabled="day.date === dayList[activeDay]?.date">Day {{ i + 1 }}</option>
                </select>
              </div>
              <div class="flex gap-2">
                <button @click="editingEntryId = null" class="px-3 py-1.5 text-stone-400 text-sm transition-colors">取消</button>
                <button @click="saveInlineEdit(entry.id)" class="bg-amber-400 hover:bg-amber-500 text-stone-900 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">儲存</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentDayEntries.length === 0" class="text-center py-10 text-stone-300">
          <p class="text-3xl mb-2">✈️</p>
          <p class="text-sm">這天還沒有行程</p>
        </div>
      </div>

      <!-- 新增行程 -->
      <div v-if="showAddForm" class="bg-white rounded-xl border border-amber-200 p-4 mb-3" ref="addFormEl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <TimePicker v-model="newEntry.time" />
          <select
            v-model="newEntry.category"
            class="w-full border border-stone-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-amber-400"
          >
            <option value="attraction">🏛 景點</option>
            <option value="food">🍜 美食</option>
            <option value="transport">🚌 交通</option>
            <option value="hotel">🏨 住宿</option>
            <option value="ticket">🎟 票券</option>
            <option value="other">📌 其他</option>
          </select>
        </div>
        <input
          v-model="newEntry.name"
          placeholder="活動名稱"
          class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 mb-3"
        />
        <input
          v-model="newEntry.note"
          placeholder="備註（選填）"
          class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 mb-3"
        />
        <div class="flex gap-2">
          <button @click="addEntry" class="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2 rounded-lg text-sm font-bold transition-colors">新增</button>
          <button @click="showAddForm = false" class="px-4 py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors">取消</button>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="openAddForm"
          class="flex-1 border-2 border-dashed border-stone-300 hover:border-amber-400 text-slate-400 hover:text-amber-500 rounded-xl py-3 text-sm font-medium transition-all"
        >
          + 自己新增
        </button>
        <button
          @click="showAiPanel = !showAiPanel"
          class="flex-1 border-2 border-dashed border-stone-300 hover:border-slate-400 text-slate-400 hover:text-slate-600 rounded-xl py-3 text-sm font-medium transition-all"
        >
          ✨ AI 推薦
        </button>
      </div>

    </div><!-- /手機視圖 -->

    <!-- 桌機橫向視圖 -->
    <div class="hidden lg:block relative">
      <div class="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        <div
          v-for="(col, colIdx) in columns"
          :key="col.date"
          class="flex-shrink-0 w-72 flex flex-col rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm"
        >
          <!-- 欄標題 -->
          <div class="px-4 pt-4 pb-3 flex-shrink-0 border-b border-stone-100">
            <p class="text-stone-800 font-bold text-sm leading-none">Day {{ getDayIndex(col.date) + 1 }}</p>
            <p class="text-stone-400 text-xs mt-1.5">{{ formatFullDate(col.date) }}</p>
          </div>
          <VueDraggable
            v-model="columns[colIdx]!.entries"
            :group="{ name: 'itinerary', pull: true, put: true }"
            :animation="150"
            handle=".drag-handle"
            @end="onDragEnd"
            @add="(e) => onColumnAdd(e, colIdx)"
            class="flex-1 p-3 space-y-2 min-h-[480px]"
          >
            <div
              v-for="entry in columns[colIdx]!.entries"
              :key="entry.id"
              class="bg-stone-50 rounded-lg overflow-hidden group"
            >
              <div class="flex hover:bg-stone-100 transition-colors cursor-pointer" @click="emit('edit-desktop', entry)">
                <div class="w-[3px] flex-shrink-0 self-stretch" :class="categoryColor(entry.category)"></div>
                <div class="flex-1 flex items-center gap-2 px-3 py-3 min-w-0">
                  <span class="drag-handle cursor-grab active:cursor-grabbing text-stone-300 group-hover:text-stone-500 text-xs select-none transition-colors" @click.stop>⠿</span>
                  <div class="flex-1 min-w-0">
                    <span v-if="entry.time" class="text-xs text-amber-500 font-mono font-semibold block leading-none mb-1">{{ entry.time }}</span>
                    <p class="text-sm text-stone-700 font-semibold truncate leading-snug">{{ entry.name }}</p>
                  </div>
                  <button
                    v-if="entry.mapUrl"
                    @click.stop="toggleMap(entry.id)"
                    class="flex-shrink-0 transition-colors"
                    :class="openMapId === entry.id ? 'text-amber-600' : 'text-stone-300 hover:text-amber-600'"
                    title="地圖"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </button>
                  <button @click.stop="removeEntry(entry.id)" class="text-stone-300 hover:text-red-400 text-base leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              </div>
              <div v-if="entry.mapUrl && openMapId === entry.id" class="border-t border-stone-200">
                <iframe
                  :src="`https://maps.google.com/maps?q=${encodeURIComponent(entry.name)}&output=embed`"
                  class="w-full h-40 border-0"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
                <div class="px-3 py-1.5 flex justify-end">
                  <a :href="entry.mapUrl" target="_blank" rel="noopener" class="text-xs text-amber-600 hover:underline" @click.stop>在 Google Maps 開啟 ↗</a>
                </div>
              </div>
            </div>
          </VueDraggable>
          <div class="px-3 pb-3 flex-shrink-0">
            <button
              @click="emit('add-desktop', col.date)"
              class="w-full text-xs text-stone-400 hover:text-amber-600 py-2 border border-dashed border-stone-200 hover:border-amber-300 rounded-lg transition-colors"
            >+ 新增</button>
          </div>
        </div>
      </div>
      <!-- 右側漸層提示 -->
      <div class="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none"></div>
    </div>

    <!-- AI 推薦觸發（桌機） -->
    <div class="hidden lg:flex items-center justify-end mt-3">
      <button
        @click="showAiPanel = !showAiPanel"
        class="text-xs border border-stone-200 hover:border-amber-400 text-stone-500 hover:text-amber-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <span>✨</span><span>AI 推薦</span>
      </button>
    </div>

    <TripAiDrawer :trip="trip" :day-list="dayList" v-model:show="showAiPanel" />

  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Trip, TripEntry, StandbyItem } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

interface Column { date: string; entries: TripEntry[] }

const props = defineProps<{ trip: Trip; dayList: DayInfo[]; activeDay: number }>()
const emit = defineEmits<{
  'update:activeDay': [index: number]
  'add-desktop': [date: string]
  'edit-desktop': [entry: TripEntry]
}>()
const tripsStore = useTripsStore()

const showAiPanel = ref(false)
const showAddForm = ref(false)
const addFormEl = ref<HTMLElement | null>(null)

const openAddForm = () => {
  showAddForm.value = true
  nextTick(() => addFormEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

const currentDayEntries = computed(() => {
  const day = props.dayList[props.activeDay]
  return (props.trip.itinerary || [])
    .filter(e => e.date === day?.date)
    .sort(sortByTimeThenOrder)
})

const newEntry = reactive<{ time: string; category: TripEntry['category']; name: string; note: string; mapUrl: string }>({
  time: '', category: 'attraction', name: '', note: '', mapUrl: ''
})

const addEntry = () => {
  if (!newEntry.name.trim()) return
  const day = props.dayList[props.activeDay]
  if (!day) return
  const dayEntries = (props.trip.itinerary || []).filter(e => e.date === day.date)
  const maxOrder = dayEntries.reduce((m, e) => Math.max(m, e.order ?? 0), -1)
  const itinerary: TripEntry[] = [...(props.trip.itinerary || []), {
    ...newEntry, date: day.date, id: Date.now().toString(), order: maxOrder + 10
  }]
  tripsStore.updateTrip(props.trip.id, { itinerary })
  Object.assign(newEntry, { time: '', category: 'attraction', name: '', note: '', mapUrl: '' })
  showAddForm.value = false
}

const removeEntry = (entryId: string) => {
  const itinerary = props.trip.itinerary.filter(e => e.id !== entryId)
  tripsStore.updateTrip(props.trip.id, { itinerary })
}

// 手機 inline 編輯（地圖 Tab 的「編輯這筆行程」也會經由 defineExpose 打開）
const editingEntryId = ref<string | null>(null)
const openMapId = ref<string | null>(null)
const toggleMap = (id: string) => { openMapId.value = openMapId.value === id ? null : id }
const inlineEdit = reactive({ time: '', category: 'attraction' as TripEntry['category'], name: '', note: '', mapUrl: '' })

const openInlineEdit = (entry: TripEntry) => {
  if (editingEntryId.value === entry.id) {
    editingEntryId.value = null
    return
  }
  Object.assign(inlineEdit, { time: entry.time, category: entry.category, name: entry.name, note: entry.note || '', mapUrl: entry.mapUrl || '' })
  editingEntryId.value = entry.id
}

defineExpose({ openInlineEdit })

const saveInlineEdit = (entryId: string) => {
  if (!inlineEdit.name.trim()) return
  const itinerary = props.trip.itinerary.map(e =>
    e.id === entryId ? { ...e, ...inlineEdit } : e
  )
  tripsStore.updateTrip(props.trip.id, { itinerary })
  editingEntryId.value = null
}

const reorderEntry = (entryId: string, direction: 'up' | 'down') => {
  const day = props.dayList[props.activeDay]
  if (!day) return
  tripsStore.reorderEntry(props.trip.id, day.date, entryId, direction)
}

const moveEntryToDay = (entryId: string, newDate: string) => {
  tripsStore.moveEntryToDay(props.trip.id, entryId, newDate)
}

// 桌機欄位（拖曳用）
const columns = ref<Column[]>([])
let isSyncingFromDrag = false

const rebuildColumns = () => {
  if (isSyncingFromDrag) return
  columns.value = props.dayList.map(day => ({
    date: day.date,
    entries: (props.trip.itinerary || [])
      .filter(e => e.date === day.date)
      .sort(sortByTimeThenOrder)
  }))
}

watch([() => props.trip.itinerary, () => props.dayList], rebuildColumns, { deep: true, immediate: true })

const onDragEnd = () => {
  isSyncingFromDrag = true
  const newItinerary = columns.value.flatMap((col) =>
    col.entries.map((entry, i) => ({ ...entry, date: col.date, order: i * 10 }))
  )
  tripsStore.updateTrip(props.trip.id, { itinerary: newItinerary })
  nextTick(() => { isSyncingFromDrag = false })
}

const onColumnAdd = (event: { newIndex?: number }, colIdx: number) => {
  const col = columns.value[colIdx]
  if (!col) return
  const idx = event.newIndex ?? col.entries.length - 1
  const item = col.entries[idx] as TripEntry & { duration?: string | number }
  if (!item || 'date' in item) return  // 已是 TripEntry，跳過

  // 來自備用清單，轉換為 TripEntry
  const standbyItem = item as unknown as StandbyItem
  const tripEntry: TripEntry = {
    id: Date.now().toString(),
    date: col.date,
    time: standbyItem.time || '',
    category: (['attraction','food','transport','hotel','ticket','other'].includes(standbyItem.category)
      ? standbyItem.category : 'other') as TripEntry['category'],
    name: standbyItem.name,
    note: standbyItem.note,
    order: idx * 10
  }
  col.entries.splice(idx, 1, tripEntry)
  tripsStore.removeFromStandby(props.trip.id, standbyItem.id)
  onDragEnd()
}

const getDayIndex = (date: string) => props.dayList.findIndex(d => d.date === date)
</script>

<style scoped>
.scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
