<template>
  <!-- 備用清單底部抽屜（手機） -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showDrawer"
        class="fixed inset-0 bg-black/40 z-40"
        @click="showDrawer = false"
      />
    </Transition>

    <div class="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto lg:hidden">
      <Transition name="slide-up">
        <div v-if="showDrawer" class="bg-white rounded-t-2xl shadow-2xl max-h-[65vh] flex flex-col">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
            <span class="font-bold text-slate-800 text-sm">備用清單</span>
            <button @click="showDrawer = false" class="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
          <div class="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            <div v-if="standbyItems.length === 0" class="text-center py-10 text-slate-300">
              <p class="text-3xl mb-2">📋</p>
              <p class="text-sm">備用清單是空的</p>
              <p class="text-xs mt-1">從 AI 推薦加入景點</p>
            </div>
            <div
              v-for="item in standbyItems"
              :key="item.id"
              class="bg-stone-50 rounded-xl overflow-hidden"
            >
              <div class="flex items-start gap-3 py-3 px-3.5">
                <span class="text-lg mt-0.5 flex-shrink-0">{{ categoryEmoji(item.category) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-800 text-sm">{{ item.name }}</p>
                  <p v-if="item.duration" class="text-xs text-slate-400 mt-0.5">⏱ 約 {{ item.duration }} 小時</p>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    @click="expandingId = expandingId === item.id ? null : item.id"
                    class="text-xs bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >排入</button>
                  <button
                    @click="tripsStore.removeFromStandby(trip.id, item.id)"
                    class="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                  >×</button>
                </div>
              </div>
              <!-- Day 選擇器 -->
              <div v-if="expandingId === item.id" class="px-3.5 pb-3 flex flex-wrap gap-2">
                <button
                  v-for="(day, i) in dayList"
                  :key="day.date"
                  @click="moveToDay(item.id, day.date)"
                  class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-white border border-stone-200 hover:border-amber-400 hover:text-amber-600 text-slate-600"
                >Day {{ i + 1 }} {{ day.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 固定觸發欄 -->
      <button
        @click="showDrawer = !showDrawer"
        class="w-full bg-slate-900 hover:bg-slate-800 transition-colors text-white py-3.5 flex items-center justify-center gap-2"
      >
        <span class="text-sm font-semibold">備用清單</span>
        <span
          v-if="standbyItems.length"
          class="bg-amber-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
        >{{ standbyItems.length }}</span>
        <span class="text-slate-500 text-xs ml-1">{{ showDrawer ? '▼' : '▲' }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Trip } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

const props = defineProps<{ trip: Trip; dayList: DayInfo[] }>()
const tripsStore = useTripsStore()

const showDrawer = ref(false)
const expandingId = ref<string | null>(null)

const standbyItems = computed(() => props.trip.standby || [])

const moveToDay = (itemId: string, date: string) => {
  tripsStore.moveToDay(props.trip.id, itemId, date)
  expandingId.value = null
  if (standbyItems.value.length <= 1) showDrawer.value = false
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>
