import { GoogleGenerativeAI } from '@google/generative-ai'
import { PDFParse } from 'pdf-parse'

const PROMPT = (text: string) => `你是旅遊訂單解析助手。從以下確認信中提取所有預訂項目。

支援類型：
- hotel（飯店/旅館，Agoda/Booking.com/Hotels.com 等）
- flight（機票，任何航空公司）
- ticket（門票/體驗，Klook/KKday/GetYourGuide 等）
- car_rental（租車）
- train（火車/高鐵/新幹線）

每筆預訂回傳以下欄位（沒有的填 null）：
- type: 類型（上述其中一個）
- name: 預訂名稱（飯店名/航班號/活動名/車次等）
- confirmationNumber: 訂單號或確認碼
- startDate: 開始日期，格式 YYYY-MM-DD
- startTime: 開始時間，格式 HH:MM（24小時制）
- endDate: 結束日期，格式 YYYY-MM-DD
- endTime: 結束時間，格式 HH:MM（24小時制）
- location: 地點/地址（飯店地址、機場代碼、活動地點等）
- note: 備註（房型、艙等、附加內容等，30字內）
- price: 金額含幣別，如 "NT$ 5,470"

一封信可能有多筆預訂（如來回機票算兩筆），全部列出。
只回傳 JSON，格式：{"bookings": [...]}

確認信內容：
${text}`

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const contentType = getHeader(event, 'content-type') || ''

  let text = ''
  let apiKey = ''

  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    if (!parts) throw createError({ statusCode: 400, statusMessage: '無法解析表單' })

    for (const part of parts) {
      if (part.name === 'apiKey') {
        apiKey = part.data.toString()
      } else if (part.name === 'text') {
        text = part.data.toString()
      } else if (part.name === 'file' && part.filename) {
        const parser = new PDFParse({ data: new Uint8Array(part.data) })
        const result = await parser.getText()
        text = result.text
      }
    }
  } else {
    const body = await readBody(event)
    text = body.text || ''
    apiKey = body.apiKey || ''
  }

  const key = apiKey || config.geminiApiKey
  if (!key) throw createError({ statusCode: 400, statusMessage: '請先設定 Gemini API Key' })
  if (!text.trim()) throw createError({ statusCode: 400, statusMessage: '內容不能為空' })

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const result = await model.generateContent(PROMPT(text))
  const raw = result.response.text().replace(/```json|```/g, '').trim()

  return JSON.parse(raw)
})
