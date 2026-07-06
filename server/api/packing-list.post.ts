import { GoogleGenerativeAI } from '@google/generative-ai'

const PROMPT = (destination: string, days: number, startDate: string) => `你是旅遊打包顧問。使用者要去 ${destination}，總共 ${days} 天，出發日期約為 ${startDate}（請依此推斷當地季節與氣候）。

請生成一份出發前準備清單，依以下分類整理：證件、藥品、衣物、換匯、其他。
每個項目簡短（不超過 15 字），衣物類請依實際目的地氣候調整建議。

只回傳 JSON，格式：{"categories": [{"category": "證件", "items": ["護照", "簽證"]}, ...]}`

export default defineEventHandler(async (event) => {
  const { destination, days, startDate, apiKey } = await readBody(event)
  const config = useRuntimeConfig()
  const key = apiKey || config.geminiApiKey

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: '請先設定 Gemini API Key' })
  }
  if (!destination || !days || !startDate) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要參數' })
  }

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const result = await model.generateContent(PROMPT(destination, days, startDate))
  const text = result.response.text().replace(/```json|```/g, '').trim()

  return JSON.parse(text)
})
