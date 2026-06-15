<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">我的旅程</h1>
        <p class="text-sm text-slate-400 mt-0.5">{{ trips.length }} 趟旅程</p>
      </div>
      <NuxtLink
        to="/trips/new"
        class="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
      >
        + 新增
      </NuxtLink>
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
  </div>
</template>

<script setup>
const tripsStore = useTripsStore()
onMounted(() => tripsStore.load())
const trips = computed(() => tripsStore.trips)

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>
