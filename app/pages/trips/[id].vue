<template>
  <div v-if="trip">
    <!-- 標題列 -->
    <div class="flex items-center gap-3 mb-1">
      <NuxtLink to="/" class="text-slate-400 hover:text-slate-600 text-sm">← 返回</NuxtLink>
    </div>
    <div class="flex items-start justify-between mb-5">
      <div>
        <h1 class="text-2xl font-black text-slate-800">{{ trip.destination }}</h1>
        <p class="text-sm text-slate-400 mt-1">
          {{ formatDate(trip.startDate) }} – {{ formatDate(trip.endDate) }}・{{ trip.days }} 天
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="trip.budget" class="text-xs text-slate-500 bg-stone-100 px-3 py-1.5 rounded-full">
          NT$ {{ Number(trip.budget).toLocaleString() }}
        </span>
        <button
          @click="openEditModal"
          class="text-xs text-slate-400 hover:text-slate-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors"
        >編輯</button>
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

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">出發日期</label>
            <input
              v-model="editForm.startDate"
              type="date"
              class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">回程日期</label>
            <input
              v-model="editForm.endDate"
              type="date"
              class="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition-all"
            />
          </div>
        </div>

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
            v-for="tab in tabs"
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
          <div
            v-for="item in standbyItems"
            :key="item.id"
            class="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-stone-50 group transition-colors"
          >
            <span class="text-sm flex-shrink-0">{{ categoryEmoji(item.category) }}</span>
            <span class="text-xs text-slate-700 font-medium truncate flex-1">{{ item.name }}</span>
            <button
              @click="moveToTodayFromDrawer(item.id)"
              class="text-xs text-amber-600 hover:text-amber-700 font-semibold opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 whitespace-nowrap"
            >排入</button>
            <button
              @click="tripsStore.removeFromStandby(trip.id, item.id)"
              class="text-slate-300 hover:text-red-400 text-base leading-none opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-0.5"
            >×</button>
          </div>
        </div>
      </div>

      <!-- 右側內容 -->
      <div>

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
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-stone-200 text-slate-500 hover:border-slate-400'"
        >
          <span class="font-bold">Day {{ index + 1 }}</span>
          <span class="text-xs opacity-70">{{ day.label }}</span>
        </button>
      </div>

      <!-- 當天行程 -->
      <div class="space-y-2 mb-4">
        <div
          v-for="(entry, idx) in currentDayEntries"
          :key="entry.id"
          class="bg-white rounded-xl border border-stone-200 px-3 py-3 flex items-center gap-2 group"
        >
          <!-- ↑↓ 排序 -->
          <div class="flex flex-col gap-0.5 flex-shrink-0">
            <button
              @click="reorderEntry(entry.id, 'up')"
              :disabled="idx === 0"
              class="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none px-0.5 transition-colors"
            >▲</button>
            <button
              @click="reorderEntry(entry.id, 'down')"
              :disabled="idx === currentDayEntries.length - 1"
              class="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none px-0.5 transition-colors"
            >▼</button>
          </div>
          <!-- 內容 -->
          <div class="text-base flex-shrink-0">{{ categoryEmoji(entry.category) }}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 font-mono">{{ entry.time || '--:--' }}</span>
              <span class="font-semibold text-slate-800 text-sm truncate">{{ entry.name }}</span>
            </div>
            <p v-if="entry.note" class="text-xs text-slate-400 mt-0.5 truncate">{{ entry.note }}</p>
          </div>
          <!-- 移至 + 刪除 -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <select
              class="text-xs border border-stone-200 rounded-lg px-1.5 py-1 outline-none bg-white text-slate-500 focus:border-amber-400"
              @change="(e: Event) => { const s = e.target as HTMLSelectElement; moveEntryToDay(entry.id, s.value); s.value = '' }"
            >
              <option value="" disabled selected>移至…</option>
              <option
                v-for="(day, i) in dayList"
                :key="i"
                :value="day.date"
                :disabled="day.date === dayList[activeDay]?.date"
              >Day {{ i + 1 }} {{ day.label }}</option>
            </select>
            <button
              @click="removeEntry(entry.id)"
              class="text-slate-200 hover:text-red-400 transition-colors text-lg leading-none ml-0.5"
            >×</button>
          </div>
        </div>

        <div v-if="currentDayEntries.length === 0" class="text-center py-8 text-slate-300">
          <p class="text-3xl mb-2">📋</p>
          <p class="text-sm">這天還沒有行程</p>
        </div>
      </div>

      <!-- 新增行程 -->
      <div v-if="showAddForm" class="bg-white rounded-xl border border-amber-200 p-4 mb-3" ref="addFormEl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            v-model="newEntry.time"
            type="time"
            class="w-full border border-stone-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-amber-400"
          />
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
      <div class="hidden lg:flex gap-3 overflow-x-auto pb-4">
        <div
          v-for="(col, colIdx) in columns"
          :key="col.date"
          class="flex-shrink-0 w-52 flex flex-col rounded-2xl border border-stone-200 overflow-hidden bg-white"
        >
          <div class="bg-slate-900 px-3 py-2.5 flex-shrink-0">
            <p class="text-white text-xs font-bold">Day {{ getDayIndex(col.date) + 1 }}</p>
            <p class="text-slate-400 text-xs mt-0.5">{{ formatFullDate(col.date) }}</p>
          </div>
          <VueDraggable
            v-model="columns[colIdx]!.entries"
            group="itinerary"
            :animation="150"
            handle=".drag-handle"
            @end="onDragEnd"
            class="flex-1 p-2 space-y-1.5 min-h-[80px]"
          >
            <div
              v-for="entry in columns[colIdx]!.entries"
              :key="entry.id"
              class="bg-stone-50 rounded-xl px-2.5 py-2 flex items-center gap-1.5"
            >
              <span class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 text-xs select-none">⠿</span>
              <span class="text-sm flex-shrink-0">{{ categoryEmoji(entry.category) }}</span>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-slate-400 font-mono block leading-none mb-0.5">{{ entry.time || '--:--' }}</span>
                <p class="text-xs text-slate-700 font-semibold truncate">{{ entry.name }}</p>
              </div>
              <button @click="removeEntry(entry.id)" class="text-slate-200 hover:text-red-400 text-base leading-none flex-shrink-0">×</button>
            </div>
          </VueDraggable>
          <div class="border-t border-stone-100 p-2 flex-shrink-0">
            <button
              @click="openAddFormForDay(col.date)"
              class="w-full text-xs text-slate-400 hover:text-amber-600 py-1.5 border border-dashed border-stone-200 hover:border-amber-300 rounded-xl transition-colors"
            >+ 新增</button>
          </div>
        </div>
      </div>

      <!-- AI 推薦（桌機） -->
      <div class="hidden lg:flex items-center justify-end mt-3">
        <button
          @click="showAiPanel = !showAiPanel"
          class="text-xs border border-stone-200 hover:border-slate-400 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >✨ AI 推薦</button>
      </div>
      <div v-if="showAiPanel" class="hidden lg:block mt-3 bg-slate-900 rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-white text-sm font-bold">AI 景點推薦</span>
            <button @click="showAiPanel = false" class="text-slate-500 hover:text-slate-300 text-xs">✕</button>
          </div>
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
        <div v-if="aiLoading" class="text-center py-6 text-slate-400 text-sm">正在推薦中...</div>
        <div v-else-if="currentBatch.length === 0" class="text-center py-4">
          <button
            @click="fetchRecommendations"
            class="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
          >開始推薦</button>
        </div>
        <div v-else class="grid grid-cols-2 xl:grid-cols-3 gap-2">
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
              :class="addedIds.includes(item.id) ? 'bg-slate-700 text-slate-400 cursor-default' : 'bg-amber-400 hover:bg-amber-500 text-slate-900'"
            >{{ addedIds.includes(item.id) ? '✓ 已加入' : '加入備用' }}</button>
          </div>
          <div class="col-span-full flex justify-between pt-1">
            <button @click="nextBatch" class="text-slate-400 hover:text-white text-xs transition-colors">換一批 →</button>
            <span class="text-slate-600 text-xs">{{ batchIndex * 5 + 1 }}–{{ Math.min((batchIndex + 1) * 5, allRecommendations.length) }} / {{ allRecommendations.length }}</span>
          </div>
        </div>
      </div>

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
      <div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">訂單資訊</p>
        <p class="text-slate-300 text-sm text-center py-8 bg-white rounded-2xl border border-stone-100">即將實作：機票、飯店、接送</p>
      </div>
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
          <h3 class="font-bold text-slate-800">新增行程・Day {{ getDayIndex(addFormDate) + 1 }}</h3>
          <button @click="showDesktopAddModal = false" class="text-slate-300 hover:text-slate-500 text-xl leading-none">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input v-model="newEntry.time" type="time" class="border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 w-full" />
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
          <button @click="addEntryFromModal" class="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold transition-colors">新增</button>
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
              class="flex items-start gap-3 py-3 px-3.5 bg-stone-50 rounded-xl"
            >
              <span class="text-lg mt-0.5 flex-shrink-0">{{ categoryEmoji(item.category) }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-slate-800 text-sm">{{ item.name }}</p>
                <p v-if="item.duration" class="text-xs text-slate-400 mt-0.5">⏱ 約 {{ item.duration }} 小時</p>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button
                  @click="moveToTodayFromDrawer(item.id)"
                  class="text-xs bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                >排入今日</button>
                <button
                  @click="tripsStore.removeFromStandby(trip.id, item.id)"
                  class="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                >×</button>
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

onMounted(() => tripsStore.load())
const trip = computed(() => tripsStore.getTrip(route.params.id as string))

const tabs = [
  { key: 'itinerary', label: '行程' },
  { key: 'overview', label: '總覽' },
  { key: 'info', label: '資訊' }
]
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
  return Array.from({ length: trip.value.days }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { date: d.toISOString().substring(0, 10), label: `${d.getMonth() + 1}/${d.getDate()}` }
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
      body: { destination: trip.value.destination, category: aiCategory.value }
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

const moveToDay = (itemId: string, date: string) => {
  if (!trip.value) return
  tripsStore.moveToDay(trip.value.id, itemId, date)
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

const getDayIndex = (date: string) => dayList.value.findIndex(d => d.date === date)

// 桌機新增 Modal
const showDesktopAddModal = ref(false)
const addFormDate = ref('')

const openAddFormForDay = (date: string) => {
  addFormDate.value = date
  Object.assign(newEntry, { time: '', category: 'attraction', name: '', note: '' })
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
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>
