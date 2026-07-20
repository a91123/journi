<template>
  <div class="pb-24 lg:pb-6 space-y-6">

    <!-- 旅伴 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-mono font-semibold text-ink-faint uppercase tracking-widest">旅伴</p>
        <button
          @click="showAddCompanion = !showAddCompanion"
          class="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
          :class="showAddCompanion ? 'bg-stub/40 text-ink-soft' : 'bg-airmail-red hover:bg-airmail-red/90 text-paper-raised'"
        >{{ showAddCompanion ? '收起' : '+ 新增' }}</button>
      </div>

      <div v-if="showAddCompanion" class="bg-paper-raised rounded-2xl border border-stub/70 p-4 space-y-2 mb-3">
        <input v-model="newCompanion.name" placeholder="姓名" class="w-full border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue" />
        <input v-model="newCompanion.note" placeholder="備註（如：護照號碼、生日，選填）" class="w-full border border-stub rounded-xl px-3 py-2.5 text-sm outline-none focus:border-airmail-blue" />
        <button
          @click="addCompanion"
          :disabled="!newCompanion.name.trim()"
          class="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
          :class="!newCompanion.name.trim() ? 'bg-stub/40 text-ink-faint cursor-not-allowed' : 'bg-airmail-red hover:bg-airmail-red/90 text-paper-raised'"
        >新增旅伴</button>
      </div>

      <div v-if="tripCompanions.length === 0 && !showAddCompanion" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">
        還沒有旅伴，點「+ 新增」開始
      </div>
      <div v-else class="space-y-2">
        <div v-for="c in tripCompanions" :key="c.id" class="bg-paper-raised rounded-2xl border border-stub/70 p-3 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold text-ink text-sm">{{ c.name }}</p>
            <p v-if="c.note" class="text-xs text-ink-faint truncate">{{ c.note }}</p>
          </div>
          <button @click="tripsStore.removeCompanion(trip.id, c.id)" class="text-ink-faint/50 hover:text-airmail-red transition-colors flex-shrink-0 text-lg leading-none">×</button>
        </div>
      </div>
    </div>

    <!-- 訂單管理中心 -->
    <TripBookings :trip="trip" />

    <!-- 天氣預報 -->
    <div>
      <p class="text-xs font-mono font-semibold text-ink-faint uppercase tracking-widest mb-3">天氣預報</p>
      <div v-if="weatherLoading" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">正在查詢天氣...</div>
      <div v-else-if="weather.error" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">{{ weather.error }}</div>
      <div v-else-if="weather.days.length === 0" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">暫無天氣資料</div>
      <div v-else class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div v-for="d in weather.days" :key="d.date" class="flex-shrink-0 w-20 bg-paper-raised rounded-2xl border border-stub/70 p-3 text-center">
          <p class="text-xs text-ink-faint mb-1 font-mono">{{ formatShortDate(d.date) }}</p>
          <p class="text-2xl mb-1">{{ weatherEmoji(d.weatherCode) }}</p>
          <p class="text-xs text-ink-soft font-medium font-mono">{{ Math.round(d.max) }}°</p>
          <p class="text-xs text-ink-faint/60 font-mono">{{ Math.round(d.min) }}°</p>
        </div>
      </div>
    </div>

    <!-- 匯率參考 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-mono font-semibold text-ink-faint uppercase tracking-widest">匯率參考</p>
        <select
          v-model="selectedCurrency"
          class="text-xs border border-stub rounded-lg px-2 py-1 outline-none focus:border-airmail-blue bg-paper-raised text-ink-soft"
        >
          <option v-for="c in currencyOptions" :key="c.code" :value="c.code">{{ c.flag }} {{ c.code }}</option>
        </select>
      </div>
      <div v-if="exchangeLoading" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">正在查詢匯率...</div>
      <div v-else-if="exchange.error" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">{{ exchange.error }}</div>
      <div v-else-if="exchangeRate" class="bg-paper-raised rounded-2xl border border-stub/70 p-4 space-y-4">
        <!-- 自訂金額換算 -->
        <div class="flex items-center gap-2">
          <div class="flex-1 flex items-center border border-stub rounded-xl px-3 py-2 focus-within:border-airmail-blue">
            <input
              v-model.number="exchangeAmount"
              type="number"
              min="0"
              class="w-full outline-none text-sm font-mono bg-transparent"
            />
            <span class="text-xs text-ink-faint flex-shrink-0 font-mono">{{ exchangeDirection === 'toForeign' ? 'TWD' : selectedCurrency }}</span>
          </div>
          <button
            @click="swapExchangeDirection"
            class="flex-shrink-0 text-ink-faint hover:text-airmail-blue transition-colors p-2"
            title="切換換算方向"
          >⇄</button>
          <div class="flex-1 flex items-center border border-stub/70 bg-paper rounded-xl px-3 py-2">
            <span class="w-full text-sm font-semibold text-ink font-mono truncate">{{ convertedAmount }}</span>
            <span class="text-xs text-ink-faint flex-shrink-0 font-mono">{{ exchangeDirection === 'toForeign' ? selectedCurrency : 'TWD' }}</span>
          </div>
        </div>

        <!-- 參考匯率 -->
        <div class="flex items-center justify-around text-center pt-3 border-t border-stub/70">
          <div>
            <p class="text-xs text-ink-faint mb-1">1 TWD</p>
            <p class="text-lg font-bold text-ink font-mono">{{ exchangeRate.toFixed(4) }} {{ selectedCurrency }}</p>
          </div>
          <span class="text-stub">|</span>
          <div>
            <p class="text-xs text-ink-faint mb-1">100 {{ selectedCurrency }}</p>
            <p class="text-lg font-bold text-ink font-mono">{{ (100 / exchangeRate).toFixed(1) }} TWD</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 準備清單 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-mono font-semibold text-ink-faint uppercase tracking-widest">準備清單</p>
        <button
          @click="generatePackingList"
          :disabled="packingLoading"
          class="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors bg-airmail-red hover:bg-airmail-red/90 text-paper-raised disabled:opacity-50"
        >{{ packingLoading ? '生成中...' : (packingList.length ? '重新生成' : 'AI 生成清單') }}</button>
      </div>

      <div v-if="packingLoading" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">正在生成清單...</div>

      <div v-else-if="packingError" class="text-airmail-red/80 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">{{ packingError }}</div>

      <div v-else-if="packingList.length === 0" class="text-ink-faint/60 text-sm text-center py-8 bg-paper-raised rounded-2xl border border-stub/70">
        還沒有準備清單，點「AI 生成清單」開始
      </div>

      <div v-else class="bg-paper-raised rounded-2xl border border-stub/70 divide-y divide-stub/70">
        <div v-for="(items, category) in packingCategories" :key="category" class="p-4">
          <p class="text-xs font-mono font-semibold text-ink-faint mb-2 tracking-wide">{{ category }}</p>
          <div class="space-y-1.5">
            <label v-for="item in items" :key="item.id" class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="item.checked"
                @change="tripsStore.togglePackingItem(trip.id, item.id)"
                class="rounded border-stub text-airmail-blue focus:ring-airmail-blue/40"
              />
              <span class="text-sm" :class="item.checked ? 'text-ink-faint/50 line-through' : 'text-ink-soft'">{{ item.name }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, PackingItem } from '~/stores/useTripsStore'

