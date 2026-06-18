<template>
  <div v-if="trip">
    <div class="mb-6">
      <div class="flex items-baseline gap-2">
        <h1 class="text-4xl font-black text-stone-900 leading-tight tracking-tight">{{ trip.destination }}</h1>
        <button
          @click="openEditModal"
          class="text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
          aria-label="編輯旅程"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
      </div>
      <div class="flex items-center gap-3 mt-2">
        <p class="text-sm text-stone-500">{{ formatDate(trip.startDate) }} – {{ formatDate(trip.endDate) }}</p>
        <span class="w-1 h-1 rounded-full bg-stone-300"></span>
        <span class="text-sm font-semibold text-amber-600">{{ trip.days }} 天</span>
        <span v-if="trip.budget" class="text-sm text-stone-400">・NT$ {{ Number(trip.budget).toLocaleString() }}</span>
      </div>
    </div>

    <!-- 編輯旅程 modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h2 class="text-lg font-bold text-slate-800">編輯旅程</h2>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">目的地</label>
          <input
            v-model="editForm.destination"
            type="text"
            class="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 transition-all"
          />
        </div>

        <DateRangePicker
          :start-date="editForm.startDate"
          :end-date="editForm.endDate"
          @update:start-date="editForm.startDate = $event"
          @update:end-date="editForm.endDate = $event"
        />

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            預算 <span class="text-slate-400 font-normal">（台幣，選填）</span>
          </label>
          <input
            v-model="editForm.budget"
            type="number"
            class="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 transition-all"
          />
        </div>

        <div v-if="editDisplacedCount > 0" class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          日期縮短後，{{ editDisplacedCount }} 個行程將退回備用清單。
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="saveEdit"
            class="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >儲存</button>
          <button
            @click="showEditModal = false"
            class="px-5 py-2.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >取消</button>
        </div>
      </div>
    </div>

    <!-- Tab (手機) -->
    <div class="flex gap-1 bg-stone-100 rounded-xl p-1 mb-5 lg:hidden">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="activeTab === tab.key
          ? 'bg-white text-slate-800 shadow-sm'
          : 'text-slate-400 hover:text-slate-600'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 桌機兩欄佈局 -->
    <div class="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:items-start">

      <!-- 左側欄（桌機） -->
      <div class="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6">
        <!-- 垂直 Tab 導覽 -->
        <div class="bg-white rounded-2xl border border-stone-200 p-2">
          <button
            v-for="tab in desktopTabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            :class="activeTab === tab.key
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-800 hover:bg-stone-50'"
          >{{ tab.label }}</button>
        </div>

        <!-- 備用清單（桌機） -->
        <div class="bg-white rounded-2xl border border-stone-200 p-3">
          <div class="flex items-center gap-2 px-2 mb-2">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">備用清單</p>
            <span
              v-if="standbyItems.length"
              class="bg-amber-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
            >{{ standbyItems.length }}</span>
          </div>
          <div v-if="standbyItems.length === 0" class="text-center py-4 text-slate-300 text-xs">空的</div>
          <VueDraggable
            v-model="standbyDragList"
            :group="{ name: 'standby', pull: 'clone', put: false }"
            :animation="150"
            :sort="false"
            item-key="id"
          >
            <div
              v-for="item in standbyDragList"
              :key="item.id"
              class="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-stone-50 group transition-colors cursor-grab active:cursor-grabbing"
            >
              <span class="text-slate-300 text-xs select-none">⠿</span>
              <span class="text-sm flex-shrink-0">{{ categoryEmoji(item.category) }}</span>
              <span class="text-xs text-slate-700 font-medium truncate flex-1">{{ item.name }}</span>
              <button
                @click.stop="tripsStore.removeFromStandby(trip!.id, item.id)"
                class="text-slate-300 hover:text-red-400 text-base leading-none opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >×</button>
            </div>
          </VueDraggable>
        </div>
      </div>

      <!-- 右側內容 -->
      <div class="min-w-0">

    <!-- 行程 Tab -->
    <div v-if="activeTab === 'itinerary'" class="pb-24 lg:pb-6">

      <!-- 手機視圖 -->
      <div class="lg:hidden">

      <!-- Day 選擇器 -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          v-for="(day, index) in dayList"
          :key="index"
          @click="activeDay = index"
          class="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border transition-all text-sm"
          :class="activeDay === index
            ? 'bg-amber-400 border-amber-400 text-stone-900 font-bold shadow-sm'
            : 'bg-white border-stone-200 text-stone-400 hover:border-amber-300 hover:text-stone-600'"
        >
          <span class="font-bold">Day {{ index + 1 }}</span>
          <span class="text-xs opacity-70">{{ day.label }}</span>
        </button>
      </div>

      <!-- Day 標頭 -->
      <div v-if="dayList[activeDay]" class="flex items-baseline gap-2 mb-3">
        <span class="text-base font-bold text-stone-900">Day {{ activeDay + 1 }}</span>
        <span class="text-sm text-stone-400">{{ dayList[activeDay]!.fullLabel }}</span>
      </div>

      <!-- 當天行程 -->
      <div class="space-y-2 mb-4">
        <div
          v-for="(entry, idx) in currentDayEntries"
          :key="entry.id"
          class="bg-white rounded-md shadow-sm overflow-hidden transition-shadow hover:shadow-md"
          :class="editingEntryId === entry.id ? 'ring-1 ring-amber-400' : ''"
        >
          <!-- 顯示列 -->
          <div class="flex">
            <!-- 左色條（按類別） -->
            <div class="w-1 flex-shrink-0" :class="categoryColor(entry.category)"></div>
            <div class="flex-1 px-3 py-3 cursor-pointer" @click="openInlineEdit(entry)">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="text-xs font-mono font-semibold text-amber-600">{{ entry.time || '--:--' }}</span>
                    <span class="text-xs text-stone-300">·</span>
                    <span class="text-xs text-stone-400">{{ categoryLabel(entry.category) }}</span>
                  </div>
                  <p class="font-bold text-stone-900 text-base leading-snug">{{ entry.name }}</p>
                  <p v-if="entry.note" class="text-sm text-stone-400 mt-0.5">{{ entry.note }}</p>
                </div>
                <button
                  @click.stop="removeEntry(entry.id)"
                  class="text-stone-200 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 mt-0.5"
                >×</button>
              </div>
            </div>
          </div>

          <!-- Inline 編輯區 -->
          <div v-if="editingEntryId === entry.id" class="border-t border-stone-100 px-3 py-3 space-y-2 bg-stone-50">
            <div class="grid grid-cols-2 gap-2">
              <TimePicker v-model="inlineEdit.time" />
              <select v-model="inlineEdit.category" class="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 w-full bg-white">
                <option value="attraction">🏛 景點</option>
                <option value="food">🍜 美食</option>
                <option value="transport">🚌 交通</option>
                <option value="hotel">🏨 住宿</option>
                <option value="ticket">🎟 票券</option>
                <option value="other">📌 其他</option>
              </select>
            </div>
            <input v-model="inlineEdit.name" placeholder="活動名稱" class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
            <input v-model="inlineEdit.note" placeholder="備註（選填）" class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
            <div class="flex items-center justify-between gap-2">
              <div class="flex gap-1.5">
                <button
                  @click="reorderEntry(entry.id, 'up')"
                  :disabled="idx === 0"
                  class="text-xs border border-stone-200 rounded px-2 py-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 bg-white"
                >↑</button>
                <button
                  @click="reorderEntry(entry.id, 'down')"
                  :disabled="idx === currentDayEntries.length - 1"
                  class="text-xs border border-stone-200 rounded px-2 py-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 bg-white"
                >↓</button>
                <select
                  class="text-xs border border-stone-200 rounded px-2 py-1 outline-none bg-white text-stone-500 focus:border-amber-400"
                  @change="(e: Event) => { const s = e.target as HTMLSelectElement; moveEntryToDay(entry.id, s.value); s.value = '' }"
                >
                  <option value="" disabled selected>移至…</option>
                  <option v-for="(day, i) in dayList" :key="i" :value="day.date" :disabled="day.date === dayList[activeDay]?.date">Day {{ i + 1 }}</option>
                </select>
              </div>
              <div class="flex gap-2">
                <button @click="editingEntryId = null" class="px-3 py-1.5 text-stone-400 text-sm transition-colors">取消</button>
                <button @click="saveInlineEdit(entry.id)" class="bg-amber-400 hover:bg-amber-500 text-stone-900 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">儲存</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentDayEntries.length === 0" class="text-center py-10 text-stone-300">
          <p class="text-3xl mb-2">✈️</p>
          <p class="text-sm">這天還沒有行程</p>
        </div>
      </div>

      <!-- 新增行程 -->
      <div v-if="showAddForm" class="bg-white rounded-xl border border-amber-200 p-4 mb-3" ref="addFormEl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <TimePicker v-model="newEntry.time" />
          <select
            v-model="newEntry.category"
            class="w-full border border-stone-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-amber-400"
          >
            <option value="attraction">🏛 景點</option>
            <option value="food">🍜 美食</option>
            <option value="transport">🚌 交通</option>
            <option value="hotel">🏨 住宿</option>
            <option value="ticket">🎟 票券</option>
            <option value="other">📌 其他</option>
          </select>
        </div>
        <input
          v-model="newEntry.name"
          placeholder="活動名稱"
          class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 mb-3"
        />
        <input
          v-model="newEntry.note"
          placeholder="備註（選填）"
          class="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 mb-3"
        />
        <div class="flex gap-2">
          <button @click="addEntry" class="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2 rounded-lg text-sm font-bold transition-colors">新增</button>
          <button @click="showAddForm = false" class="px-4 py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors">取消</button>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="openAddForm"
          class="flex-1 border-2 border-dashed border-stone-300 hover:border-amber-400 text-slate-400 hover:text-amber-500 rounded-xl py-3 text-sm font-medium transition-all"
        >
          + 自己新增
        </button>
        <button
          @click="showAiPanel = !showAiPanel"
          class="flex-1 border-2 border-dashed border-stone-300 hover:border-slate-400 text-slate-400 hover:text-slate-600 rounded-xl py-3 text-sm font-medium transition-all"
        >
          ✨ AI 推薦
        </button>
      </div>

      <!-- AI 推薦面板 -->
      <div v-if="showAiPanel" class="mt-4 bg-slate-900 rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-white text-sm font-bold">AI 景點推薦</span>
          <div class="flex gap-2">
            <button
              v-for="cat in aiCategories"
              :key="cat.key"
              @click="aiCategory = cat.key"
              class="text-xs px-2 py-1 rounded-full transition-all"
              :class="aiCategory === cat.key ? 'bg-amber-400 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'"
            >{{ cat.label }}</button>
          </div>
        </div>

        <div v-if="aiLoading" class="text-center py-6 text-slate-400 text-sm">
          正在推薦中...
        </div>
        <div v-else-if="currentBatch.length === 0" class="text-center py-4">
          <button
            @click="fetchRecommendations"
            class="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            開始推薦
          </button>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in currentBatch"
            :key="item.id"
            class="bg-slate-800 rounded-xl p-3 flex items-start justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-semibold">{{ item.name }}</p>
              <p class="text-slate-400 text-xs mt-0.5 line-clamp-2">{{ item.description }}</p>
              <p class="text-slate-500 text-xs mt-1">⏱ 約 {{ item.duration }} 小時</p>
            </div>
            <button
              @click="addFromAi(item)"
              :disabled="addedIds.includes(item.id)"
              class="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              :class="addedIds.includes(item.id)
                ? 'bg-slate-700 text-slate-400 cursor-default'
                : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
            >
              {{ addedIds.includes(item.id) ? '✓ 已加入' : '加入備用' }}
            </button>
          </div>

          <div class="flex justify-between pt-1">
            <button
              @click="nextBatch"
              class="text-slate-400 hover:text-white text-xs transition-colors"
            >
              換一批 →
            </button>
            <span class="text-slate-600 text-xs">{{ batchIndex * 5 + 1 }}–{{ Math.min((batchIndex + 1) * 5, allRecommendations.length) }} / {{ allRecommendations.length }}</span>
          </div>
        </div>
      </div>

      </div><!-- /手機視圖 -->

      <!-- 桌機橫向視圖 -->
      <div class="hidden lg:block relative">
        <div class="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        <div
          v-for="(col, colIdx) in columns"
          :key="col.date"
          class="flex-shrink-0 w-72 flex flex-col rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm"
        >
          <!-- 欄標題 -->
          <div class="px-4 pt-4 pb-3 flex-shrink-0 border-b border-stone-100">
            <p class="text-stone-800 font-bold text-sm leading-none">Day {{ getDayIndex(col.date) + 1 }}</p>
            <p class="text-stone-400 text-xs mt-1.5">{{ formatFullDate(col.date) }}</p>
          </div>
          <VueDraggable
            v-model="columns[colIdx]!.entries"
            :group="{ name: 'itinerary', pull: true, put: true }"
            :animation="150"
            handle=".drag-handle"
            @end="onDragEnd"
            @add="(e) => onColumnAdd(e, colIdx)"
            class="flex-1 p-3 space-y-2 min-h-[480px]"
          >
            <div
              v-for="entry in columns[colIdx]!.entries"
              :key="entry.id"
              class="bg-stone-50 rounded-lg overflow-hidden flex hover:bg-stone-100 transition-colors group cursor-pointer"
              @click="openDesktopEdit(entry, col.date)"
            >
              <div class="w-[3px] flex-shrink-0 self-stretch" :class="categoryColor(entry.category)"></div>
              <div class="flex-1 flex items-center gap-2 px-3 py-3 min-w-0">
                <span class="drag-handle cursor-grab active:cursor-grabbing text-stone-300 group-hover:text-stone-500 text-xs select-none transition-colors" @click.stop>⠿</span>
                <div class="flex-1 min-w-0">
                  <span v-if="entry.time" class="text-xs text-amber-500 font-mono font-semibold block leading-none mb-1">{{ entry.time }}</span>
                  <p class="text-sm text-stone-700 font-semibold truncate leading-snug">{{ entry.name }}</p>
                </div>
                <button @click.stop="removeEntry(entry.id)" class="text-stone-300 hover:text-red-400 text-base leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              </div>
            </div>
          </VueDraggable>
          <div class="px-3 pb-3 flex-shrink-0">
            <button
              @click="openAddFormForDay(col.date)"
              class="w-full text-xs text-stone-400 hover:text-amber-600 py-2 border border-dashed border-stone-200 hover:border-amber-300 rounded-lg transition-colors"
            >+ 新增</button>
          </div>
        </div>
        </div>
        <!-- 右側漸層提示 -->
        <div class="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none"></div>
      </div>

      <!-- AI 推薦觸發（桌機） -->
      <div class="hidden lg:flex items-center justify-end mt-3">
        <button
          @click="showAiPanel = !showAiPanel"
          class="text-xs border border-stone-200 hover:border-amber-400 text-stone-500 hover:text-amber-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>✨</span><span>AI 推薦</span>
        </button>
      </div>

      <!-- AI 推薦側邊抽屜 -->
      <Teleport to="body">
        <Transition name="drawer">
          <div v-if="showAiPanel" class="fixed inset-0 z-50 flex justify-end" @click.self="showAiPanel = false">
            <!-- 半透明遮罩 -->
            <div class="absolute inset-0 bg-black/20" @click="showAiPanel = false"></div>
            <!-- 抽屜本體 -->
            <div class="relative w-96 h-full bg-white shadow-2xl flex flex-col overflow-hidden">
              <!-- 抽屜 Header -->
              <div class="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <p class="font-bold text-stone-900 text-base">AI 景點推薦</p>
                  <p class="text-xs text-stone-400 mt-0.5">{{ trip?.destination }}</p>
                </div>
                <button @click="showAiPanel = false" class="text-stone-300 hover:text-stone-600 text-2xl leading-none transition-colors">×</button>
              </div>
              <!-- 類別篩選 -->
              <div class="px-5 py-3 flex gap-2 flex-shrink-0 border-b border-stone-100">
                <button
                  v-for="cat in aiCategories"
                  :key="cat.key"
                  @click="aiCategory = cat.key"
                  class="text-xs px-3 py-1.5 rounded-full border transition-all"
                  :class="aiCategory === cat.key
                    ? 'bg-stone-900 border-stone-900 text-white font-semibold'
                    : 'border-stone-200 text-stone-500 hover:border-stone-400'"
                >{{ cat.label }}</button>
              </div>
              <!-- 內容 -->
              <div class="flex-1 overflow-y-auto px-5 py-4">
                <div v-if="aiLoading" class="flex flex-col items-center justify-center h-40 gap-3">
                  <div class="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-sm text-stone-400">正在推薦中…</p>
                </div>
                <div v-else-if="currentBatch.length === 0" class="flex flex-col items-center justify-center h-40 gap-3">
                  <p class="text-stone-400 text-sm">點擊開始獲取推薦</p>
                  <button
                    @click="fetchRecommendations"
                    class="bg-amber-400 hover:bg-amber-500 text-stone-900 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                  >開始推薦</button>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="item in currentBatch"
                    :key="item.id"
                    class="border border-stone-100 rounded-xl p-4 hover:border-stone-200 hover:shadow-sm transition-all"
                  >
                    <div class="flex items-start justify-between gap-3 mb-2">
                      <p class="font-semibold text-stone-800 text-sm leading-snug">{{ item.name }}</p>
                      <button
                        @click="addFromAi(item)"
                        :disabled="addedIds.includes(item.id)"
                        class="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        :class="addedIds.includes(item.id) ? 'bg-stone-100 text-stone-400 cursor-default' : 'bg-amber-400 hover:bg-amber-500 text-stone-900'"
                      >{{ addedIds.includes(item.id) ? '✓ 已加入' : '加入備用' }}</button>
                    </div>
                    <p class="text-xs text-stone-400 leading-relaxed">{{ item.description }}</p>
                    <p class="text-xs text-stone-300 mt-2">⏱ 約 {{ item.duration }} 小時</p>
                  </div>
                  <div class="flex justify-between items-center pt-1">
                    <button @click="nextBatch" class="text-sm text-stone-400 hover:text-stone-700 transition-colors">換一批 →</button>
                    <span class="text-xs text-stone-300">{{ batchIndex * 5 + 1 }}–{{ Math.min((batchIndex + 1) * 5, allRecommendations.length) }} / {{ allRecommendations.length }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

    </div>

    <!-- 總覽 Tab -->
    <div v-else-if="activeTab === 'overview'" class="pb-24 lg:pb-6">

      <!-- 手機：縱向時間軸 -->
      <div class="space-y-6 lg:hidden">
        <div v-for="(day, index) in dayList" :key="index">
          <div class="flex items-center gap-2.5 mb-2">
            <span class="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Day {{ index + 1 }}</span>
            <span class="text-sm text-slate-500">{{ formatFullDate(day.date) }}</span>
            <span class="ml-auto text-xs text-slate-400">{{ getEntriesForDay(day.date).length > 0 ? getEntriesForDay(day.date).length + ' 個' : '空' }}</span>
          </div>
          <div class="space-y-1.5">
            <div v-if="getEntriesForDay(day.date).length === 0"
              class="text-slate-300 text-xs py-3 px-4 border border-dashed border-stone-200 rounded-xl text-center">
              還沒有行程
            </div>
            <div v-for="entry in getEntriesForDay(day.date)" :key="entry.id"
              class="flex items-center gap-3 py-2.5 px-3.5 bg-white rounded-xl border border-stone-100">
              <span class="text-base flex-shrink-0">{{ categoryEmoji(entry.category) }}</span>
              <span class="text-xs text-slate-400 font-mono w-10 flex-shrink-0">{{ entry.time || '--:--' }}</span>
              <span class="text-sm text-slate-700 font-medium truncate">{{ entry.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 桌機：橫向 Excel 風格 -->
      <div class="hidden lg:flex gap-3 overflow-x-auto pb-4">
        <div
          v-for="(day, index) in dayList"
          :key="index"
          class="flex-shrink-0 w-52 rounded-2xl border border-stone-200 overflow-hidden bg-white"
        >
          <div class="bg-slate-900 px-3 py-2.5">
            <p class="text-white text-xs font-bold">Day {{ index + 1 }}</p>
            <p class="text-slate-400 text-xs mt-0.5">{{ formatFullDate(day.date) }}</p>
          </div>
          <div class="p-2 space-y-1.5 min-h-[120px]">
            <div v-if="getEntriesForDay(day.date).length === 0"
              class="text-slate-200 text-xs text-center pt-8">空</div>
            <div v-for="entry in getEntriesForDay(day.date)" :key="entry.id"
              class="bg-stone-50 rounded-lg px-2 py-1.5">
              <div class="flex items-center gap-1 mb-0.5">
                <span class="text-xs">{{ categoryEmoji(entry.category) }}</span>
                <span class="text-xs text-slate-400 font-mono">{{ entry.time || '--:--' }}</span>
              </div>
              <p class="text-xs text-slate-700 font-medium truncate">{{ entry.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 資訊 Tab -->
    <div v-else-if="activeTab === 'info'" class="pb-24 lg:pb-6 space-y-6">

      <!-- 訂單管理中心 -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">我的訂單</p>
          <button
            @click="showAddBooking = !showAddBooking"
            class="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
            :class="showAddBooking ? 'bg-slate-100 text-slate-500' : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
          >{{ showAddBooking ? '收起' : '+ 新增' }}</button>
        </div>

        <!-- 新增訂單面板 -->
        <div v-if="showAddBooking" class="bg-white rounded-2xl border border-stone-100 p-4 space-y-3 mb-3">
          <div class="flex gap-2">
            <button
              @click="confirmMode = 'text'"
              class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              :class="confirmMode === 'text' ? 'bg-amber-400 text-slate-900' : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
            >貼上文字</button>
            <button
              @click="confirmMode = 'pdf'"
              class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              :class="confirmMode === 'pdf' ? 'bg-amber-400 text-slate-900' : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
            >上傳 PDF</button>
          </div>

          <textarea
            v-if="confirmMode === 'text'"
            v-model="confirmText"
            placeholder="把確認信的文字複製貼上來..."
            rows="5"
            class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none"
          />

          <div v-else>
            <label
              class="flex flex-col items-center gap-2 py-7 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors"
              :class="confirmFile ? 'border-emerald-300 bg-emerald-50' : ''"
            >
              <span class="text-2xl">{{ confirmFile ? '📄' : '📎' }}</span>
              <span class="text-sm text-slate-500">{{ confirmFile ? confirmFile.name : '點擊選擇 PDF 檔案' }}</span>
              <input type="file" accept=".pdf" class="hidden" @change="onFileChange" />
            </label>
          </div>

          <button
            @click="parseConfirmation"
            :disabled="confirmLoading || (confirmMode === 'text' ? !confirmText.trim() : !confirmFile)"
            class="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
            :class="confirmLoading || (confirmMode === 'text' ? !confirmText.trim() : !confirmFile)
              ? 'bg-stone-100 text-slate-400 cursor-not-allowed'
              : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
          >{{ confirmLoading ? '解析中...' : 'AI 解析' }}</button>

          <div v-if="confirmError" class="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{{ confirmError }}</div>

          <!-- 解析結果 → 確認後存入 -->
          <div v-if="parsedBookings.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">解析結果</p>
              <button @click="saveAllBookings" class="text-xs font-bold text-amber-600 hover:text-amber-700">全部儲存</button>
            </div>
            <div
              v-for="(b, i) in parsedBookings"
              :key="i"
              class="border rounded-xl p-3 space-y-1 transition-colors"
              :class="b._saved ? 'border-emerald-200 bg-emerald-50' : 'border-stone-100'"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base leading-none">{{ bookingTypeIcon(b.type) }}</span>
                  <span class="font-medium text-slate-800 text-sm">{{ b.name }}</span>
                </div>
                <span v-if="b._saved" class="text-xs text-emerald-500 font-medium">已儲存</span>
                <button
                  v-else
                  @click="saveBooking(b, i)"
                  class="text-xs bg-amber-400 hover:bg-amber-500 text-slate-900 px-3 py-1 rounded-lg font-bold transition-colors"
                >儲存</button>
              </div>
              <p v-if="b.startDate" class="text-xs text-slate-400">
                {{ b.startDate }}{{ b.startTime ? ' ' + b.startTime : '' }}
                <template v-if="b.endDate && b.endDate !== b.startDate"> → {{ b.endDate }}{{ b.endTime ? ' ' + b.endTime : '' }}</template>
              </p>
              <p v-if="b.location" class="text-xs text-slate-400 truncate">📍 {{ b.location }}</p>
              <p v-if="b.confirmationNumber" class="text-xs text-slate-300">訂單號 {{ b.confirmationNumber }}</p>
            </div>
          </div>
        </div>

        <!-- Filter Tags -->
        <div v-if="tripBookings.length > 0" class="flex gap-2 flex-wrap mb-2">
          <button
            v-for="f in bookingFilters"
            :key="f.value"
            @click="activeBookingFilter = f.value"
            class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            :class="activeBookingFilter === f.value
              ? 'bg-amber-400 text-slate-900'
              : 'bg-stone-100 text-slate-500 hover:bg-stone-200'"
          >{{ f.label }}</button>
        </div>

        <!-- 訂單列表 -->
        <div v-if="tripBookings.length === 0 && !showAddBooking" class="text-slate-300 text-sm text-center py-10 bg-white rounded-2xl border border-stone-100">
          還沒有訂單，點「+ 新增」貼上確認信
        </div>

        <div v-else-if="filteredBookings.length > 0" class="space-y-2">
          <div
            v-for="b in filteredBookings"
            :key="b.id"
            class="bg-white rounded-2xl border border-stone-100 p-4 space-y-2"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xl leading-none flex-shrink-0">{{ bookingTypeIcon(b.type) }}</span>
                <div class="min-w-0">
                  <span class="font-semibold text-slate-800 text-sm truncate block">{{ b.name }}</span>
                  <span class="text-xs text-slate-400">{{ bookingTypeLabel(b.type) }}</span>
                </div>
              </div>
              <button @click="tripsStore.removeBooking(trip!.id, b.id)" class="text-slate-200 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none">×</button>
            </div>
            <div class="space-y-1 pl-7">
              <p v-if="b.startDate" class="text-xs text-slate-500">
                {{ b.startDate }}{{ b.startTime ? ' ' + b.startTime : '' }}
                <template v-if="b.endDate && b.endDate !== b.startDate"> → {{ b.endDate }}{{ b.endTime ? ' ' + b.endTime : '' }}</template>
              </p>
              <p v-if="b.location" class="text-xs text-slate-400">📍 {{ b.location }}</p>
              <p v-if="b.note" class="text-xs text-slate-400">{{ b.note }}</p>
              <div class="flex items-center gap-3 pt-0.5 flex-wrap">
                <span v-if="b.confirmationNumber" class="text-xs text-slate-300">訂單號 {{ b.confirmationNumber }}</span>
                <span v-if="b.price" class="text-xs font-medium text-slate-500">{{ b.price }}</span>
                <a
                  v-if="b.location || b.name"
                  :href="mapsUrl(b)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-amber-500 hover:text-amber-600 font-medium transition-colors"
                >地圖 ↗</a>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="tripBookings.length > 0" class="text-slate-300 text-sm text-center py-8 bg-white rounded-2xl border border-stone-100">
          這個類別還沒有訂單
        </div>
      </div>

      <!-- 準備清單 -->
      <div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">準備清單</p>
        <p class="text-slate-300 text-sm text-center py-8 bg-white rounded-2xl border border-stone-100">即將實作：出發前 checklist</p>
      </div>
    </div>

      </div><!-- /右側內容 -->
    </div><!-- /桌機兩欄 grid -->

    <!-- 桌機新增 Modal -->
    <div v-if="showDesktopAddModal"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="showDesktopAddModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800">
            {{ editingDesktopEntryId ? '編輯行程' : '新增行程' }}・Day {{ getDayIndex(addFormDate) + 1 }}
          </h3>
          <button @click="showDesktopAddModal = false" class="text-slate-300 hover:text-slate-500 text-xl leading-none">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <TimePicker v-model="newEntry.time" />
          <select v-model="newEntry.category" class="border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 w-full">
            <option value="attraction">🏛 景點</option>
            <option value="food">🍜 美食</option>
            <option value="transport">🚌 交通</option>
            <option value="hotel">🏨 住宿</option>
            <option value="ticket">🎟 票券</option>
            <option value="other">📌 其他</option>
          </select>
        </div>
        <input v-model="newEntry.name" placeholder="活動名稱" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        <input v-model="newEntry.note" placeholder="備註（選填）" class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        <div class="flex gap-2 pt-1">
          <button
            @click="editingDesktopEntryId ? saveDesktopEdit() : addEntryFromModal()"
            class="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >{{ editingDesktopEntryId ? '儲存' : '新增' }}</button>
          <button @click="showDesktopAddModal = false" class="px-5 py-2.5 text-slate-400 hover:text-slate-600 text-sm transition-colors">取消</button>
        </div>
      </div>
    </div>

    <!-- 備用清單底部抽屜 -->
    <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showStandbyDrawer"
        class="fixed inset-0 bg-black/40 z-40"
        @click="showStandbyDrawer = false"
      />
    </Transition>

    <div class="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto lg:hidden">
      <Transition name="slide-up">
        <div v-if="showStandbyDrawer" class="bg-white rounded-t-2xl shadow-2xl max-h-[65vh] flex flex-col">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
            <span class="font-bold text-slate-800 text-sm">備用清單</span>
            <button @click="showStandbyDrawer = false" class="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
          <div class="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            <div v-if="standbyItems.length === 0" class="text-center py-10 text-slate-300">
              <p class="text-3xl mb-2">📋</p>
              <p class="text-sm">備用清單是空的</p>
              <p class="text-xs mt-1">從 AI 推薦加入景點</p>
            </div>
            <div
              v-for="item in standbyItems"
              :key="item.id"
              class="bg-stone-50 rounded-xl overflow-hidden"
            >
              <div class="flex items-start gap-3 py-3 px-3.5">
                <span class="text-lg mt-0.5 flex-shrink-0">{{ categoryEmoji(item.category) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-800 text-sm">{{ item.name }}</p>
                  <p v-if="item.duration" class="text-xs text-slate-400 mt-0.5">⏱ 約 {{ item.duration }} 小時</p>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    @click="expandingStandbyId = expandingStandbyId === item.id ? null : item.id"
                    class="text-xs bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >排入</button>
                  <button
                    @click="tripsStore.removeFromStandby(trip!.id, item.id)"
                    class="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                  >×</button>
                </div>
              </div>
              <!-- Day 選擇器 -->
              <div v-if="expandingStandbyId === item.id" class="px-3.5 pb-3 flex flex-wrap gap-2">
                <button
                  v-for="(day, i) in dayList"
                  :key="day.date"
                  @click="moveToDay(item.id, day.date)"
                  class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-white border border-stone-200 hover:border-amber-400 hover:text-amber-600 text-slate-600"
                >Day {{ i + 1 }} {{ day.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 固定觸發欄 -->
      <button
        @click="showStandbyDrawer = !showStandbyDrawer"
        class="w-full bg-slate-900 hover:bg-slate-800 transition-colors text-white py-3.5 flex items-center justify-center gap-2"
      >
        <span class="text-sm font-semibold">備用清單</span>
        <span
          v-if="standbyItems.length"
          class="bg-amber-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
        >{{ standbyItems.length }}</span>
        <span class="text-slate-500 text-xs ml-1">{{ showStandbyDrawer ? '▼' : '▲' }}</span>
      </button>
    </div>
    </Teleport>
  </div>

  <div v-else class="text-center py-24 text-slate-400">找不到這趟旅程</div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { TripEntry } from '~/stores/useTripsStore'

interface Column { date: string; entries: TripEntry[] }

interface AiRecommendation {
  id: string
  name: string
  description: string
  duration: number | string
  category: string
}

const route = useRoute()
const tripsStore = useTripsStore()
const { geminiKey, loadKey } = useGeminiKey()

onMounted(() => {
  tripsStore.load()
  loadKey()
})
const trip = computed(() => tripsStore.getTrip(route.params.id as string))

const tabs = [
  { key: 'itinerary', label: '行程' },
  { key: 'overview', label: '總覽' },
  { key: 'info', label: '資訊' }
]
const desktopTabs = tabs.filter(t => t.key !== 'overview')
const activeTab = ref('itinerary')
const activeDay = ref(0)
const showAddForm = ref(false)
const showAiPanel = ref(false)
const addedIds = ref<string[]>([])
const showStandbyDrawer = ref(false)
const addFormEl = ref<HTMLElement | null>(null)

const openAddForm = () => {
  showAddForm.value = true
  nextTick(() => addFormEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

// 編輯旅程 modal
const showEditModal = ref(false)
const editForm = reactive({ destination: '', startDate: '', endDate: '', budget: '' })

const openEditModal = () => {
  if (!trip.value) return
  editForm.destination = trip.value.destination
  editForm.startDate = trip.value.startDate
  editForm.endDate = trip.value.endDate
  editForm.budget = String(trip.value.budget || '')
  showEditModal.value = true
}

const editDisplacedCount = computed(() => {
  if (!trip.value?.itinerary || !editForm.startDate || !editForm.endDate) return 0
  const start = new Date(editForm.startDate)
  const end = new Date(editForm.endDate)
  if (end < start) return 0
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const validDates = new Set<string>()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    validDates.add(d.toISOString().substring(0, 10))
  }
  return (trip.value.itinerary || []).filter(e => !validDates.has(e.date)).length
})

const saveEdit = () => {
  if (!trip.value || !editForm.destination || !editForm.startDate || !editForm.endDate) return
  tripsStore.updateTripDates(trip.value.id, { ...editForm, budget: editForm.budget || null })
  activeDay.value = 0
  showEditModal.value = false
}

const dayList = computed(() => {
  if (!trip.value) return []
  const start = new Date(trip.value.startDate)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return Array.from({ length: trip.value.days }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const wd = weekdays[d.getDay()]
    return {
      date: d.toISOString().substring(0, 10),
      label: `${m}/${day}`,
      fullLabel: `${m}月${day}日 · 週${wd}`
    }
  })
})

const currentDayEntries = computed(() => {
  if (!trip.value?.itinerary) return []
  const day = dayList.value[activeDay.value]
  return trip.value.itinerary
    .filter(e => e.date === day?.date)
    .sort((a, b) => {
      const t = (a.time || '').localeCompare(b.time || '')
      return t !== 0 ? t : (a.order ?? 0) - (b.order ?? 0)
    })
})

const newEntry = reactive<{ time: string; category: TripEntry['category']; name: string; note: string }>({
  time: '', category: 'attraction', name: '', note: ''
})

const addEntry = () => {
  if (!newEntry.name.trim() || !trip.value) return
  const day = dayList.value[activeDay.value]
  if (!day) return
  const dayEntries = (trip.value.itinerary || []).filter(e => e.date === day.date)
  const maxOrder = dayEntries.reduce((m, e) => Math.max(m, e.order ?? 0), -1)
  const itinerary: TripEntry[] = [...(trip.value.itinerary || []), {
    ...newEntry, date: day.date, id: Date.now().toString(), order: maxOrder + 10
  }]
  tripsStore.updateTrip(trip.value.id, { itinerary })
  Object.assign(newEntry, { time: '', category: 'attraction', name: '', note: '' })
  showAddForm.value = false
}

const removeEntry = (entryId: string) => {
  if (!trip.value) return
  const itinerary = trip.value.itinerary.filter(e => e.id !== entryId)
  tripsStore.updateTrip(trip.value.id, { itinerary })
}

const editingEntryId = ref<string | null>(null)
const inlineEdit = reactive({ time: '', category: 'attraction' as TripEntry['category'], name: '', note: '' })

const openInlineEdit = (entry: TripEntry) => {
  if (editingEntryId.value === entry.id) {
    editingEntryId.value = null
    return
  }
  Object.assign(inlineEdit, { time: entry.time, category: entry.category, name: entry.name, note: entry.note || '' })
  editingEntryId.value = entry.id
}

const saveInlineEdit = (entryId: string) => {
  if (!trip.value || !inlineEdit.name.trim()) return
  const itinerary = trip.value.itinerary.map(e =>
    e.id === entryId ? { ...e, ...inlineEdit } : e
  )
  tripsStore.updateTrip(trip.value.id, { itinerary })
  editingEntryId.value = null
}

const reorderEntry = (entryId: string, direction: 'up' | 'down') => {
  const day = dayList.value[activeDay.value]
  if (!day || !trip.value) return
  tripsStore.reorderEntry(trip.value.id, day.date, entryId, direction)
}

const moveEntryToDay = (entryId: string, newDate: string) => {
  if (!trip.value) return
  tripsStore.moveEntryToDay(trip.value.id, entryId, newDate)
}

const categoryEmoji = (cat: string) => ({
  attraction: '🏛', food: '🍜', transport: '🚌', hotel: '🏨', ticket: '🎟', other: '📌'
}[cat] || '📌')

const categoryLabel = (cat: string) => ({
  attraction: '景點', food: '美食', transport: '交通', hotel: '住宿', ticket: '票券', other: '其他'
}[cat] || '其他')

const categoryColor = (cat: string) => ({
  attraction: 'bg-amber-400',
  food: 'bg-orange-400',
  transport: 'bg-sky-400',
  hotel: 'bg-emerald-400',
  ticket: 'bg-violet-400',
  other: 'bg-stone-300'
}[cat] || 'bg-stone-300')

// AI 推薦
const aiCategories = [
  { key: 'all', label: '全部' },
  { key: 'food', label: '美食' },
  { key: 'culture', label: '文化' },
  { key: 'nature', label: '自然' },
  { key: 'shopping', label: '購物' }
]
const aiCategory = ref('all')
const aiLoading = ref(false)
const allRecommendations = ref<AiRecommendation[]>([])
const batchIndex = ref(0)

const currentBatch = computed(() => {
  const filtered = aiCategory.value === 'all'
    ? allRecommendations.value
    : allRecommendations.value.filter(r => r.category === aiCategory.value)
  return filtered.slice(batchIndex.value * 5, (batchIndex.value + 1) * 5)
})

const fetchRecommendations = async () => {
  if (!trip.value) return
  aiLoading.value = true
  batchIndex.value = 0
  addedIds.value = []
  try {
    const res = await $fetch('/api/recommendations', {
      method: 'POST',
      body: { destination: trip.value.destination, category: aiCategory.value, apiKey: geminiKey.value }
    })
    allRecommendations.value = res.attractions
  } catch (e) {
    console.error(e)
  } finally {
    aiLoading.value = false
  }
}

const nextBatch = () => {
  const filtered = aiCategory.value === 'all'
    ? allRecommendations.value
    : allRecommendations.value.filter(r => r.category === aiCategory.value)
  const maxBatch = Math.ceil(filtered.length / 5) - 1
  batchIndex.value = batchIndex.value >= maxBatch ? 0 : batchIndex.value + 1
}

const standbyItems = computed(() => trip.value?.standby || [])

// 桌機拖曳用（clone 模式，原清單不變）
const standbyDragList = computed({
  get: () => standbyItems.value,
  set: () => {}
})

// 手機 Day 選擇展開
const expandingStandbyId = ref<string | null>(null)

const moveToDay = (itemId: string, date: string) => {
  if (!trip.value) return
  tripsStore.moveToDay(trip.value.id, itemId, date)
  expandingStandbyId.value = null
  if (standbyItems.value.length <= 1) showStandbyDrawer.value = false
}

// 訂單管理中心
import type { Booking } from '~/stores/useTripsStore'

interface ParsedBooking {
  type: string
  name: string
  confirmationNumber: string | null
  startDate: string | null
  startTime: string | null
  endDate: string | null
  endTime: string | null
  location: string | null
  note: string | null
  price: string | null
  _saved?: boolean
}

const tripBookings = computed(() => trip.value?.bookings || [])

const bookingFilters = [
  { value: 'all', label: '全部' },
  { value: 'hotel', label: '🏨 住宿' },
  { value: 'flight', label: '✈️ 機票' },
  { value: 'train', label: '🚄 火車' },
  { value: 'car_rental', label: '🚗 租車' },
  { value: 'ticket', label: '🎟 票券' },
]
const activeBookingFilter = ref('all')
const filteredBookings = computed(() =>
  activeBookingFilter.value === 'all'
    ? tripBookings.value
    : tripBookings.value.filter(b => b.type === activeBookingFilter.value)
)

const bookingTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    hotel: '住宿', flight: '機票', ticket: '票券', car_rental: '租車', train: '火車', other: '其他'
  }
  return labels[type] ?? '其他'
}
const showAddBooking = ref(false)
const confirmMode = ref<'text' | 'pdf'>('text')
const confirmText = ref('')
const confirmFile = ref<File | null>(null)
const confirmLoading = ref(false)
const confirmError = ref('')
const parsedBookings = ref<ParsedBooking[]>([])

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  confirmFile.value = input.files?.[0] ?? null
}

const bookingTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    hotel: '🏨', flight: '✈️', ticket: '🎟', car_rental: '🚗', train: '🚄'
  }
  return icons[type] ?? '📋'
}

const parseConfirmation = async () => {
  if (!trip.value) return
  confirmLoading.value = true
  confirmError.value = ''
  parsedBookings.value = []

  try {
    let res: { bookings: ParsedBooking[] }
    if (confirmMode.value === 'pdf' && confirmFile.value) {
      const form = new FormData()
      form.append('file', confirmFile.value)
      form.append('apiKey', geminiKey.value)
      res = await $fetch('/api/parse-confirmation', { method: 'POST', body: form })
    } else {
      res = await $fetch('/api/parse-confirmation', {
        method: 'POST',
        body: { text: confirmText.value, apiKey: geminiKey.value }
      })
    }
    parsedBookings.value = res.bookings
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    confirmError.value = err.data?.statusMessage || err.message || '解析失敗，請再試一次'
  } finally {
    confirmLoading.value = false
  }
}

const saveBooking = (booking: ParsedBooking, index: number) => {
  if (!trip.value) return
  tripsStore.addBooking(trip.value.id, {
    type: booking.type as Booking['type'],
    name: booking.name,
    confirmationNumber: booking.confirmationNumber,
    startDate: booking.startDate,
    startTime: booking.startTime,
    endDate: booking.endDate,
    endTime: booking.endTime,
    location: booking.location,
    note: booking.note,
    price: booking.price
  })
  parsedBookings.value[index]!._saved = true
}

const saveAllBookings = () => {
  parsedBookings.value.forEach((b, i) => {
    if (!b._saved) saveBooking(b, i)
  })
}

const mapsUrl = (b: { name: string; location: string | null }) => {
  const q = [b.location, b.name].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

const addFromAi = (item: AiRecommendation) => {
  if (!trip.value) return
  tripsStore.addToStandby(trip.value.id, {
    category: item.category === 'food' ? 'food' : 'attraction',
    name: item.name,
    note: item.description,
    duration: item.duration,
    time: ''
  })
  addedIds.value = [...addedIds.value, item.id]
}


watch(aiCategory, () => {
  batchIndex.value = 0
  if (allRecommendations.value.length === 0) return
})

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatFullDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}/${d.getDate()}（${weekDays[d.getDay()]}）`
}

const getEntriesForDay = (date: string) => {
  return (trip.value?.itinerary || [])
    .filter(e => e.date === date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}

const moveToTodayFromDrawer = (itemId: string) => {
  const day = dayList.value[activeDay.value]
  if (!day || !trip.value) return
  tripsStore.moveToDay(trip.value.id, itemId, day.date)
  if (standbyItems.value.length <= 1) showStandbyDrawer.value = false
}

// 桌機欄位（拖曳用）
const columns = ref<Column[]>([])
let isSyncingFromDrag = false

const rebuildColumns = () => {
  if (isSyncingFromDrag) return
  columns.value = dayList.value.map(day => ({
    date: day.date,
    entries: (trip.value?.itinerary || [])
      .filter(e => e.date === day.date)
      .sort((a, b) => {
        const t = (a.time || '').localeCompare(b.time || '')
        return t !== 0 ? t : (a.order ?? 0) - (b.order ?? 0)
      })
  }))
}

watch([() => trip.value?.itinerary, dayList], rebuildColumns, { deep: true, immediate: true })

const onDragEnd = () => {
  isSyncingFromDrag = true
  const newItinerary = columns.value.flatMap((col) =>
    col.entries.map((entry, i) => ({ ...entry, date: col.date, order: i * 10 }))
  )
  tripsStore.updateTrip(trip.value!.id, { itinerary: newItinerary })
  nextTick(() => { isSyncingFromDrag = false })
}

const onColumnAdd = (event: { newIndex?: number }, colIdx: number) => {
  const col = columns.value[colIdx]
  if (!col || !trip.value) return
  const idx = event.newIndex ?? col.entries.length - 1
  const item = col.entries[idx] as TripEntry & { duration?: string | number }
  if (!item || 'date' in item) return  // 已是 TripEntry，跳過

  // 來自備用清單，轉換為 TripEntry
  const standbyItem = item as unknown as StandbyItem
  const tripEntry: TripEntry = {
    id: Date.now().toString(),
    date: col.date,
    time: standbyItem.time || '',
    category: (['attraction','food','transport','hotel','ticket','other'].includes(standbyItem.category)
      ? standbyItem.category : 'other') as TripEntry['category'],
    name: standbyItem.name,
    note: standbyItem.note,
    order: idx * 10
  }
  col.entries.splice(idx, 1, tripEntry)
  tripsStore.removeFromStandby(trip.value.id, standbyItem.id)
  onDragEnd()
}

const getDayIndex = (date: string) => dayList.value.findIndex(d => d.date === date)

// 桌機新增 Modal
const showDesktopAddModal = ref(false)
const addFormDate = ref('')
const editingDesktopEntryId = ref<string | null>(null)

const openAddFormForDay = (date: string) => {
  addFormDate.value = date
  editingDesktopEntryId.value = null
  Object.assign(newEntry, { time: '', category: 'attraction', name: '', note: '' })
  showDesktopAddModal.value = true
}

const openDesktopEdit = (entry: TripEntry, date: string) => {
  addFormDate.value = date
  editingDesktopEntryId.value = entry.id
  Object.assign(newEntry, { time: entry.time, category: entry.category, name: entry.name, note: entry.note || '' })
  showDesktopAddModal.value = true
}

const addEntryFromModal = () => {
  if (!newEntry.name.trim()) return
  const dayEntries = (trip.value!.itinerary || []).filter(e => e.date === addFormDate.value)
  const maxOrder = dayEntries.reduce((m, e) => Math.max(m, e.order ?? 0), -1)
  const itinerary = [...(trip.value!.itinerary || []), {
    ...newEntry,
    date: addFormDate.value,
    id: Date.now().toString(),
    order: maxOrder + 10
  }]
  tripsStore.updateTrip(trip.value!.id, { itinerary })
  showDesktopAddModal.value = false
}

const saveDesktopEdit = () => {
  if (!newEntry.name.trim() || !editingDesktopEntryId.value || !trip.value) return
  const itinerary = trip.value.itinerary.map(e =>
    e.id === editingDesktopEntryId.value ? { ...e, ...newEntry } : e
  )
  tripsStore.updateTrip(trip.value.id, { itinerary })
  showDesktopAddModal.value = false
  editingDesktopEntryId.value = null
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.25s ease; }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to { opacity: 0; }
.drawer-enter-from .relative { transform: translateX(100%); }
.drawer-leave-to .relative { transform: translateX(100%); }

.scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
