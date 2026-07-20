<template>
  <div v-if="trip">
    <div class="mb-6">
      <div class="flex items-baseline gap-2">
        <h1 class="text-4xl font-display font-bold text-ink leading-tight tracking-tight">{{ trip.destination }}</h1>
        <button
          @click="showEditModal = true"
          class="text-ink-faint/60 hover:text-ink-faint transition-colors flex-shrink-0"
          aria-label="編輯旅程"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
      </div>
      <div class="flex items-center gap-3 mt-2 font-mono text-sm">
        <p class="text-ink-faint">{{ formatShortDate(trip.startDate) }} – {{ formatShortDate(trip.endDate) }}</p>
        <span class="w-1 h-1 rounded-full bg-stub"></span>
        <span class="font-semibold text-airmail-blue">{{ trip.days }} DAYS</span>
        <span v-if="trip.budget" class="text-ink-faint">・NT$ {{ Number(trip.budget).toLocaleString() }}</span>
      </div>
    </div>

    <TripEditModal
      :trip="trip"
      :show="showEditModal"
      @close="showEditModal = false"
      @saved="activeDay = 0"
    />

    <!-- Tab (手機) -->
    <div class="flex gap-1 bg-stub/40 rounded-xl p-1 mb-5 lg:hidden">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="activeTab === tab.key
          ? 'bg-paper-raised text-ink shadow-sm'
          : 'text-ink-faint hover:text-ink-soft'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 桌機兩欄佈局 -->
    <div class="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:items-start">

      <!-- 左側欄（桌機） -->
      <div class="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6">
        <!-- 垂直 Tab 導覽 -->
        <div class="bg-paper-raised rounded-2xl border border-stub p-2">
          <button
            v-for="tab in desktopTabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            :class="activeTab === tab.key
              ? 'bg-ink text-paper'
              : 'text-ink-soft hover:text-ink hover:bg-paper'"
          >{{ tab.label }}</button>
        </div>

        <TripStandbySidebar :trip="trip" />
      </div>

      <!-- 右側內容 -->
      <div class="min-w-0">
        <TripItineraryTab
          v-if="activeTab === 'itinerary'"
          ref="itineraryTabRef"
          :trip="trip"
          :day-list="dayList"
          v-model:active-day="activeDay"
          @add-desktop="entryModalRef?.openForAdd($event)"
          @edit-desktop="entryModalRef?.openForEdit($event)"
          @goto-info="activeTab = 'info'"
        />

        <TripOverviewTab
          v-else-if="activeTab === 'overview'"
          :trip="trip"
          :day-list="dayList"
          @goto-info="activeTab = 'info'"
        />

        <TripMapTab
          v-else-if="activeTab === 'map'"
          :trip="trip"
          :day-list="dayList"
          v-model:active-day="activeDay"
          @edit-entry="onEditEntryFromMap"
        />

        <TripInfoTab
          v-else-if="activeTab === 'info'"
          :trip="trip"
        />
      </div><!-- /右側內容 -->
    </div><!-- /桌機兩欄 grid -->

    <!-- 桌機新增 / 編輯行程 Modal（行程 + 地圖 Tab 共用） -->
    <TripEntryModal ref="entryModalRef" :trip="trip" :day-list="dayList" />

    <!-- 備用清單底部抽屜（手機） -->
    <TripStandbyDrawer :trip="trip" :day-list="dayList" />
  </div>

  <div v-else class="text-center py-24 text-ink-faint font-mono">找不到這趟旅程</div>
</template>

<script setup lang="ts">
import type { TripEntry } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

const route = useRoute()
const tripsStore = useTripsStore()
const { loadKey } = useGeminiKey()

onMounted(() => {
  tripsStore.load()
  loadKey()
})
const trip = computed(() => tripsStore.getTrip(route.params.id as string))

const tabs = [
  { key: 'itinerary', label: '行程' },
  { key: 'overview', label: '總覽' },
  { key: 'map', label: '地圖' },
  { key: 'info', label: '資訊' }
]
const desktopTabs = tabs.filter(t => t.key !== 'overview')
const activeTab = ref('itinerary')
const activeDay = ref(0)
const showEditModal = ref(false)

const dayList = computed<DayInfo[]>(() => {
  if (!trip.value) return []
  const start = new Date(trip.value.startDate)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return Array.from({ length: trip.value.days }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const wd = weekdays[d.getDay()]
    return {
      date: d.toISOString().substring(0, 10),
      label: `${m}/${day}`,
      fullLabel: `${m}月${day}日 · 週${wd}`
    }
  })
})

// 跨組件互動：地圖 Tab 的「編輯這筆行程」
// 桌機開共用的 EntryModal；手機切回行程 Tab 開 inline 編輯
const entryModalRef = ref<{ openForAdd: (date: string) => void; openForEdit: (entry: TripEntry) => void } | null>(null)
const itineraryTabRef = ref<{ openInlineEdit: (entry: TripEntry) => void } | null>(null)

const onEditEntryFromMap = (entry: TripEntry) => {
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches
  if (isDesktop) {
    entryModalRef.value?.openForEdit(entry)
  } else {
    activeTab.value = 'itinerary'
    nextTick(() => itineraryTabRef.value?.openInlineEdit(entry))
  }
}
</script>
