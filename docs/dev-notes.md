# Dev Notes

## 今日進度（2026-07-06）

#### AI 推薦卡「排入行程」dialog
- 點推薦卡上「排入」開 dialog：可選「加入備用」或選 Day N（可選填時間）直接寫入 itinerary
- 清掉手機版舊的深色 AI 推薦面板（06-18 改右側抽屜後忘記刪，會跟抽屜同時彈出重複顯示）

#### 桌機版行程卡地圖 icon
- 桌機欄位 entry 卡補上地圖 pin icon（原本只有手機版有），重用既有 `openMapId`/`toggleMap`

#### 準備清單自動生成
- 新增 `server/api/packing-list.post.ts`，依目的地/天數/出發日（推斷季節）用 Gemini 生成分類清單
- Store 新增 `PackingItem` 型別 + `setPackingList`/`togglePackingItem` actions
- 資訊 Tab 加「AI 生成清單」按鈕 + 可勾選 checklist（依分類分組）

#### 天氣查詢
- 新增 `server/api/weather.get.ts`：Open-Meteo geocoding 查地點座標 → forecast 查天氣（免 key）
- 資訊 Tab 加天氣卡片橫向列表，進入資訊 Tab 時才 lazy fetch
- 免費預報僅支援約 16 天內，超出範圍會顯示錯誤訊息
- **踩坑**：Open-Meteo geocoding 對中文口語地名（大阪、台北）查不到，得打官方全名（大阪市、台北市）；純加 `language=zh` 只解決部分案例
- **修法**：查詢前先用 Gemini 把目的地正規化成英文地名（如「大阪」→「Osaka」）再查，失敗才 fallback 回原字串 + zh/en/無語言三段嘗試。城市天氣顆粒度維持整個城市一個代表座標（跟主流天氣 App 一致，不做逐行程地點查詢）

---

## 今日進度（2026-06-24）

#### PDF QR Code 自動掃描
- 上傳 PDF → client-side 同步跑 QR 掃描（`pdfjs-dist` + `jsqr`），不影響 Gemini 解析速度（Promise.all 並行）
- `Booking.qrCodes?: string[]` 存解碼後的文字
- 訂單卡出現圓角 badge「QR」按鈕（active 時 amber，inactive 時 stone），點開展開重繪的 QR Code 圖
- 解析成功後 file input 自動清空（`fileInputRef.value.value = ''`）

#### 訂單卡細節優化
- 機票（`type === 'flight'`）不顯示「地圖 ↗」，其他類型不變

---

## 今日進度（2026-06-18）—— 續2

#### 視覺設計（行程欄位）
- 桌機 Day 欄位卡片：拿掉 navy 黑色 header，改為白底 + 細頂線 + amber 圓點設計
- 欄位背景 `bg-white border border-stone-200 shadow-sm`，entry 行 `bg-stone-50` hover 加深
- entry 左色條按類別上色（amber/orange/sky/emerald/violet），× 按鈕 hover 才顯示
- 時間沒填時不顯示 `--:--`，減少視覺雜訊
- 欄位加寬 `w-56` → `w-72`，內距加大，`min-h-[480px]` 撐開高度
- 橫向捲軸：`scrollbar-hide` CSS 隱藏原生捲軸，右側加漸層淡出提示可繼續滑動

#### AI 推薦改成側邊抽屜
- 舊：頁面底部展開一塊深色 panel
- 新：點「✨ AI 推薦」從右側滑入 `w-96` 抽屜，帶半透明遮罩
- 抽屜內有類別篩選、推薦卡（白底邊框）、換一批、頁數
- 點遮罩或 × 關閉，`Teleport to="body"` + CSS transition 動畫

#### 其他細節
- 目的地標題旁「編輯」改為鉛筆 SVG icon，靠近標題不推到右邊
- Day 選擇器 active 從黑色改為 `bg-amber-400`
- 桌機右側內容區加 `min-w-0` 修復 CSS Grid overflow 問題
- `scrollbar-hide` 的 CSS 寫進 `<style scoped>` 因為沒裝 plugin

---

## 待實作功能

### ~~AI 推薦卡「排入行程」dialog~~ ✅ 已完成（2026-07-06）
- 點推薦卡「排入」開 dialog，可選「加入備用」或選 Day N（可選填時間）直接寫入 itinerary

