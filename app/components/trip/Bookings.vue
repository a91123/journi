<template>
  <!-- 訂單管理中心 -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">我的訂單</p>
      <button
        @click="showAddBooking = !showAddBooking"
        class="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
        :class="showAddBooking ? 'bg-slate-100 text-slate-500' : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
      >{{ showAddBooking ? '收起' : '+ 新增' }}</button>
    </div>

    <!-- 新增訂單面板 -->
    <div v-if="showAddBooking" ref="addBookingEl" class="bg-white rounded-2xl border border-stone-100 p-4 space-y-3 mb-3">
      <div class="flex gap-2">
        <button
          @click="confirmMode = 'text'"
          class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="confirmMode === 'text' ? 'bg-amber-400 text-slate-900' : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
        >貼上文字</button>
        <button
          @click="confirmMode = 'pdf'"
          class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="confirmMode === 'pdf' ? 'bg-amber-400 text-slate-900' : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
        >上傳 PDF</button>
        <button
          @click="confirmMode = 'manual'"
          class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="confirmMode === 'manual' ? 'bg-amber-400 text-slate-900' : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
        >手動新增</button>
      </div>

      <textarea
        v-if="confirmMode === 'text'"
        v-model="confirmText"
        placeholder="把確認信的文字複製貼上來..."
        rows="5"
        class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none"
      />

      <div v-else-if="confirmMode === 'pdf'">
        <label
          class="flex flex-col items-center gap-2 py-7 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors"
          :class="confirmFile ? 'border-emerald-300 bg-emerald-50' : ''"
        >
          <span class="text-2xl">{{ confirmFile ? '📄' : '📎' }}</span>
          <span class="text-sm text-slate-500">{{ confirmFile ? confirmFile.name : '點擊選擇 PDF 檔案' }}</span>
          <input ref="fileInputRef" type="file" accept=".pdf" class="hidden" @change="onFileChange" />
        </label>
      </div>

      <!-- 手動新增表單（機場接送等不需要 AI 解析的項目） -->
      <div v-else class="space-y-2">
        <select v-model="manualBooking.type" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
          <option value="airport_transfer">🚐 機場接送</option>
          <option value="hotel">🏨 住宿</option>
          <option value="flight">✈️ 機票</option>
          <option value="train">🚄 火車</option>
          <option value="car_rental">🚗 租車</option>
          <option value="ticket">🎟 票券</option>
          <option value="other">📋 其他</option>
        </select>
        <input v-model="manualBooking.name" placeholder="名稱（如：接機 - 桃園機場）" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        <div class="grid grid-cols-2 gap-2">
          <input v-model="manualBooking.startDate" type="date" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          <TimePicker v-model="manualBooking.startTime" />
        </div>
        <input v-model="manualBooking.location" placeholder="地點（如：第一航廈入境大廳）" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        <input v-model="manualBooking.confirmationNumber" placeholder="航班號 / 訂單號（選填）" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        <input v-model="manualBooking.note" placeholder="備註（選填）" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
      </div>

      <button
        v-if="confirmMode !== 'manual'"
        @click="parseConfirmation"
        :disabled="confirmLoading || (confirmMode === 'text' ? !confirmText.trim() : !confirmFile)"
        class="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
        :class="confirmLoading || (confirmMode === 'text' ? !confirmText.trim() : !confirmFile)
          ? 'bg-stone-100 text-slate-400 cursor-not-allowed'
          : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
      >{{ confirmLoading ? '解析中...' : 'AI 解析' }}</button>

      <button
        v-else
        @click="saveManualBooking"
        :disabled="!manualBooking.name.trim()"
        class="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
        :class="!manualBooking.name.trim() ? 'bg-stone-100 text-slate-400 cursor-not-allowed' : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
      >新增訂單</button>

      <div v-if="confirmError" class="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{{ confirmError }}</div>

      <!-- 解析結果 → 確認後存入 -->
      <div v-if="parsedBookings.length > 0" class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">解析結果</p>
          <button @click="saveAllBookings" class="text-xs font-bold text-amber-600 hover:text-amber-700">全部儲存</button>
        </div>
        <div
          v-for="(b, i) in parsedBookings"
          :key="i"
          class="border rounded-xl p-3 space-y-1 transition-colors"
          :class="b._saved ? 'border-emerald-200 bg-emerald-50' : 'border-stone-100'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base leading-none">{{ bookingTypeIcon(b.type) }}</span>
              <span class="font-medium text-slate-800 text-sm">{{ b.name }}</span>
            </div>
            <span v-if="b._saved" class="text-xs text-emerald-500 font-medium">已儲存</span>
            <button
              v-else
              @click="saveBooking(b, i)"
              class="text-xs bg-amber-400 hover:bg-amber-500 text-slate-900 px-3 py-1 rounded-lg font-bold transition-colors"
            >儲存</button>
          </div>
          <p v-if="b.startDate" class="text-xs text-slate-400">
            {{ b.startDate }}{{ b.startTime ? ' ' + b.startTime : '' }}
            <template v-if="b.endDate && b.endDate !== b.startDate"> → {{ b.endDate }}{{ b.endTime ? ' ' + b.endTime : '' }}</template>
          </p>
          <p v-if="b.location" class="text-xs text-slate-400 truncate">📍 {{ b.location }}</p>
          <p v-if="b.confirmationNumber" class="text-xs text-slate-300">訂單號 {{ b.confirmationNumber }}</p>
        </div>
      </div>
    </div>

    <!-- Filter Tags -->
    <div v-if="tripBookings.length > 0" class="flex items-center justify-between gap-2 flex-wrap mb-2">
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in bookingFilters"
          :key="f.value"
          @click="activeBookingFilter = f.value"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
          :class="activeBookingFilter === f.value
            ? 'bg-amber-400 text-slate-900'
            : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
        >{{ f.label }}</button>
      </div>
      <button
        v-if="activeBookingFilter !== 'all'"
        @click="quickAddBooking(activeBookingFilter as Booking['type'])"
        class="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex-shrink-0"
      >+ 新增{{ bookingTypeLabel(activeBookingFilter) }}</button>
    </div>

    <!-- 訂單列表 -->
    <div v-if="tripBookings.length === 0 && !showAddBooking" class="text-slate-300 text-sm text-center py-10 bg-white rounded-2xl border border-stone-100">
      還沒有訂單，點「+ 新增」貼上確認信
    </div>

    <div v-else-if="filteredBookings.length > 0" class="space-y-2">
      <div
        v-for="b in filteredBookings"
        :key="b.id"
        class="bg-white rounded-2xl border border-stone-100 p-4 space-y-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xl leading-none flex-shrink-0">{{ bookingTypeIcon(b.type) }}</span>
            <div class="min-w-0">
              <span class="font-semibold text-slate-800 text-sm truncate block">{{ b.name }}</span>
              <span class="text-xs text-slate-400">{{ bookingTypeLabel(b.type) }}</span>
            </div>
          </div>
          <button @click="tripsStore.removeBooking(trip.id, b.id)" class="text-slate-200 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none">×</button>
        </div>
        <div class="space-y-1 pl-7">
          <p v-if="b.startDate" class="text-xs text-slate-500">
            {{ b.startDate }}{{ b.startTime ? ' ' + b.startTime : '' }}
            <template v-if="b.endDate && b.endDate !== b.startDate"> → {{ b.endDate }}{{ b.endTime ? ' ' + b.endTime : '' }}</template>
          </p>
          <p v-if="b.location" class="text-xs text-slate-400">📍 {{ b.location }}</p>
          <p v-if="b.note" class="text-xs text-slate-400">{{ b.note }}</p>
          <div class="flex items-center gap-3 pt-0.5 flex-wrap">
            <span v-if="b.confirmationNumber" class="text-xs text-slate-300">訂單號 {{ b.confirmationNumber }}</span>
            <span v-if="b.price" class="text-xs font-medium text-slate-500">{{ b.price }}</span>
            <a
              v-if="(b.location || b.name) && b.type !== 'flight'"
              :href="mapsUrl(b)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-amber-500 hover:text-amber-600 font-medium transition-colors"
            >地圖 ↗</a>
            <button
              v-if="b.qrCodes && b.qrCodes.length > 0"
              @click="toggleQr(b.id, b.qrCodes || [])"
              class="px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
              :class="activeQrBookingId === b.id ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600'"
            >QR</button>
          </div>
        </div>
        <div v-if="b.qrCodes?.length && activeQrBookingId === b.id" class="flex flex-col items-center gap-2 pt-2 mt-1 border-t border-stone-100">
          <img
            v-for="(url, idx) in qrImages[b.id]"
            :key="idx"
            :src="url"
            alt="QR Code"
            class="w-48 h-48"
          />
        </div>
      </div>
    </div>

    <div v-else-if="tripBookings.length > 0" class="text-slate-300 text-sm text-center py-8 bg-white rounded-2xl border border-stone-100">
      這個類別還沒有訂單
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, Booking } from '~/stores/useTripsStore'

