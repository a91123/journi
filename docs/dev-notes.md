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

#### 匯率參考
- 新增 `server/api/exchange-rate.get.ts`：open.er-api.com（免 key，支援 TWD，Frankfurter 不支援 TWD 所以換這家）
- 前端依目的地關鍵字猜測預設幣別（`guessCurrency`），可用下拉選單覆寫，選擇存回 `trip.currency`
- 資訊 Tab 顯示雙向匯率：1 TWD ≈ X、100 X ≈ Y TWD

#### 旅伴管理
- Store 新增 `Companion` 型別（name/note）+ `addCompanion`/`removeCompanion` actions
- 資訊 Tab 加旅伴列表區塊（新增/刪除，note 可填護照號碼等資訊）

#### 機場接送（+ 通用手動新增訂單）
- `Booking.type` 加 `airport_transfer`
- 新增訂單面板加第三種模式「手動新增」（不經 AI 解析），欄位：類型/名稱/日期時間/地點/航班號/備註，類型下拉預設機場接送但可選任何 Booking 類型，適用所有不需要 AI 解析的手動記錄
- 訂單 filter 加「🚐 接送」分類

#### 地圖檢視
- 新增 `server/api/geocode.get.ts`：代理 Nominatim（OSM 免費 geocoding），帶自訂 `User-Agent`
- 新增「地圖」Tab（行程/總覽/**地圖**/資訊），沿用行程 Tab 的 Day 選擇器
- 用 Leaflet + OSM 圖磚渲染地圖：把當天行程每筆 entry 的 `name` + 目的地組合查 geocode（有 cache，避免重查），依序畫 marker + 折線連接，`fitBounds` 自動置中
- **踩坑**：`GOOGLE_MAPS_API_KEY`（.env 裡的）實測是無效值，Maps Embed API 回「API key invalid」，所以沒有走 Google 地圖這條路
- **踩坑**：Nominatim 有 1 req/sec 速率限制，每筆 geocode 間隔 1.1 秒 sleep（只有真的打 API 才 sleep，cache 命中或已存座標不用）；瀏覽器直接呼叫不符合 Nominatim 使用政策（缺自訂 User-Agent），所以走 server 端代理
- 進入地圖 Tab 才動態 import leaflet + 建立地圖實例，離開 Tab 時 `remove()` 銷毀

---

## 今日進度（2026-07-07）

#### 匯率參考：自訂金額換算
- 加輸入框可打任意金額（預設 10000 TWD）+ 方向切換「⇄」
- **踩坑**：切換方向按鈕原本只換方向不換數字，會讓使用者覺得數字憑空跳掉；改成切換時把目前換算結果帶到輸入框，體感上才像「交換」

#### 訂單：類別 focus 時常駐快速新增
- 篩選到特定類別（如「🚐 接送」）時，filter tags 旁邊常駐顯示「+ 新增{類別}」，點了直接開手動新增表單並帶入該類型，不用先想「原來新增在上面那個按鈕」
- 拿掉原本只在「類別空的時候」才出現的按鈕（會在加過一筆後消失，不利於加第二筆同類型訂單）

#### 地圖檢視：三個實測後發現的 bug
- **踩坑 1（白圖）**：地圖容器原本用 `v-if="currentDayEntries.length===0"` 跟地圖 `v-else` 切換渲染，切到空白天數再切回原本天數時，容器 DOM 被卸載又重新掛載，但 Leaflet map instance 還綁著舊的（已消失的）DOM node，導致地圖變白。**修法**：容器永遠渲染，空狀態改成蓋在地圖上面的絕對定位遮罩，Leaflet instance 全程綁同一個 DOM node
- **踩坑 2（開圖先閃台灣）**：地圖初始化寫死中心在台北，等第一個景點定位完成才 `fitBounds` 跳過去，看起來像「台灣→空白→目的地」在跳動。**修法**：`initMap` 先查一次目的地本身的座標，一開場就置中在正確城市
- **踩坑 3（地名查到別的國家，最關鍵）**：目的地是廣域地區名稱時（例如「關西」），Nominatim 常把它當成中國/印度同名小地方，導致「景點名稱 + 關西」整串查詢查到完全不同國家。純加城市 context（如「大阪」）没問題，但「關西」這種詞本身就是模糊的。**修法**：跟天氣同一招，新增 `server/api/normalize-place.get.ts` 用 Gemini 把目的地轉換成具體城市層級英文地名（「關西」→「Osaka, Japan」），全部景點查詢都用這個轉換後的結果當 context；地圖 Tab 每次只正規化一次（有 cache）
  - **踩坑**：一開始 prompt 要 Gemini 回傳「地區, 國家」（如「Kansai, Japan」），結果「景點名稱, Kansai, Japan」這種三段式查詢在 Nominatim 完全查不到（連正確地點都找不到），改成明確要求回傳「代表城市, 國家」（如「Osaka, Japan」）才穩定
- 座標查到後存回 `TripEntry.lat/lon`（store 新增 `setEntryLocation` action），下次開地圖不用重查，大幅加速也減少 Nominatim 呼叫
- marker 改用編號 `divIcon`（1、2、3...），不用點開彈窗也看得出行程順序，順便不用再處理 Leaflet 預設圖示在 Vite 打包的路徑問題

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

Phase 1 清單已全部完成（見 2026-07-06 進度）。下一步是 Phase 2：

1. **帳號系統**（Supabase Auth，`nuxt.config.ts` 裡註解的 `@nuxtjs/supabase` 模組先打開）
2. **行程分享給同行者**
3. **行事曆同步（Google Calendar）**
4. **出發提醒通知**

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
- [x] 匯率參考
- [x] 旅伴管理
- [x] 機場接送（+ 通用手動新增訂單）
- [x] 地圖檢視（Leaflet + OpenStreetMap）

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
- 條件渲染（`v-if`/`v-else`）切換的容器裡如果放了第三方 JS library（Leaflet 等）綁定的 DOM node，容器被卸載重掛時 library instance 會綁到已消失的舊 node；只要畫面在同一個 Tab 裡可能重複切換就該讓容器永遠渲染，用遮罩處理空狀態，不要用 v-if 拆掉容器本身
- Nominatim 對「廣域地區名 + 具體景點名」的複合查詢常常整串查不到（例如「心齋橋, Kansai, Japan」），但「具體城市 + 景點名」沒問題（「心齋橋, Osaka, Japan」）；用 Gemini 正規化模糊地名時要明確要求輸出城市層級，不要輸出地區層級

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
| 地圖用 Leaflet + OpenStreetMap，不用 Google Maps | `.env` 的 `GOOGLE_MAPS_API_KEY` 實測是無效值；Leaflet+OSM 免費免 key，跟其他免費服務風格一致 |
| 地圖景點座標查到後存回 `TripEntry.lat/lon` | 避免每次開地圖 Tab 都重新對 Nominatim 發查詢，省時間也省請求量 |
| 地名模糊時用 Gemini 正規化成「城市, 國家」 | 廣域地區名（如「關西」）直接查會撞名到其他國家；正規化成具體城市層級（非地區層級）Nominatim 才穩定查得到 |
