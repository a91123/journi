<template>
  <!-- 編輯旅程 modal -->
  <div
    v-if="show"
    class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-paper-raised rounded-2xl w-full max-w-md p-6 space-y-4 border border-stub">
      <h2 class="text-lg font-display font-bold text-ink">編輯旅程</h2>

      <div>
        <label class="block text-sm font-semibold text-ink-soft mb-1.5">目的地</label>
        <input
          v-model="editForm.destination"
          type="text"
          class="w-full border border-stub rounded-xl px-4 py-2.5 text-sm outline-none focus:border-airmail-blue transition-all bg-paper"
        />
      </div>

      <DateRangePicker
        :start-date="editForm.startDate"
        :end-date="editForm.endDate"
        @update:start-date="editForm.startDate = $event"
        @update:end-date="editForm.endDate = $event"
      />

      <div>
        <label class="block text-sm font-semibold text-ink-soft mb-1.5">
          預算 <span class="text-ink-faint font-normal">（台幣，選填）</span>
        </label>
        <input
          v-model="editForm.budget"
          type="number"
          class="w-full border border-stub rounded-xl px-4 py-2.5 text-sm outline-none focus:border-airmail-blue transition-all bg-paper"
        />
      </div>

      <div v-if="displacedCount > 0" class="bg-stamp-gold/10 border border-stamp-gold/40 rounded-xl px-4 py-3 text-sm text-stamp-gold">
        日期縮短後，{{ displacedCount }} 個行程將退回備用清單。
      </div>

      <div class="flex gap-2 pt-1">
        <button
          @click="saveEdit"
          class="flex-1 bg-airmail-red hover:bg-airmail-red/90 text-paper-raised py-2.5 rounded-xl text-sm font-bold transition-colors"
        >儲存</button>
        <button
          @click="emit('close')"
          class="px-5 py-2.5 text-ink-faint hover:text-ink-soft text-sm transition-colors"
        >取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip } from '~/stores/useTripsStore'

const props = defineProps<{ trip: Trip; show: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const tripsStore = useTripsStore()

const editForm = reactive({ destination: '', startDate: '', endDate: '', budget: '' })

watch(() => props.show, (show) => {
  if (!show) return
  editForm.destination = props.trip.destination
  editForm.startDate = props.trip.startDate
  editForm.endDate = props.trip.endDate
  editForm.budget = String(props.trip.budget || '')
})

const displacedCount = computed(() => {
  if (!props.trip.itinerary || !editForm.startDate || !editForm.endDate) return 0
  const start = new Date(editForm.startDate)
  const end = new Date(editForm.endDate)
  if (end < start) return 0
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const validDates = new Set<string>()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    validDates.add(d.toISOString().substring(0, 10))
  }
  return (props.trip.itinerary || []).filter(e => !validDates.has(e.date)).length
})

const saveEdit = () => {
  if (!editForm.destination || !editForm.startDate || !editForm.endDate) return
  tripsStore.updateTripDates(props.trip.id, { ...editForm, budget: editForm.budget || null })
  emit('saved')
  emit('close')
}
</script>
