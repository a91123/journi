<template>
  <div class="pb-24 lg:pb-6">
    <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <button
        v-for="(day, index) in dayList"
        :key="index"
        @click="emit('update:activeDay', index)"
        class="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border transition-all text-sm"
        :class="activeDay === index
          ? 'bg-ink border-ink text-paper font-bold shadow-sm'
          : 'bg-paper-raised border-stub text-ink-faint hover:border-airmail-blue/40 hover:text-ink-soft'"
      >
        <span class="font-bold font-mono">DAY {{ index + 1 }}</span>
        <span class="text-xs opacity-70">{{ day.label }}</span>
      </button>
    </div>

    <div class="lg:flex lg:gap-4 lg:items-start">
      <div class="relative flex-1 min-w-0" :class="{ 'map-placing': placingEntry }">
        <!-- 注意：這個 div 交給 Leaflet 管理，不能綁任何動態 class/style，
             否則 Vue patch 時會把 Leaflet 執行期加上的 class（leaflet-container 等）洗掉 -->
        <div ref="mapContainer" class="w-full h-96 rounded-2xl border border-stub overflow-hidden z-0"></div>
        <!-- 點地圖設定位置模式的提示 banner -->
        <div v-if="placingEntry" class="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
          <div class="flex items-center gap-2 bg-ink/90 text-paper rounded-xl px-4 py-2.5 shadow-lg pointer-events-auto max-w-full">
            <span class="text-xs leading-snug">在地圖上點一下，設定「<span class="font-bold">{{ placingEntry.name }}</span>」的位置</span>
            <button @click="placingEntry = null" class="text-xs font-bold text-stamp-gold hover:text-stamp-gold/80 flex-shrink-0 transition-colors">取消</button>
          </div>
        </div>
        <div v-if="currentDayEntries.length === 0" class="absolute inset-0 flex items-center justify-center bg-paper-raised/90 rounded-2xl">
          <div class="text-center text-ink-faint/50">
            <p class="text-3xl mb-2">🗺️</p>
            <p class="text-sm">這天還沒有行程</p>
          </div>
        </div>
        <div v-else-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-paper-raised/50 rounded-2xl pointer-events-none">
          <div class="flex items-center gap-2 bg-paper-raised rounded-full px-4 py-2 shadow-sm border border-stub/60">
            <div class="w-4 h-4 border-2 border-airmail-blue border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-ink-faint">定位中 {{ mapProgress }}</span>
          </div>
        </div>
        <button
          v-if="!mapLoading && currentDayEntries.length > 0"
          @click="resetMapZoom"
          class="absolute top-3 right-3 bg-paper-raised rounded-full w-9 h-9 flex items-center justify-center shadow-md border border-stub text-ink-soft hover:text-airmail-blue transition-colors"
          :class="placingEntry ? 'hidden' : ''"
          title="重設縮放"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
      </div>

      <!-- 景點詳細資訊 -->
      <div v-if="selectedMapEntry" class="mt-3 lg:mt-0 lg:w-72 lg:flex-shrink-0 bg-paper-raised rounded-2xl border border-stub p-4 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xs text-ink-faint">{{ categoryLabel(selectedMapEntry.category) }}</p>
            <p class="font-display font-bold text-ink leading-snug">{{ selectedMapEntry.name }}</p>
          </div>
          <button @click="selectedMapEntry = null" class="text-ink-faint/60 hover:text-ink-faint text-xl leading-none flex-shrink-0">×</button>
        </div>
        <p v-if="selectedMapEntry.time" class="text-sm text-airmail-blue font-mono font-semibold">{{ selectedMapEntry.time }}</p>
        <p v-if="selectedMapEntry.note" class="text-sm text-ink-soft leading-relaxed">{{ selectedMapEntry.note }}</p>
        <a
          v-if="selectedMapEntry.mapUrl"
          :href="selectedMapEntry.mapUrl"
          target="_blank"
          rel="noopener"
          class="text-xs text-airmail-blue hover:underline inline-block"
        >在 Google Maps 開啟 ↗</a>
        <button
          @click="emit('edit-entry', selectedMapEntry)"
          class="w-full text-xs font-bold bg-stub/30 hover:bg-stub/50 text-ink-soft rounded-lg py-2 transition-colors"
        >✎ 編輯這筆行程</button>
        <button
          @click="startPlacing(selectedMapEntry)"
          class="w-full text-xs font-bold bg-stub/30 hover:bg-stub/50 text-ink-soft rounded-lg py-2 transition-colors"
        >📍 點地圖修正定位</button>
      </div>
    </div>
    <div v-if="!mapLoading && currentDayEntries.length > 0" class="flex flex-col items-center gap-1.5 mt-2">
      <a
        v-if="googleMapsRouteUrl"
        :href="googleMapsRouteUrl"
        target="_blank"
        rel="noopener"
        class="text-xs font-bold text-airmail-blue hover:text-airmail-blue/80 flex items-center gap-1"
      ><span>🧭</span><span>用 Google Maps 開啟整天路線</span></a>
      <button
        v-if="lastPinMove"
        @click="undoPinMove"
        class="text-xs font-bold text-ink-soft hover:text-ink bg-stub/30 hover:bg-stub/50 rounded-lg px-3 py-1.5 transition-colors"
      >↩ 復原「{{ lastPinMove.name }}」的定位</button>
      <div v-if="mapUnlocatedEntries.length > 0" class="flex flex-wrap items-center justify-center gap-1.5">
        <span class="text-xs text-ink-faint">{{ mapUnlocatedEntries.length }} 個地點定位不到，點名稱後在地圖上點選位置：</span>
        <button
          v-for="e in mapUnlocatedEntries"
          :key="e.id"
          @click="startPlacing(e)"
          class="text-xs font-medium border rounded-full px-3 py-1 transition-colors"
          :class="placingEntry?.id === e.id
            ? 'bg-ink border-ink text-paper'
            : 'bg-paper-raised border-stub text-ink-soft hover:border-airmail-blue hover:text-airmail-blue'"
        >📍 {{ e.name }}</button>
      </div>
      <p class="text-xs text-ink-faint/60 text-center">
        定位不準可以拖曳 pin 或點「修正定位」・站間標示為直線距離，非實際路徑
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Trip, TripEntry } from '~/stores/useTripsStore'
import type { DayInfo } from '~/utils/tripDisplay'

