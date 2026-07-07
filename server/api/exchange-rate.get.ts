export default defineEventHandler(async () => {
  try {
    const res = await $fetch<{ result: string; rates: Record<string, number> }>(
      'https://open.er-api.com/v6/latest/TWD'
    )
    if (res.result !== 'success') {
      throw createError({ statusCode: 502, statusMessage: '無法取得匯率資料' })
    }
    return { rates: res.rates }
  } catch {
    throw createError({ statusCode: 502, statusMessage: '無法取得匯率資料' })
  }
})
