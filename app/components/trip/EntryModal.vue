<template>
  <!-- 桌機新增 / 編輯行程 Modal（行程 Tab 與地圖 Tab 共用） -->
  <div v-if="show"
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    @click.self="show = false"
  >
    <div class="bg-paper-raised rounded-2xl w-full max-w-sm p-5 space-y-3 border border-stub">
      <div class="flex items-center justify-between">
        <h3 class="font-display font-bold text-ink">
          {{ editingEntryId ? '編輯行程' : '新增行程' }}・Day {{ dayIndex + 1 }}
        </h3>
        <button @click="show = false" class="text-ink-faint/60 hover:text-ink-faint text-xl leading-none">×</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <TimePicker v-model="form.time" />
        <select v-model="form.category" class="border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue w-full bg-paper">
          <option value="attraction">🏛 景點</option>
          <option value="food">🍜 美食</option>
          <option value="transport">🚌 交通</option>
          <option value="hotel">🏨 住宿</option>
          <option value="ticket">🎟 票券</option>
          <option value="other">📌 其他</option>
        </select>
      </div>
      <input v-model="form.name" placeholder="活動名稱" class="w-full border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue bg-paper" />
      <input v-model="form.note" placeholder="備註（選填）" class="w-full border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue bg-paper" />
      <input v-model="form.mapUrl" placeholder="📍 Google Maps 連結（選填）" class="w-full border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue bg-paper" />
      <div class="flex gap-2 pt-1">
        <button
          @click="save"
          class="flex-1 bg-airmail-red hover:bg-airmail-red/90 text-paper-raised py-2.5 rounded-xl text-sm font-bold transition-colors"
        >{{ editingEntryId ? '儲存' : '新增' }}</button>
        <button @click="show = false" class="px-5 py-2.5 text-ink-faint hover:text-ink-soft text-sm transition-colors">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, TripEntry } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

const props = defineProps<{ trip: Trip; dayList: DayInfo[] }>()
const tripsStore = useTripsStore()

const show = ref(false)
const date = ref('')
const editingEntryId = ref<string | null>(null)
const form = reactive<{ time: string; category: TripEntry['category']; name: string; note: string; mapUrl: string }>({
  time: '', category: 'attraction', name: '', note: '', mapUrl: ''
})

const dayIndex = computed(() => props.dayList.findIndex(d => d.date === date.value))

const openForAdd = (targetDate: string) => {
  date.value = targetDate
  editingEntryId.value = null
  Object.assign(form, { time: '', category: 'attraction', name: '', note: '', mapUrl: '' })
  show.value = true
}

const openForEdit = (entry: TripEntry) => {
  date.value = entry.date
  editingEntryId.value = entry.id
  Object.assign(form, { time: entry.time, category: entry.category, name: entry.name, note: entry.note || '', mapUrl: entry.mapUrl || '' })
  show.value = true
}

defineExpose({ openForAdd, openForEdit })

const save = () => {
  if (!form.name.trim()) return
  if (editingEntryId.value) {
    const itinerary = props.trip.itinerary.map(e =>
      e.id === editingEntryId.value ? { ...e, ...form } : e
    )
    tripsStore.updateTrip(props.trip.id, { itinerary })
  } else {
    const dayEntries = (props.trip.itinerary || []).filter(e => e.date === date.value)
    const maxOrder = dayEntries.reduce((m, e) => Math.max(m, e.order ?? 0), -1)
    const itinerary = [...(props.trip.itinerary || []), {
      ...form,
      date: date.value,
      id: Date.now().toString(),
      order: maxOrder + 10
    }]
    tripsStore.updateTrip(props.trip.id, { itinerary })
  }
  show.value = false
  editingEntryId.value = null
}
</script>
