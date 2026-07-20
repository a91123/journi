<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-display font-bold text-ink mb-1">建立新旅程</h1>
    <p class="text-xs font-mono text-ink-faint tracking-wide mb-6">TRAVEL MANIFEST · 填寫基本資料，細節之後隨時可改</p>

    <form @submit.prevent="handleSubmit" class="bg-paper-raised rounded-2xl border border-stub overflow-hidden">
      <div class="airmail-stripe h-1.5"></div>

      <div class="p-6 space-y-5">
        <div>
          <label class="flex items-center gap-1.5 text-xs font-mono font-medium text-ink-faint tracking-widest mb-1.5">
            <span class="w-1.5 h-1.5 bg-airmail-blue rounded-full"></span>
            目的地 · DESTINATION
          </label>
          <input
            v-model="form.destination"
            type="text"
            placeholder="例如：東京、巴黎、首爾"
            class="w-full border border-stub rounded-xl px-4 py-3 text-sm outline-none focus:border-airmail-blue focus:ring-2 focus:ring-airmail-blue/10 transition-all bg-paper"
            required
          />
        </div>

        <DateRangePicker
          :start-date="form.startDate"
          :end-date="form.endDate"
          @update:start-date="form.startDate = $event"
          @update:end-date="form.endDate = $event"
        />

        <div>
          <label class="flex items-center gap-1.5 text-xs font-mono font-medium text-ink-faint tracking-widest mb-1.5">
            <span class="w-1.5 h-1.5 bg-stamp-gold rounded-full"></span>
            預算 · BUDGET <span class="text-ink-faint/60 font-normal normal-case">（台幣，選填）</span>
          </label>
          <input
            v-model="form.budget"
            type="number"
            placeholder="例如：50000"
            class="w-full border border-stub rounded-xl px-4 py-3 text-sm outline-none focus:border-airmail-blue focus:ring-2 focus:ring-airmail-blue/10 transition-all bg-paper"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-airmail-red hover:bg-airmail-red/90 text-paper-raised py-3 rounded-xl font-bold transition-colors shadow-sm mt-2"
        >
          建立旅程 →
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const router = useRouter()
const tripsStore = useTripsStore()

const form = reactive({
  destination: '',
  startDate: '',
  endDate: '',
  budget: ''
})

const handleSubmit = () => {
  const start = new Date(form.startDate)
  const end = new Date(form.endDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

  const newTrip = tripsStore.addTrip({
    destination: form.destination,
    startDate: form.startDate,
    endDate: form.endDate,
    budget: form.budget || null,
    days,
    itinerary: []
  })

  router.push(`/trips/${newTrip.id}`)
}
</script>
