const STORAGE_KEY = 'journi_gemini_key'

export const useGeminiKey = () => {
  const geminiKey = useState<string>('geminiKey', () => '')

  const loadKey = () => {
    if (import.meta.client) {
      geminiKey.value = localStorage.getItem(STORAGE_KEY) || ''
    }
  }

  const saveKey = (val: string) => {
    geminiKey.value = val.trim()
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, val.trim())
    }
  }

  return { geminiKey, loadKey, saveKey }
}