const props = defineProps<{ trip: Trip; dayList: DayInfo[]; activeDay: number }>()
const emit = defineEmits<{
  'update:activeDay': [index: number]
  'edit-entry': [entry: TripEntry]
}>()
const tripsStore = useTripsStore()
const { geminiKey } = useGeminiKey()

const currentDayEntries = computed(() => {
  const day = props.dayList[props.activeDay]
  return (props.trip.itinerary || [])
    .filter(e => e.date === day?.date)
    .sort(sortByTimeThenOrder)
})

const mapContainer = ref<HTMLElement | null>(null)
const mapLoading = ref(false)
const mapProgress = ref('')
const mapNotFoundCount = ref(0)
const mapDestinationContext = ref('')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let leafletMap: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let leafletInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapPolyline: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapMarkers: any[] = []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapDistanceLabels: any[] = []
const mapFitPoints = ref<[number, number][]>([])
const selectedMapEntry = ref<TripEntry | null>(null)
const mapUnlocatedEntries = ref<TripEntry[]>([])
const placingEntry = ref<TripEntry | null>(null)
const lastPinMove = ref<{ entryId: string; name: string; prevLat: number; prevLon: number } | null>(null)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const haversineDistance = (a: [number, number], b: [number, number]): number => {
  const R = 6371
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLon = (b[1] - a[1]) * Math.PI / 180
  const lat1 = a[0] * Math.PI / 180
  const lat2 = b[0] * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const formatDistance = (km: number) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

// 拖曳 pin 或點地圖改座標後，重算受影響的相鄰兩段距離泡泡（label i 對應 points[i]→points[i+1]）
const updateDistanceLabelsAround = (pointIdx: number) => {
  const points = mapFitPoints.value
  for (const seg of [pointIdx - 1, pointIdx]) {
    const label = mapDistanceLabels[seg]
    if (!label || seg < 0 || seg + 1 >= points.length) continue
    const a = points[seg]!
    const b = points[seg + 1]!
    const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    label.setLatLng(mid)
    label.setIcon(distanceLabelIcon(formatDistance(haversineDistance(a, b))))
  }
}

const resolveMapDestination = async () => {
  if (mapDestinationContext.value) return
  try {
    const res = await $fetch<{ normalized: string }>('/api/normalize-place', {
      query: { destination: props.trip.destination, apiKey: geminiKey.value }
    })
    mapDestinationContext.value = res.normalized
  } catch {
    mapDestinationContext.value = props.trip.destination
  }
}

const geocodeEntry = async (entry: TripEntry): Promise<{ lat: number; lon: number } | null> => {
  if (entry.lat != null && entry.lon != null) return { lat: entry.lat, lon: entry.lon }

  const destinationContext = mapDestinationContext.value || props.trip.destination
  const key = `${destinationContext}__${entry.name}`
  if (key in geocodeCache) return geocodeCache[key]!

  try {
    const res = await $fetch<{ lat: number; lon: number }>('/api/geocode', {
      query: { q: `${entry.name}, ${destinationContext}` }
    })
    geocodeCache[key] = { lat: res.lat, lon: res.lon }
    tripsStore.setEntryLocation(props.trip.id, entry.id, res.lat, res.lon)
    await sleep(1100) // 對 Nominatim 好一點：只有真的打了 API 才需要間隔
  } catch {
    geocodeCache[key] = null
  }
  return geocodeCache[key]!
}

const numberIcon = (n: number) => leafletInstance.divIcon({
  html: `<div style="background:#2C5282;color:#FFFDF8;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:'IBM Plex Mono',monospace;border:2px solid #FFFDF8;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${n}</div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
})

const distanceLabelIcon = (text: string) => leafletInstance.divIcon({
  html: `<div style="display:inline-block;background:#FFFDF8;color:#4A5A6A;padding:5px 12px;line-height:1;border-radius:6px;font-size:12px;font-weight:700;font-family:'IBM Plex Mono',monospace;white-space:nowrap;border:1px solid #DCD3BE;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${text}</div>`,
  className: ''
})

const renderMapMarkers = async () => {
  if (!leafletMap || !leafletInstance) return
  mapLoading.value = true
  selectedMapEntry.value = null
  placingEntry.value = null
  lastPinMove.value = null
  mapMarkers.forEach(m => m.remove())
  mapMarkers = []
  mapDistanceLabels.forEach(m => m.remove())
  mapDistanceLabels = []
  if (mapPolyline) {
    mapPolyline.remove()
    mapPolyline = null
  }

  const entries = currentDayEntries.value
  const points: [number, number][] = []
  const unlocated: TripEntry[] = []
  let notFound = 0

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!
    mapProgress.value = `${i + 1}/${entries.length}`
    const coord = await geocodeEntry(entry)
    if (coord) {
      points.push([coord.lat, coord.lon])
      const idx = points.length - 1
      const marker = leafletInstance
        .marker([coord.lat, coord.lon], { icon: numberIcon(points.length), draggable: true })
        .addTo(leafletMap)
        .on('click', () => {
          if (placingEntry.value) return
          selectedMapEntry.value = entry
        })
        .on('dragend', () => {
          const { lat, lng } = marker.getLatLng()
          const prev = mapFitPoints.value[idx]!
          lastPinMove.value = { entryId: entry.id, name: entry.name, prevLat: prev[0], prevLon: prev[1] }
          mapFitPoints.value[idx] = [lat, lng]
          if (mapPolyline) mapPolyline.setLatLngs(mapFitPoints.value)
          updateDistanceLabelsAround(idx)
          tripsStore.setEntryLocation(props.trip.id, entry.id, lat, lng)
          const cacheKey = `${mapDestinationContext.value || props.trip.destination}__${entry.name}`
          geocodeCache[cacheKey] = { lat, lon: lng }
        })
      mapMarkers.push(marker)
    } else {
      notFound++
      unlocated.push(entry)
    }
  }

  mapFitPoints.value = points
  if (points.length > 1) {
    mapPolyline = leafletInstance.polyline(points, { color: '#2C5282', weight: 3 }).addTo(leafletMap)
    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lon1] = points[i]!
      const [lat2, lon2] = points[i + 1]!
      const dist = haversineDistance([lat1, lon1], [lat2, lon2])
      const mid: [number, number] = [(lat1 + lat2) / 2, (lon1 + lon2) / 2]
      const label = leafletInstance
        .marker(mid, { icon: distanceLabelIcon(formatDistance(dist)), interactive: false })
        .addTo(leafletMap)
      mapDistanceLabels.push(label)
    }
  }
  if (points.length > 0) {
    leafletMap.fitBounds(points, { padding: [40, 40] })
  }
  mapNotFoundCount.value = notFound
  mapUnlocatedEntries.value = unlocated
  mapLoading.value = false
}

