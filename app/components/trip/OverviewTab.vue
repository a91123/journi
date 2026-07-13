<template>
  <div class="pb-24 lg:pb-6">

    <!-- 手機：縱向時間軸 -->
    <div class="space-y-6 lg:hidden">
      <div v-for="(day, index) in dayList" :key="index">
        <div class="flex items-center gap-2.5 mb-2">
          <span class="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Day {{ index + 1 }}</span>
          <span class="text-sm text-slate-500">{{ formatFullDate(day.date) }}</span>
          <span class="ml-auto text-xs text-slate-400">{{ getEntriesForDay(day.date).length > 0 ? getEntriesForDay(day.date).length + ' 個' : '空' }}</span>
        </div>
        <div class="space-y-1.5">
          <div v-if="getEntriesForDay(day.date).length === 0"
            class="text-slate-300 text-xs py-3 px-4 border border-dashed border-stone-200 rounded-xl text-center">
            還沒有行程
          </div>
          <div v-for="entry in getEntriesForDay(day.date)" :key="entry.id"
            class="flex items-center gap-3 py-2.5 px-3.5 bg-white rounded-xl border border-stone-100">
            <span class="text-base flex-shrink-0">{{ categoryEmoji(entry.category) }}</span>
            <span class="text-xs text-slate-400 font-mono w-10 flex-shrink-0">{{ entry.time || '--:--' }}</span>
            <span class="text-sm text-slate-700 font-medium truncate">{{ entry.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌機：橫向 Excel 風格 -->
    <div class="hidden lg:flex gap-3 overflow-x-auto pb-4">
      <div
        v-for="(day, index) in dayList"
        :key="index"
        class="flex-shrink-0 w-52 rounded-2xl border border-stone-200 overflow-hidden bg-white"
      >
        <div class="bg-slate-900 px-3 py-2.5">
          <p class="text-white text-xs font-bold">Day {{ index + 1 }}</p>
          <p class="text-slate-400 text-xs mt-0.5">{{ formatFullDate(day.date) }}</p>
        </div>
        <div class="p-2 space-y-1.5 min-h-[120px]">
          <div v-if="getEntriesForDay(day.date).length === 0"
            class="text-slate-200 text-xs text-center pt-8">空</div>
          <div v-for="entry in getEntriesForDay(day.date)" :key="entry.id"
            class="bg-stone-50 rounded-lg px-2 py-1.5">
            <div class="flex items-center gap-1 mb-0.5">
              <span class="text-xs">{{ categoryEmoji(entry.category) }}</span>
              <span class="text-xs text-slate-400 font-mono">{{ entry.time || '--:--' }}</span>
            </div>
            <p class="text-xs text-slate-700 font-medium truncate">{{ entry.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

const props = defineProps<{ trip: Trip; dayList: DayInfo[] }>()

const getEntriesForDay = (date: string) => {
  return (props.trip.itinerary || [])
    .filter(e => e.date === date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}
</script>
