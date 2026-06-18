import { GoogleGenerativeAI } from '@google/generative-ai'

export default defineEventHandler(async (event) => {
  const { destination, category, apiKey } = await readBody(event)
  const config = useRuntimeConfig()
  const key = apiKey || config.geminiApiKey

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: '請先設定 Gemini API Key' })
  }

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const categoryHint = category && category !== 'all'
    ? `類型限定：${category}（food=美食, culture=文化景點, nature=自然, shopping=購物）`
    : '類型多元，涵蓋美食、文化、自然、購物'

  const prompt = `你是旅遊顧問，請推薦 ${destination} 的 20 個值得去的地方。
${categoryHint}

每個地方包含：
- id: 隨機字串
- name: 名稱（當地語言或中文）
- category: food / culture / nature / shopping 其中一個
- description: 一句話介紹（30字內）
- duration: 建議停留時間，格式為數字字串如 "1-2"

只回傳 JSON，格式：{"attractions": [...]}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()

  return JSON.parse(text)
})
