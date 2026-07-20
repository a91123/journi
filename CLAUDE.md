# journi

旅遊規劃 App，目標是讓使用者從「想去哪」到「出發前準備好」全部在一個地方搞定。

## 定位

不是訂票平台，是旅遊管理中心：
- 規劃階段：AI 輔助建議，但使用者有完全控制權
- 訂票階段：導去外部平台（Google Flights / Booking.com），訂完貼回來
- 整合階段：所有資訊集中在一份行程表

參考過 TripIt，功能比它更完整（加了 AI 規劃、準備清單、天氣匯率）。

---

## 技術棧

| 層 | 選擇 |
|---|---|
| 框架 | Nuxt 3 |
| 資料庫 | Supabase |
| AI | Gemini API（免費）|
| 打包 App | Capacitor |
| 部署 | Vercel |

---

## 使用者主流程

```
1. 建立旅程（目的地 + 日期 + 天數）
        ↓
2. 進入行程編輯器
   - 空白格子，自己填
   - 可按 AI 推薦景點（卡片形式，批次生成，不喜歡可換一批）
        ↓
3. 訂票訂房（隨時都可以，不擋流程）
   - 導去 Google Flights / Booking.com
   - 訂完把確認信貼回來，AI 自動解析填入行程
        ↓
4. 補充資訊
   - 機場接送（手動填）
   - 天氣預報
   - 匯率參考
   - 地圖檢視
        ↓
5. 出發前
   - 準備清單（AI 根據目的地自動生成：簽證、換匯、藥品等）
   - 行程總覽
```

---

## 備用 Planner

行程規劃的核心概念：先收集、再排程。

- 每趟旅程都有一個「備用 planner」區塊（行程頁面底部，可收合）
- **AI 推薦**的景點 → 先加入備用 planner，再從備用拖進某一天
- **自己想到的地方** → 也可以先丟備用，不用馬上決定哪天去
- **Klook / KKday 買的票** → 貼確認信解析後先進備用，再排到對應那天
- **日期縮短時**，被移除那幾天的行程 → 自動退回備用，不刪除

備用 planner 就是數位版的便利貼牆，使用者可以把所有「想去」的先收進來，慢慢比較再決定排哪天。

---

## AI 設計原則

**景點推薦：**
- 一次呼叫 API 生成 20 個景點
- 前端每次顯示 5 個（卡片）
- 換一批從剩下的取，不重複打 API
- 全部看完才再打一次
- 依類型分頁：美食 / 文化 / 自然 / 購物
- 「加入」按鈕 → 加入備用 planner，不直接排進當天

**確認信解析：**
- 使用者貼上原文
- AI 解析出：航班號、時間、飯店名稱、地址、訂單號等
- 自動填入行程對應位置

**準備清單：**
- 根據目的地、天數、季節生成
- 分類：證件、藥品、衣物、換匯、其他

---

## Phase 規劃

### Phase 1（自己用）
- [x] 建立 / 管理多趟旅程
- [x] 行程編輯器（每日時間軸）
- [x] AI 景點推薦卡（批次生成，每次 5 個）
- [x] 備用 planner 區塊
- [x] 旅程日期調整（縮短時行程退回備用）
- [x] 桌機橫向行程 + 拖曳排序（跨天拖曳）
- [x] 貼上確認信 → AI 解析填入（機票 / 飯店 / Klook / KKday）
- [x] 準備清單自動生成
- [x] 天氣查詢（目的地 + 旅遊日期）
- [x] 旅伴管理（一個人管全家機票）
- [x] 機場接送（手動填表單）
- [x] 匯率參考
- [x] 地圖檢視（Leaflet + OpenStreetMap，非 Google Maps——.env 的 key 是無效值）