const resetMapZoom = () => {
  if (leafletMap && mapFitPoints.value.length > 0) {
    leafletMap.fitBounds(mapFitPoints.value, { padding: [40, 40] })
  }
}

// 點地圖設定位置：救援「定位不到」跟「查到別的地方」兩種情況
const startPlacing = (entry: TripEntry) => {
  placingEntry.value = entry
  selectedMapEntry.value = null
}

const placeEntryAt = async (lat: number, lon: number) => {
  const entry = placingEntry.value
  if (!entry) return
  const prev = entry.lat != null && entry.lon != null
    ? { entryId: entry.id, name: entry.name, prevLat: entry.lat, prevLon: entry.lon }
    : null
  tripsStore.setEntryLocation(props.trip.id, entry.id, lat, lon)
  const cacheKey = `${mapDestinationContext.value || props.trip.destination}__${entry.name}`
  geocodeCache[cacheKey] = { lat, lon }
  placingEntry.value = null
  await renderMapMarkers()
  lastPinMove.value = prev
}

const undoPinMove = () => {
  const move = lastPinMove.value
  if (!move) return
  const entry = props.trip.itinerary.find(e => e.id === move.entryId)
  tripsStore.setEntryLocation(props.trip.id, move.entryId, move.prevLat, move.prevLon)
  if (entry) {
    const cacheKey = `${mapDestinationContext.value || props.trip.destination}__${entry.name}`
    geocodeCache[cacheKey] = { lat: move.prevLat, lon: move.prevLon }
  }
  lastPinMove.value = null
  renderMapMarkers()
}

