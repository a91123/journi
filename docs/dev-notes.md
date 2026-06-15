# Dev Notes

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

下一個要做的功能（優先順序）：

1. **確認信解析**（`CLAUDE.md` 勾項）
   - 在資訊 Tab 裡加入「貼上確認信」區塊
   - 使用者貼原文 → 打 Gemini API → 解析出航班號、時間、飯店名稱等 → 進備用 planner
   - API route：`server/api/parse-confirmation.post.js`
   - Prompt 要求嚴格 JSON 輸出

2. **準備清單自動生成**
   - 資訊 Tab 裡的「準備清單」區塊補上實作
   - 根據目的地 + 天數 + 季節 → Gemini 生成
   - 分類：證件、藥品、衣物、換匯、其他

3. **天氣查詢**
   - Open-Meteo API（免費，不需 key）
   - 顯示旅遊日期的天氣預報

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

---

## 踩坑記錄

- Nuxt 4 的 `stores/` 目錄要放在 `app/` 下才能 auto-import，根目錄的 `stores/` 不吃
- `@nuxtjs/supabase` 啟動時會驗證 URL 格式，`.env` 沒填真實值會報錯無法啟動，Phase 1 先註解掉
- `<Teleport>` 不能放在 `v-if` 和 `v-else` 中間，要放在 `v-if` 內部才不會破壞 v-if/v-else pair
- `v-else-if` 和 `<Teleport>` 的配合：Teleport 要在最後，不能插在條件渲染之間
- `split('T')[0]` 在 TypeScript strict 下回傳 `string | undefined`，改用 `substring(0, 10)`
- VueDraggable `v-model` 綁 `columns[colIdx]!.entries`，需要非空斷言因為 array indexing 在 TS strict 下回傳 `T | undefined`

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
| TypeScript strict | 提早抓 null/undefined，store interface 可跨檔案共用 |