### 行程卡片 Google Maps 連結 ✅ 已完成（含桌機，2026-07-06）
- `TripEntry` 加 `mapUrl?: string`，編輯表單加「📍 Google Maps 連結」欄位
- 手機 + 桌機卡片都有 mapUrl 時顯示地圖 pin icon，點擊展開 iframe（用景點名稱 embed）+ 「在 Google Maps 開啟 ↗」外連

### ~~票券 QR Code 展示~~ ✅ 已完成（2026-06-24）
- PDF 上傳解析時，client-side 同步掃描 QR Code（`pdfjs-dist` 渲染頁面為 canvas → `jsqr` 解碼）
- 解碼後的文字存入 `Booking.qrCodes?: string[]`，儲存訂單時一起存
- 訂單卡有 QR Code 時出現「🔲 掃碼」按鈕，點開用 `qrcode` 重繪為圖片顯示
- 解析成功後自動清空 file input（`fileInputRef.value.value = ''`）
- 技術：`pdfjs-dist` v6（canvas 傳法需帶 `canvas` + `canvasContext`）、`jsqr` v1、`qrcode` v1
- Worker URL 用 unpkg CDN：`https://unpkg.com/pdfjs-dist@{version}/build/pdf.worker.min.mjs`

---

## 今日進度（2026-06-18）—— 續

#### UI 優化
- 桌機總覽 Tab 從左側 nav 收掉（手機底部 tab 保留）
- 行程 inline 編輯：手機點 entry 展開，桌機點 entry 開 modal
- TimePicker 換成自製 HH:MM 雙欄 input（通吃手機/桌機）
- DateRangePicker 換成原生 `type="date"` 加樣式
- 安裝 Vant（@vant/nuxt），picker 類暫不使用，其他組件後續可用
- Layout navbar 加上下文感知 `‹` chevron（非首頁才顯示），移除各頁面的舊「返回」連結

---

## 今日進度（2026-06-18）

### 今天做了什麼

#### Gemini API Key 使用者自行輸入
- 首頁 header 加「🔑 AI Key」按鈕，點開 modal 輸入/清除
- `useGeminiKey` composable，localStorage 儲存，`useState` 跨頁共用
- 所有 API 呼叫從 body 帶 `apiKey`，server 優先用 body key，fallback `.env`

#### 訂單管理中心（確認信解析）
- `Booking` interface 加進 store，`trip.bookings[]` 永久儲存
- `server/api/parse-confirmation.post.ts`：支援純文字貼上 + PDF 上傳（`pdf-parse` v2）
- Gemini prompt 支援：hotel / flight / ticket / car_rental / train
- 資訊 Tab 重構為「我的訂單」常駐列表 + 收合式新增面板
- 解析後顯示預覽卡片，逐筆「儲存」或「全部儲存」存入 `trip.bookings`
- 訂單卡片常駐顯示，右上 × 刪除

---

## 今日進度（2026-06-15）

### 今天做了什麼

#### 備用 Planner
- AI 推薦景點改為「加入備用」，不直接排入當天
- 手機版：底部 slide-up 抽屜（`<Teleport to="body">`），有淡入遮罩、觸發欄常駐
- 桌機版：左側欄直接內嵌備用清單，hover 顯示「排入」和刪除按鈕
- 備用清單可排入當天，清空時抽屜自動關閉

#### 旅程日期調整
- 右上角「編輯」按鈕開 modal 修改目的地、日期、預算
- 縮短旅程時，超出範圍的行程自動退回備用清單（不刪除）
- 編輯前預覽「將有 N 個行程退回備用」提示

#### 行程排序 + 跨天移動
- 每筆行程有 ↑↓ 按鈕，使用 `order` 數值欄位排序（tiebreaker after time）
- 下拉選單「移至 Day N」可跨天移動行程

#### UI 重構：3 Tab + 桌機兩欄
- Tab 結構：行程 ｜ 總覽 ｜ 資訊
- 手機：底部 tab bar（`lg:hidden`）
- 桌機：左側垂直 tab nav + Day 選擇器 + 備用清單（`hidden lg:flex`）
- 首頁卡片改 3 欄 grid（`lg:grid-cols-3`）
- layout `max-w-6xl` 桌機拉寬

#### 總覽 Tab
- 手機：縱向時間軸，每天一區塊
- 桌機：橫向 Excel 風格卡片（w-52, overflow-x-auto）

#### 桌機橫向行程 + 拖曳排序
- 行程 Tab 桌機改為所有天橫向並排（每天一欄，w-52）
- 使用 `vue-draggable-plus`（SortableJS wrapper）
- 欄內拖曳換順序、跨欄拖曳換天，drag handle `⠿`
- 拖曳結束同步回 Pinia store，`isSyncingFromDrag` flag 防止 watch 循環
- 每欄底部「+ 新增」開 Modal 新增行程

