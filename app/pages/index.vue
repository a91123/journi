<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold text-ink">我的旅程</h1>
        <p class="text-sm font-mono text-ink-faint mt-0.5 tracking-wide">{{ String(trips.length).padStart(2, '0') }} TRIPS</p>
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
const tripsStore = useTripsStore()
onMounted(() => {
  tripsStore.load()
})
const trips = computed(() => tripsStore.trips)

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>
