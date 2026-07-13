import type { TripEntry } from '~/stores/useTripsStore'

// 行程 Tab / 地圖 Tab 共用的每日資訊（由 [id].vue 的 dayList computed 產生）
export interface DayInfo {
  date: string
  label: string
  fullLabel: string
}

export const categoryEmoji = (cat: string) => ({
  attraction: '🏛', food: '🍜', transport: '🚌', hotel: '🏨', ticket: '🎟', other: '📌'
}[cat] || '📌')

export const categoryLabel = (cat: string) => ({
  attraction: '景點', food: '美食', transport: '交通', hotel: '住宿', ticket: '票券', other: '其他'
}[cat] || '其他')

export const categoryColor = (cat: string) => ({
  attraction: 'bg-amber-400',
  food: 'bg-orange-400',
  transport: 'bg-sky-400',
  hotel: 'bg-emerald-400',
  ticket: 'bg-violet-400',
  other: 'bg-stone-300'
}[cat] || 'bg-stone-300')

export const bookingTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    hotel: '🏨', flight: '✈️', ticket: '🎟', car_rental: '🚗', train: '🚄', airport_transfer: '🚐'
  }
  return icons[type] ?? '📋'
}

export const bookingTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    hotel: '住宿', flight: '機票', ticket: '票券', car_rental: '租車', train: '火車', airport_transfer: '機場接送', other: '其他'
  }
  return labels[type] ?? '其他'
}

export const formatShortDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const formatFullDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}/${d.getDate()}（${weekDays[d.getDay()]}）`
}

// 同一天內的排序規則：先比時間，再比手動排序的 order
export const sortByTimeThenOrder = (a: TripEntry, b: TripEntry) => {
  const t = (a.time || '').localeCompare(b.time || '')
  return t !== 0 ? t : (a.order ?? 0) - (b.order ?? 0)
}

export const weatherEmoji = (code: number) => {
  if (code === 0) return '☀️'
  if ([1, 2, 3].includes(code)) return '⛅'
  if ([45, 48].includes(code)) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌤️'
}

export const guessCurrency = (destination: string): string => {
  const rules: [RegExp, string][] = [
    [/日本|東京|大阪|京都|北海道|沖繩|名古屋|Japan|Tokyo|Osaka|Kyoto/i, 'JPY'],
    [/韓國|首爾|釜山|Korea|Seoul|Busan/i, 'KRW'],
    [/泰國|曼谷|清邁|普吉|Thailand|Bangkok/i, 'THB'],
    [/新加坡|Singapore/i, 'SGD'],
    [/馬來西亞|吉隆坡|檳城|Malaysia/i, 'MYR'],
    [/印尼|峇里|雅加達|Indonesia|Bali/i, 'IDR'],
    [/菲律賓|馬尼拉|宿霧|Philippines|Manila/i, 'PHP'],
    [/香港|Hong Kong/i, 'HKD'],
    [/中國|上海|北京|China|Shanghai|Beijing/i, 'CNY'],
    [/美國|紐約|洛杉磯|舊金山|USA|United States|New York/i, 'USD'],
    [/加拿大|溫哥華|多倫多|Canada/i, 'CAD'],
    [/英國|倫敦|UK|London/i, 'GBP'],
    [/法國|德國|義大利|西班牙|荷蘭|France|Germany|Italy|Spain|Paris|Rome/i, 'EUR'],
    [/澳洲|雪梨|墨爾本|Australia|Sydney/i, 'AUD'],
    [/紐西蘭|New Zealand/i, 'NZD'],
    [/瑞士|Switzerland/i, 'CHF'],
    [/土耳其|Turkey/i, 'TRY'],
    [/印度|India/i, 'INR']
  ]
  for (const [re, code] of rules) if (re.test(destination)) return code
  return 'JPY'
}
