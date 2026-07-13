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
- [ ] **訂單併入行程時間軸** — `trip.bookings` 目前只活在資訊 Tab，跟 `itinerary` 是平行世界，行程時間軸看不到「10:05 航班起飛」「15:00 飯店入住」這種關鍵節點。這是跟 TripIt 最大的差距；做法：儲存訂單時問「要不要排入 Day N？」，或至少在對應天數時間軸顯示唯讀訂單節點
- [ ] **「今日」自動聚焦** — 旅程進行中那幾天，打開 App 應直接跳到當天的行程 Tab，而不是停在 Day 1／上次瀏覽的 Tab。出國當下才是最需要這功能的時刻
- [ ] **花費記錄對照預算** — `Trip.budget` 欄位存了之後只在首頁卡片露臉一次，沒有任何後續使用。要嘛做簡單記帳（花費 vs 預算進度條），要嘛乾脆拿掉這個欄位，目前狀態最尷尬
- [ ] **唯讀分享連結（Phase 2 分享的輕量前置）** — 把行程序列化成連結或匯出 PDF，不用等 Supabase 帳號系統就能「把行程給媽媽看」

### 需要 Phase 2 一併考慮的事
- Gemini API Key 目前要求使用者自己去 aistudio.google.com 申請，自己用沒問題，但「給親友用」時對長輩是勸退門檻。做帳號系統時 key 應該一起搬到 server 端（App 出 key 或跟帳號綁定）
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