const props = defineProps<{ trip: Trip }>()
const tripsStore = useTripsStore()
const { geminiKey } = useGeminiKey()

// 旅伴
const tripCompanions = computed(() => props.trip.companions || [])
const showAddCompanion = ref(false)
const newCompanion = reactive({ name: '', note: '' })

const addCompanion = () => {
  if (!newCompanion.name.trim()) return
  tripsStore.addCompanion(props.trip.id, { name: newCompanion.name, note: newCompanion.note || undefined })
  Object.assign(newCompanion, { name: '', note: '' })
  showAddCompanion.value = false
}

// 天氣預報：結果放 useState，切 Tab 重掛組件時不重打 API
interface WeatherDay { date: string; weatherCode: number; max: number; min: number }
const weather = useState<{ fetched: boolean; days: WeatherDay[]; error: string }>(
  `weather-${props.trip.id}`,
  () => ({ fetched: false, days: [], error: '' })
)
const weatherLoading = ref(false)

const fetchWeather = async () => {
  weatherLoading.value = true
  weather.value.error = ''
  try {
    const res = await $fetch<{ location: string; days: WeatherDay[] }>('/api/weather', {
      query: {
        destination: props.trip.destination,
        startDate: props.trip.startDate,
        endDate: props.trip.endDate,
        apiKey: geminiKey.value
      }
    })
    weather.value.days = res.days
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    weather.value.error = err.data?.statusMessage || '無法取得天氣資料'
    weather.value.days = []
  } finally {
    weatherLoading.value = false
  }
}