#### TypeScript 型別保護
- `useTripsStore.js` → `useTripsStore.ts`
- 新增 export interface：`TripEntry`、`StandbyItem`、`Trip`
- `[id].vue` script 改 `lang="ts"`，新增 `Column`、`AiRecommendation` interface
- 全函數加型別，null guard，`nuxi typecheck` 通過（0 errors）

---

## 明天從哪開始

準備清單、天氣查詢已完成（見 2026-07-06 進度）。下一個優先順序：

1. **旅伴管理**（一個人管全家機票）
2. **機場接送**（手動填表單）
3. **匯率參考**
4. **地圖檢視**（Google Maps 整體地圖，非單筆行程連結）

---

## 目前完成清單

- [x] 建立 / 管理多趟旅程
- [x] 行程編輯器（每日時間軸）
- [x] AI 景點推薦卡（批次生成，每次 5 個）
- [x] 備用 planner 區塊（手機抽屜 + 桌機側欄）
- [x] 旅程日期調整（縮短時行程退回備用）
- [x] 行程排序（↑↓）+ 跨天移動
- [x] UI 重構：3 Tab + 桌機兩欄佈局
- [x] 總覽 Tab（手機縱向 / 桌機橫向）
- [x] 桌機橫向行程 + vue-draggable-plus 拖曳
- [x] TypeScript 型別保護（store + [id].vue）
- [x] 訂單管理中心（確認信解析 + PDF QR Code 掃描）
- [x] AI 推薦卡「排入行程」dialog
- [x] 桌機版行程卡地圖 icon
- [x] 準備清單自動生成
- [x] 天氣查詢

---

## 踩坑記錄

- Nuxt 4 的 `stores/` 目錄要放在 `app/` 下才能 auto-import，根目錄的 `stores/` 不吃
- `@nuxtjs/supabase` 啟動時會驗證 URL 格式，`.env` 沒填真實值會報錯無法啟動，Phase 1 先註解掉
- `<Teleport>` 不能放在 `v-if` 和 `v-else` 中間，要放在 `v-if` 內部才不會破壞 v-if/v-else pair
- `v-else-if` 和 `<Teleport>` 的配合：Teleport 要在最後，不能插在條件渲染之間
- `split('T')[0]` 在 TypeScript strict 下回傳 `string | undefined`，改用 `substring(0, 10)`
- VueDraggable `v-model` 綁 `columns[colIdx]!.entries`，需要非空斷言因為 array indexing 在 TS strict 下回傳 `T | undefined`
- Open-Meteo geocoding 對中文口語地名（大阪、台北）常查不到，得打官方全名（大阪市、台北市）；純加 `language=zh` 只解決部分案例，改用 Gemini 先把地名正規化成英文再查才穩定
- 開發時偶爾遇到的 API 失敗，重測前先確認不是 Nitro 熱重載中途命中舊代碼（server 檔案存檔瞬間會有短暫視窗打到舊版本）

---

## 技術決定紀錄

| 決定 | 原因 |
|---|---|
| Supabase 先關閉 | Phase 1 用 localStorage，等使用者建好帳號再開 |
| Gemini `gemini-2.5-flash-lite` | 免費、夠快，使用者已有 API key |
| 備用 planner 而非直接加入行程 | 符合真實規劃習慣：先列清單再排時間 |
| AI 推薦批次 20 個前端分頁 | 減少 API 呼叫，換一批不重打 |
| vue-draggable-plus v0.6.1 | SortableJS 的 Vue 3 wrapper，支援跨 group 拖曳 |
| `order` 欄位排序 | 手動排序不依賴陣列 index，跨天移動後順序不亂 |
| 天氣顆粒度：整個城市一個代表座標 | 跟主流天氣 App 一致，不逐行程地點查詢；決策記錄見 2026-07-06 |
| 天氣地名查詢前先用 Gemini 正規化 | Open-Meteo geocoding 對中文口語地名覆蓋率不足，正規化成英文能解決大部分案例，多一次呼叫但天氣是 lazy fetch 只打一次 |
| Open-Meteo（geocoding + forecast） | 免費、不需 key，符合 Phase 1 輕量原則 |
| TypeScript strict | 提早抓 null/undefined，store interface 可跨檔案共用 |
