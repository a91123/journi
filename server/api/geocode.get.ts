interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q || '')

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: '缺少查詢字串' })
  }

  const results = await $fetch<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
    query: { q, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'journi-travel-app (personal use, https://github.com)' }
  })

  const place = results?.[0]
  if (!place) {
    throw createError({ statusCode: 404, statusMessage: '找不到這個地點' })
  }

  return {
    lat: Number(place.lat),
    lon: Number(place.lon),
    displayName: place.display_name
  }
})
