<template>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-semibold text-slate-700 mb-1.5">出發日期</label>
      <input
        :value="startDate"
        @input="$emit('update:startDate', ($event.target as HTMLInputElement).value)"
        type="date"
        class="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 transition-colors text-slate-800"
      />
    </div>
    <div>
      <label class="block text-sm font-semibold text-slate-700 mb-1.5">回程日期</label>
      <input
        :value="endDate"
        @input="$emit('update:endDate', ($event.target as HTMLInputElement).value)"
        type="date"
        :min="startDate"
        class="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 transition-colors text-slate-800"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ startDate: string; endDate: string }>()
defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
}>()
</script>
