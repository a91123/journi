<template>
  <div class="pb-24 lg:pb-6">

    <!-- 手機：縱向時間軸 -->
    <div class="space-y-6 lg:hidden">
      <div v-for="(day, index) in dayList" :key="index">
        <div class="flex items-center gap-2.5 mb-2">
          <span class="bg-ink text-paper text-xs font-mono font-bold px-2.5 py-1 rounded-lg">DAY {{ index + 1 }}</span>
          <span class="text-sm text-ink-faint">{{ formatFullDate(day.date) }}</span>
          <span class="ml-auto text-xs font-mono text-ink-faint/70">{{ getMergedForDay(day.date).length > 0 ? getMergedForDay(day.date).length + ' 個' : '空' }}</span>
        </div>
        <div class="space-y-1.5">
          <div v-if="getMergedForDay(day.date).length === 0"
            class="text-ink-faint/60 text-xs py-3 px-4 border border-dashed border-stub rounded-xl text-center">
            還沒有行程
          </div>
          <template v-for="item in getMergedForDay(day.date)" :key="item.kind === 'entry' ? item.entry.id : item.marker.id">
            <div v-if="item.kind === 'entry'"
              class="flex items-center gap-3 py-2.5 px-3.5 bg-paper-raised rounded-xl border border-stub/70">
              <span class="text-base flex-shrink-0">{{ categoryEmoji(item.entry.category) }}</span>
              <span class="text-xs text-ink-faint font-mono w-10 flex-shrink-0">{{ item.entry.time || '--:--' }}</span>
              <span class="text-sm text-ink-soft font-medium truncate">{{ item.entry.name }}</span>
            </div>
            <button v-else type="button" @click="emit('goto-info')"
              class="w-full flex items-center gap-3 py-2.5 px-3.5 bg-stamp-gold/10 rounded-xl border border-dashed border-stamp-gold/40 text-left hover:bg-stamp-gold/15 transition-colors">
              <span class="text-base flex-shrink-0">{{ item.marker.icon }}</span>
              <span class="text-xs text-stamp-gold font-mono w-10 flex-shrink-0">{{ item.marker.time || '--:--' }}</span>
              <span class="text-sm text-stamp-gold/90 font-medium truncate">{{ item.marker.label }}</span>
              <span class="ml-auto text-[10px] text-stamp-gold/70 flex-shrink-0 font-mono">訂單</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 桌機：橫向 Excel 風格 -->
    <div class="hidden lg:flex gap-3 overflow-x-auto pb-4">
      <div
        v-for="(day, index) in dayList"
        :key="index"
        class="flex-shrink-0 w-52 rounded-2xl border border-stub overflow-hidden bg-paper-raised"
      >
        <div class="bg-ink px-3 py-2.5">
          <p class="text-paper text-xs font-mono font-bold">DAY {{ index + 1 }}</p>
          <p class="text-paper/50 text-xs mt-0.5">{{ formatFullDate(day.date) }}</p>
        </div>
        <div class="p-2 space-y-1.5 min-h-[120px]">
          <div v-if="getMergedForDay(day.date).length === 0"
            class="text-ink-faint/40 text-xs text-center pt-8">空</div>
          <template v-for="item in getMergedForDay(day.date)" :key="item.kind === 'entry' ? item.entry.id : item.marker.id">
            <div v-if="item.kind === 'entry'" class="bg-paper rounded-lg px-2 py-1.5">
              <div class="flex items-center gap-1 mb-0.5">
                <span class="text-xs">{{ categoryEmoji(item.entry.category) }}</span>
                <span class="text-xs text-ink-faint font-mono">{{ item.entry.time || '--:--' }}</span>
              </div>
              <p class="text-xs text-ink-soft font-medium truncate">{{ item.entry.name }}</p>
            </div>
            <button v-else type="button" @click="emit('goto-info')"
              class="w-full bg-stamp-gold/10 border border-dashed border-stamp-gold/40 rounded-lg px-2 py-1.5 text-left hover:bg-stamp-gold/15 transition-colors">
              <div class="flex items-center gap-1 mb-0.5">
                <span class="text-xs">{{ item.marker.icon }}</span>
                <span class="text-xs text-stamp-gold font-mono">{{ item.marker.time || '--:--' }}</span>
              </div>
              <p class="text-xs text-stamp-gold/90 font-medium truncate">{{ item.marker.label }}</p>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, TripEntry } from '~/stores/useTripsStore'
import type { DayInfo, BookingMarker } from '~/utils/tripDisplay'
import { getBookingMarkersForDay } from '~/utils/tripDisplay'

const props = defineProps<{ trip: Trip; dayList: DayInfo[] }>()
const emit = defineEmits<{ 'goto-info': [] }>()

type DisplayItem = { kind: 'entry'; entry: TripEntry } | { kind: 'booking'; marker: BookingMarker }

const getMergedForDay = (date: string): DisplayItem[] => {
  const entries = (props.trip.itinerary || []).filter(e => e.date === date)
  const markers = getBookingMarkersForDay(props.trip.bookings || [], date)
  const items: DisplayItem[] = [
    ...entries.map(entry => ({ kind: 'entry' as const, entry })),
    ...markers.map(marker => ({ kind: 'booking' as const, marker }))
  ]
  return items.sort((a, b) => {
    const ta = a.kind === 'entry' ? a.entry.time || '' : a.marker.time || ''
    const tb = b.kind === 'entry' ? b.entry.time || '' : b.marker.time || ''
    return ta.localeCompare(tb)
  })
}
</script>