// 側邊詳情卡開關會改變地圖容器寬度，Leaflet 不會自動感知，
// 需手動 invalidateSize 並重新 fitBounds，避免景點被擠出可視範圍外
watch(selectedMapEntry, async () => {
  await nextTick()
  if (!leafletMap) return
  leafletMap.invalidateSize()
  if (mapFitPoints.value.length > 0) {
    leafletMap.fitBounds(mapFitPoints.value, { padding: [40, 40] })
  }
})

const googleMapsRouteUrl = computed(() => {
  const points = mapFitPoints.value
  if (points.length === 0) return null
  if (points.length === 1) {
    const [lat, lon] = points[0]!
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
  }
  const origin = points[0]!.join(',')
  const destination = points[points.length - 1]!.join(',')
  const waypoints = points.slice(1, -1).map(p => p.join(',')).join('|')
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'walking' })
  if (waypoints) params.set('waypoints', waypoints)
  return `https://www.google.com/maps/dir/?${params.toString()}`
})

const initMap = async () => {
  if (leafletMap || !mapContainer.value) return
  mapLoading.value = true
  const L = await import('leaflet')
  leafletInstance = L

  await resolveMapDestination()

  let center: [number, number] = [25.033, 121.5654]
  const destinationContext = mapDestinationContext.value || props.trip.destination
  if (destinationContext) {
    try {
      const res = await $fetch<{ lat: number; lon: number }>('/api/geocode', {
        query: { q: destinationContext }
      })
      center = [res.lat, res.lon]
    } catch {
      // 查不到就用預設中心，不影響後續景點定位
    }
  }

  leafletMap = L.map(mapContainer.value).setView(center, 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(leafletMap)
  leafletMap.on('click', (e: { latlng: { lat: number; lng: number } }) => {
    if (placingEntry.value) placeEntryAt(e.latlng.lat, e.latlng.lng)
  })
  await renderMapMarkers()
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})

watch(() => props.activeDay, () => {
  renderMapMarkers()
})
</script>

<script lang="ts">
// geocode 結果的記憶體快取放模組層級，切換 Tab（組件重掛）後仍沿用，
// 減少對 Nominatim 的重複查詢；entry 座標本身已持久化在 store
const geocodeCache: Record<string, { lat: number; lon: number } | null> = {}
</script>

<style scoped>
.scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }

/* 點地圖設定位置模式：cursor 綁在外層 wrapper，不直接動 Leaflet 的容器 */
.map-placing :deep(.leaflet-container) { cursor: crosshair; }
</style>