// 匯率參考：同樣用 useState 快取
const currencyOptions = [
  { code: 'JPY', flag: '🇯🇵' }, { code: 'KRW', flag: '🇰🇷' }, { code: 'USD', flag: '🇺🇸' },
  { code: 'EUR', flag: '🇪🇺' }, { code: 'GBP', flag: '🇬🇧' }, { code: 'HKD', flag: '🇭🇰' },
  { code: 'CNY', flag: '🇨🇳' }, { code: 'THB', flag: '🇹🇭' }, { code: 'SGD', flag: '🇸🇬' },
  { code: 'MYR', flag: '🇲🇾' }, { code: 'IDR', flag: '🇮🇩' }, { code: 'PHP', flag: '🇵🇭' },
  { code: 'AUD', flag: '🇦🇺' }, { code: 'NZD', flag: '🇳🇿' }, { code: 'CAD', flag: '🇨🇦' },
  { code: 'CHF', flag: '🇨🇭' }, { code: 'INR', flag: '🇮🇳' }, { code: 'TRY', flag: '🇹🇷' }
]

const exchange = useState<{ fetched: boolean; rates: Record<string, number> | null; error: string }>(
  'exchange-rates',
  () => ({ fetched: false, rates: null, error: '' })
)
const exchangeLoading = ref(false)
const exchangeAmount = ref(10000)
const exchangeDirection = ref<'toForeign' | 'toTwd'>('toForeign')

const selectedCurrency = computed({
  get: () => props.trip.currency || guessCurrency(props.trip.destination || ''),
  set: (code: string) => {
    tripsStore.updateTrip(props.trip.id, { currency: code })
  }
})

const exchangeRate = computed(() => exchange.value.rates?.[selectedCurrency.value] ?? null)

const convertedValue = computed(() => {
  if (!exchangeRate.value || !exchangeAmount.value) return 0
  return exchangeDirection.value === 'toForeign'
    ? exchangeAmount.value * exchangeRate.value
    : exchangeAmount.value / exchangeRate.value
})

const convertedAmount = computed(() => convertedValue.value.toLocaleString('zh-TW', { maximumFractionDigits: 2 }))

const swapExchangeDirection = () => {
  // 切換時把目前換算結果帶到輸入框，體感上才像「交換」
  exchangeAmount.value = Math.round(convertedValue.value * 100) / 100
  exchangeDirection.value = exchangeDirection.value === 'toForeign' ? 'toTwd' : 'toForeign'
}

const fetchExchangeRates = async () => {
  exchangeLoading.value = true
  exchange.value.error = ''
  try {
    const res = await $fetch<{ rates: Record<string, number> }>('/api/exchange-rate')
    exchange.value.rates = res.rates
  } catch {
    exchange.value.error = '無法取得匯率資料'
  } finally {
    exchangeLoading.value = false
  }
}

onMounted(() => {
  if (!weather.value.fetched) {
    weather.value.fetched = true
    fetchWeather()
  }
  if (!exchange.value.fetched) {
    exchange.value.fetched = true
    fetchExchangeRates()
  }
})

// 準備清單
const packingLoading = ref(false)
const packingError = ref('')
const packingList = computed(() => props.trip.packingList || [])
const packingCategories = computed(() => {
  const groups: Record<string, PackingItem[]> = {}
  for (const item of packingList.value) {
    (groups[item.category] ??= []).push(item)
  }
  return groups
})

const generatePackingList = async () => {
  packingLoading.value = true
  packingError.value = ''
  try {
    const res = await $fetch<{ categories: { category: string; items: string[] }[] }>('/api/packing-list', {
      method: 'POST',
      body: {
        destination: props.trip.destination,
        days: props.trip.days,
        startDate: props.trip.startDate,
        apiKey: geminiKey.value
      }
    })
    const items: PackingItem[] = res.categories.flatMap((c, ci) =>
      c.items.map((name, i) => ({ id: `${Date.now()}_${ci}_${i}`, category: c.category, name, checked: false }))
    )
    tripsStore.setPackingList(props.trip.id, items)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    packingError.value = err.data?.statusMessage || '生成失敗，請稍後再試'
  } finally {
    packingLoading.value = false
  }
}
</script>

<style scoped>
.scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