interface ParsedBooking {
  type: string
  name: string
  confirmationNumber: string | null
  startDate: string | null
  startTime: string | null
  endDate: string | null
  endTime: string | null
  location: string | null
  note: string | null
  price: string | null
  qrCodes?: string[]
  _saved?: boolean
}

const props = defineProps<{ trip: Trip }>()
const tripsStore = useTripsStore()
const { geminiKey } = useGeminiKey()

const tripBookings = computed(() => props.trip.bookings || [])

const bookingFilters = [
  { value: 'all', label: '全部' },
  { value: 'hotel', label: '🏨 住宿' },
  { value: 'flight', label: '✈️ 機票' },
  { value: 'train', label: '🚄 火車' },
  { value: 'car_rental', label: '🚗 租車' },
  { value: 'ticket', label: '🎟 票券' },
  { value: 'airport_transfer', label: '🚐 接送' },
]
const activeBookingFilter = ref('all')
const filteredBookings = computed(() =>
  activeBookingFilter.value === 'all'
    ? tripBookings.value
    : tripBookings.value.filter(b => b.type === activeBookingFilter.value)
)

const showAddBooking = ref(false)
const confirmMode = ref<'text' | 'pdf' | 'manual'>('text')
const confirmText = ref('')
const confirmFile = ref<File | null>(null)
const confirmLoading = ref(false)
const confirmError = ref('')
const parsedBookings = ref<ParsedBooking[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const activeQrBookingId = ref<string | null>(null)
const qrImages = ref<Record<string, string[]>>({})

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  confirmFile.value = input.files?.[0] ?? null
}

