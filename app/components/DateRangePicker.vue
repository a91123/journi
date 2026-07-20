<template>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="flex items-center gap-1.5 text-xs font-mono font-medium text-ink-faint tracking-widest mb-1.5">
        <span class="w-1.5 h-1.5 bg-airmail-red rounded-full"></span>
        出發 · DEPART
      </label>
      <input
        :value="startDate"
        @input="$emit('update:startDate', ($event.target as HTMLInputElement).value)"
        type="date"
        class="w-full border border-stub rounded-xl px-4 py-3 text-sm outline-none focus:border-airmail-blue focus:ring-2 focus:ring-airmail-blue/10 transition-all text-ink bg-paper font-mono"
      />
    </div>
    <div>
      <label class="flex items-center gap-1.5 text-xs font-mono font-medium text-ink-faint tracking-widest mb-1.5">
        <span class="w-1.5 h-1.5 bg-airmail-blue rounded-full"></span>
        回程 · RETURN
      </label>
      <input
        :value="endDate"
        @input="$emit('update:endDate', ($event.target as HTMLInputElement).value)"
        type="date"
        :min="startDate"
        class="w-full border border-stub rounded-xl px-4 py-3 text-sm outline-none focus:border-airmail-blue focus:ring-2 focus:ring-airmail-blue/10 transition-all text-ink bg-paper font-mono"
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
