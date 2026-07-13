<template>
  <!-- 備用清單（桌機左側欄），拖曳來源：clone 到行程欄位 -->
  <div class="bg-white rounded-2xl border border-stone-200 p-3">
    <div class="flex items-center gap-2 px-2 mb-2">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">備用清單</p>
      <span
        v-if="standbyItems.length"
        class="bg-amber-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
      >{{ standbyItems.length }}</span>
    </div>
    <div v-if="standbyItems.length === 0" class="text-center py-4 text-slate-300 text-xs">空的</div>
    <VueDraggable
      v-model="standbyDragList"
      :group="{ name: 'standby', pull: 'clone', put: false }"
      :animation="150"
      :sort="false"
      item-key="id"
    >
      <div
        v-for="item in standbyDragList"
        :key="item.id"
        class="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-stone-50 group transition-colors cursor-grab active:cursor-grabbing"
      >
        <span class="text-slate-300 text-xs select-none">⠿</span>
        <span class="text-sm flex-shrink-0">{{ categoryEmoji(item.category) }}</span>
        <span class="text-xs text-slate-700 font-medium truncate flex-1">{{ item.name }}</span>
        <button
          @click.stop="tripsStore.removeFromStandby(trip.id, item.id)"
          class="text-slate-300 hover:text-red-400 text-base leading-none opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        >×</button>
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Trip } from '~/stores/useTripsStore'

const props = defineProps<{ trip: Trip }>()
const tripsStore = useTripsStore()

const standbyItems = computed(() => props.trip.standby || [])

// 桌機拖曳用（clone 模式，原清單不變）
const standbyDragList = computed({
  get: () => standbyItems.value,
  set: () => {}
})
</script>