### Phase 1.5（低成本高價值，建議排在 Phase 2 帳號系統之前）
- [ ] **JSON 匯出／匯入** — 目前資料只活在單一瀏覽器的 localStorage，換裝置或清瀏覽器資料就整個消失（含訂單、護照號碼備註）。在 Supabase 上線前先做一個保險絲，半天工，投報率最高
- [x] **訂單併入行程時間軸**（2026-07-13 完成）— `trip.bookings` 原本只活在資訊 Tab，跟 `itinerary` 是平行世界。做法：`app/utils/tripDisplay.ts` 新增 `getBookingMarkersForDay()`，把訂單依 `startDate`/`endDate` 轉成當天的唯讀節點（hotel/flight 起訖不同天會各顯示一個「入住/退房」「起飛/抵達」）。Overview Tab（純顯示、無拖曳）跟行程項目按時間完整合併排序；行程 Tab 因為桌機欄位有拖曳排序，唯讀訂單節點改用固定在欄位最上方的「訂單節點區」呈現，不混進可拖曳的 itinerary 陣列，避免影響 SortableJS 邏輯。點節點會切到「資訊」Tab 看完整訂單
- [ ] **「今日」自動聚焦** — 旅程進行中那幾天，打開 App 應直接跳到當天的行程 Tab，而不是停在 Day 1／上次瀏覽的 Tab。出國當下才是最需要這功能的時刻
- [ ] **花費記錄對照預算** — `Trip.budget` 欄位存了之後只在首頁卡片露臉一次，沒有任何後續使用。要嘛做簡單記帳（花費 vs 預算進度條），要嘛乾脆拿掉這個欄位，目前狀態最尷尬
- [ ] **唯讀分享連結（Phase 2 分享的輕量前置）** — 把行程序列化成連結或匯出 PDF，不用等 Supabase 帳號系統就能「把行程給媽媽看」

### 需要 Phase 2 一併考慮的事
- Gemini API Key 的處理方式併入下方「Phase 2 帳號系統規劃」的 Key 策略一起做
- 天氣 16 天預報限制目前直接顯示錯誤訊息，容易讓使用者以為壞掉；改成「出發前 16 天內可查詢（還有 N 天）」體感較好
- 旅伴 note 目前拿來放護照號碼，明文存在 localStorage，任何共用電腦都看得到；等帳號系統上線前，UI 上不宜鼓勵使用者填證件號碼

### 可以考慮凍結或砍掉的功能
- **旅伴管理**：目前只是名字/備註清單，跟訂單、分帳、分享都沒整合，是個孤島功能。建議先凍結，等 Phase 2 分享功能定案後再決定形態（旅伴＝分享對象才有意義）
- **Vant**：`@vant/nuxt` 裝了但 picker 類元件從未真正使用過，白佔 bundle size，可以移除

### Phase 2（給親友用）
- [ ] 帳號系統（Supabase Auth）
- [ ] 行程分享給同行者
- [ ] 行事曆同步（Google Calendar）
- [ ] 出發提醒通知

#### Phase 2 帳號系統規劃（2026-07-13 訂）

**資料層：Trip 整包存 JSONB，不拆關聯表**
- 現有巢狀結構（`itinerary`/`standby`/`bookings`/`packingList`/`companions`）拆成關聯表要動全部 store actions + 重新設計 RLS，成本太高
- 做法：`trips` table 只把 `destination`/`startDate`/`endDate`/`days`/`budget`/`currency` 打平成欄位，其餘巢狀陣列整包塞進一個 `data JSONB` 欄位，結構直接沿用目前 localStorage 的 `Trip` interface，搬家幾乎零改動
- `user_id uuid references auth.users` + RLS `user_id = auth.uid()`，多租戶隔離就靠這一條

**登入方式：Google OAuth 優先，Email Magic Link 備援**
- 對象是親友非工程背景，密碼是額外門檻；Google OAuth 一鍵登入摩擦最低，且申請 Gemini key 本來就需要 Google 帳號，體驗上順勢串起來
- Magic link 當備援（沒有/不想用 Google 帳號的人）
- 用 `@nuxtjs/supabase`（`nuxt.config.ts` 裡已裝但註解掉），開帳號系統時打開

**舊資料搬家（localStorage → Supabase）**
- 第一次登入時偵測 localStorage 是否有舊的 `journi_trips`，跳出「要不要把本機的行程搬到雲端？」
- 逐筆寫進 Supabase，成功後**先不要**清 localStorage，當作保險絲，等使用者確認雲端資料無誤再讓他手動清

**讀寫模式：local-first + 背景同步，不要整批改成 await API**
- 現在所有元件、store actions 都是同步操作 Pinia state、畫面立刻反應；如果每個 action 都改成等 Supabase 回應，要動的檔案面過大，而且旅遊當下常常沒網路
- 做法：Pinia state 繼續當唯一即時資料來源，`updateTrip`/`addBooking` 等 action 寫完本地 state 後，另外呼叫一個 debounce 過的背景同步函式，把整包 `trip` 物件 replace 寫回 Supabase（跟現在「整包物件覆寫」的邏輯一致，只是多寫一個目的地）
- 之後真的要做多裝置即時同步或多人協作編輯，再考慮 Supabase Realtime 訂閱

