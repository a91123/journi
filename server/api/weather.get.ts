interface GeoResult {
  latitude: number
  longitude: number
  name: string
}

interface ForecastResponse {
  daily: {
    time: string[]
    weathercode: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const destination = String(query.destination || '')
  const startDate = String(query.startDate || '')
  const endDate = String(query.endDate || '')
  const apiKey = String(query.apiKey || '')

  if (!destination || !startDate || !endDate) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要參數' })
  }

  const searchGeo = async (name: string, language?: string): Promise<GeoResult | undefined> => {
    const geo = await $fetch<{ results?: GeoResult[] }>('https://geocoding-api.open-meteo.com/v1/search', {
      query: { name, count: 1, ...(language ? { language } : {}) }
    })
    return geo.results?.[0]
  }

  const normalizeDestination = async (): Promise<string | null> => {
    const config = useRuntimeConfig()
    const key = apiKey || config.geminiApiKey
    if (!key) return null
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      const prompt = `請把以下旅遊目的地轉換成最適合拿去查詢地理資料庫（GeoNames）的英文地名，只回傳地名本身，不要加註解或標點符號。
例如「大阪」回傳「Osaka」，「東京, 日本」回傳「Tokyo, Japan」，「台北」回傳「Taipei」。

目的地：${destination}`
      const result = await model.generateContent(prompt)
      return result.response.text().trim() || null
    } catch {
      return null
    }
  }

  const findPlace = async (): Promise<GeoResult | undefined> => {
    const normalized = await normalizeDestination()
    if (normalized) {
      const place = await searchGeo(normalized)
      if (place) return place
    }
    for (const language of ['zh', 'en', undefined]) {
      const place = await searchGeo(destination, language)
      if (place) return place
    }
    return undefined
  }

  const place = await findPlace()
  if (!place) {
    throw createError({ statusCode: 404, statusMessage: '找不到這個地點的天氣資料，可以試試更精確的地名（如：大阪市）' })
  }

  try {
    const forecast = await $fetch<ForecastResponse>('https://api.open-meteo.com/v1/forecast', {
      query: {
        latitude: place.latitude,
        longitude: place.longitude,
        daily: 'weathercode,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        start_date: startDate,
        end_date: endDate
      }
    })

    return {
      location: place.name,
      days: forecast.daily.time.map((date, i) => ({
        date,
        weatherCode: forecast.daily.weathercode[i],
        max: forecast.daily.temperature_2m_max[i],
        min: forecast.daily.temperature_2m_min[i]
      }))
    }
  } catch {
    throw createError({ statusCode: 404, statusMessage: '無法取得天氣資料，日期可能超出預報範圍（約 16 天內）' })
  }
})
