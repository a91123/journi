<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-slate-800 mb-6">新增旅程</h1>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-1.5">目的地</label>
        <input
          v-model="form.destination"
          type="text"
          placeholder="例如：東京、巴黎、首爾"
          class="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
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
        <label class="block text-sm font-semibold text-slate-700 mb-1.5">
          預算 <span class="text-slate-400 font-normal">（台幣，選填）</span>
        </label>
        <input
          v-model="form.budget"
          type="number"
          placeholder="例如：50000"
          class="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 py-3 rounded-xl font-bold transition-colors shadow-sm mt-2"
      >
        建立旅程 →
      </button>
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