const manualBooking = reactive({
  type: 'airport_transfer' as Booking['type'],
  name: '',
  startDate: '',
  startTime: '',
  location: '',
  confirmationNumber: '',
  note: ''
})

const saveManualBooking = () => {
  if (!manualBooking.name.trim()) return
  tripsStore.addBooking(props.trip.id, {
    type: manualBooking.type,
    name: manualBooking.name,
    confirmationNumber: manualBooking.confirmationNumber || null,
    startDate: manualBooking.startDate || null,
    startTime: manualBooking.startTime || null,
    endDate: null,
    endTime: null,
    location: manualBooking.location || null,
    note: manualBooking.note || null,
    price: null
  })
  Object.assign(manualBooking, { type: 'airport_transfer', name: '', startDate: '', startTime: '', location: '', confirmationNumber: '', note: '' })
  showAddBooking.value = false
}

const addBookingEl = ref<HTMLElement | null>(null)

const quickAddBooking = (type: Booking['type']) => {
  manualBooking.type = type
  confirmMode.value = 'manual'
  showAddBooking.value = true
  nextTick(() => addBookingEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

const extractQrCodes = async (file: File): Promise<string[]> => {
  if (!import.meta.client) return []
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    const jsQR = (await import('jsqr')).default
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const codes: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(imageData.data, imageData.width, imageData.height)
      if (result && !codes.includes(result.data)) codes.push(result.data)
    }
    return codes
  } catch {
    return []
  }
}

const toggleQr = async (bookingId: string, codes: string[]) => {
  if (activeQrBookingId.value === bookingId) {
    activeQrBookingId.value = null
    return
  }
  activeQrBookingId.value = bookingId
  if (!qrImages.value[bookingId]) {
    const QRCode = (await import('qrcode')).default
    const urls = await Promise.all(
      codes.map(code => QRCode.toDataURL(code, { width: 200, margin: 2 }))
    )
    qrImages.value = { ...qrImages.value, [bookingId]: urls }
  }
}

const parseConfirmation = async () => {
  confirmLoading.value = true
  confirmError.value = ''
  parsedBookings.value = []

  try {
    let res: { bookings: ParsedBooking[] }
    let qrCodes: string[] = []

    if (confirmMode.value === 'pdf' && confirmFile.value) {
      const file = confirmFile.value
      const form = new FormData()
      form.append('file', file)
      form.append('apiKey', geminiKey.value)
      const [parseResult, extracted] = await Promise.all([
        $fetch<{ bookings: ParsedBooking[] }>('/api/parse-confirmation', { method: 'POST', body: form }),
        extractQrCodes(file)
      ])
      res = parseResult
      qrCodes = extracted
      confirmFile.value = null
      if (fileInputRef.value) fileInputRef.value.value = ''
    } else {
      res = await $fetch('/api/parse-confirmation', {
        method: 'POST',
        body: { text: confirmText.value, apiKey: geminiKey.value }
      })
    }
    parsedBookings.value = res.bookings.map(b => ({
      ...b,
      qrCodes: qrCodes.length > 0 ? qrCodes : undefined
    }))
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    confirmError.value = err.data?.statusMessage || err.message || '解析失敗，請再試一次'
  } finally {
    confirmLoading.value = false
  }
}

const saveBooking = (booking: ParsedBooking, index: number) => {
  tripsStore.addBooking(props.trip.id, {
    type: booking.type as Booking['type'],
    name: booking.name,
    confirmationNumber: booking.confirmationNumber,
    startDate: booking.startDate,
    startTime: booking.startTime,
    endDate: booking.endDate,
    endTime: booking.endTime,
    location: booking.location,
    note: booking.note,
    price: booking.price,
    qrCodes: booking.qrCodes
  })
  parsedBookings.value[index]!._saved = true
}

const saveAllBookings = () => {
  parsedBookings.value.forEach((b, i) => {
    if (!b._saved) saveBooking(b, i)
  })
}

const mapsUrl = (b: { name: string; location: string | null }) => {
  const q = [b.location, b.name].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
</script>