**Gemini Key：登入後預設吃 server 端 key**
- 現在 server 端已經支援「沒傳 apiKey 時 fallback 用 `config.geminiApiKey`」（`recommendations.post.js`／`packing-list.post.ts`／`weather.get.ts`／`parse-confirmation.post.ts` 都這樣寫），帳號系統上線後對登入使用者直接不要求自己申請 key，一律吃 server 端 key，這是對長輩最大的勸退門檻，順便解掉
- 保留「進階選項可填自己的 key」給想省 App 主 quota 的人，非必填，UI 上維持現有的 header key 設定入口

**分享：唯讀連結先做，帳號對帳號協作後做**
- 唯讀連結（呼應 Phase 1.5 那項）：`trips.share_token`（nullable uuid），開啟分享時產生；`/share/[token]` 走一支不需登入的 server API，用 service role key 查詢對應 trip 回傳唯讀資料，不透過前端 RLS 直接曝露
- 帳號對帳號協作編輯：等唯讀連結的使用情境驗證過再做，需要 `trip_collaborators` 表（`trip_id`, `user_id`, `role: viewer|editor`）+ 對應 RLS policy

**建議實作順序**
1. `@nuxtjs/supabase` 打開 + Google OAuth 設定 + 登入/登出 UI
2. `trips` table + RLS + 搬家 flow（含保留 localStorage 當保險）
3. Store actions 加背景同步（local-first）
4. 唯讀分享連結（`share_token` + `/share/[token]` API）
5. Gemini key 改成登入後預設吃 server key
6. 行事曆同步、出發提醒（維持排在後面）

### Phase 3（商業化）
- [ ] 真實機票 / 飯店查價 API
- [ ] 付費方案

---

## 與 travel-planner 的差異

舊專案（`travel-planner`）問題：
- Next.js + React，使用者不熟
- 表單送出就全 AI 決定，無法手動控制
- 功能單薄，只有景點推薦
- 無資料持久化（重整消失）
- 無法匯入訂票資料

新專案改善：
- Nuxt 3 + Vue 3，使用者熟悉
- AI 只是建議，使用者完全主導
- 功能完整（見上方流程）
- Supabase 持久化
- 支援匯入確認信

---

## 開發備忘

- Gemini model：`gemini-2.5-flash-lite`（免費，速度快）
- 景點批次生成：一次 20 個，前端分批顯示，減少 API 呼叫
- 確認信解析：prompt 要求嚴格 JSON 輸出，避免解析失敗
- 天氣 API：Open-Meteo（免費，不需要 key）
- 匯率 API：ExchangeRate-API 免費方案（500次/月）

---

## 程式碼結構：行程頁

`app/pages/trips/[id].vue` 只保留路由/store 取值、Tab 切換、dayList 計算、EditModal 開關，以及地圖 Tab 呼叫桌機 EntryModal／手機 inline 編輯的轉發邏輯。實際內容都在 `app/components/trip/`：

| 檔案 | 內容 |
|---|---|
| `ItineraryTab.vue` | 行程 Tab（手機 inline 編輯、桌機拖曳欄位），`defineExpose({ openInlineEdit })` 給地圖 Tab 呼叫 |
| `MapTab.vue` | 地圖 Tab，含 Leaflet 生命週期、地圖救援機制（拖曳/點地圖校正定位、復原、距離泡泡） |
| `OverviewTab.vue` | 總覽 Tab |
| `InfoTab.vue` | 旅伴／天氣／匯率／準備清單 |
| `Bookings.vue` | 訂單管理中心，InfoTab 內嵌 |
| `AiDrawer.vue` | AI 推薦抽屜 + 排入行程 dialog |
| `EditModal.vue` | 編輯旅程 modal |
| `EntryModal.vue` | 桌機新增/編輯行程 modal，行程 Tab + 地圖 Tab 共用 |
| `StandbySidebar.vue` | 備用清單桌機側欄 |
| `StandbyDrawer.vue` | 備用清單手機底部抽屜 |

共用 helper（`categoryEmoji`/`Label`/`Color`、日期格式化、`weatherEmoji`、`guessCurrency`、`sortByTimeThenOrder`）在 `app/utils/tripDisplay.ts`。

天氣／匯率的「已 fetch 過」狀態用 `useState('weather-${tripId}')` / `useState('exchange-rates')`，因為活在 Tab 組件裡、切 Tab 會重新掛載，用 `useState` 才能跨掛載保留。
