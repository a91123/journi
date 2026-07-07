export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const destination = String(query.destination || '')
  const apiKey = String(query.apiKey || '')

  if (!destination) {
    throw createError({ statusCode: 400, statusMessage: '缺少目的地' })
  }

  const config = useRuntimeConfig()
  const key = apiKey || config.geminiApiKey
  if (!key) return { normalized: destination }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const prompt = `請把以下旅遊目的地轉換成一個具體城市層級的英文地名，用來查詢地圖資料庫（OpenStreetMap/Nominatim）。
- 如果目的地是廣域地區名稱（例如「關西」「北海道」「東北」這種涵蓋多個城市的詞），請改用該地區最具代表性的主要城市，不要回傳廣域地區本身（廣域名稱加城市名一起查詢常常查不到結果）
- 避免使用容易撞名到其他國家同名地點的模糊詞
只回傳地名本身，不要加註解或標點符號。

例如：
「關西」回傳「Osaka, Japan」
「北海道」回傳「Sapporo, Japan」
「大阪」回傳「Osaka, Japan」
「台北」回傳「Taipei, Taiwan」

目的地：${destination}`
    const result = await model.generateContent(prompt)
    const normalized = result.response.text().trim()
    return { normalized: normalized || destination }
  } catch {
    return { normalized: destination }
  }
})
