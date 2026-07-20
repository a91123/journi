<template>
  <div class="flex items-center gap-1 border border-stub rounded-xl px-3 py-2.5 focus-within:border-airmail-blue transition-colors bg-paper">
    <input
      :value="hours"
      @input="onHours"
      @blur="padHours"
      type="number"
      min="0"
      max="23"
      placeholder="HH"
      class="w-8 text-center text-sm font-mono outline-none appearance-none bg-transparent text-ink placeholder:text-stub"
    />
    <span class="text-ink-faint font-mono text-sm select-none">:</span>
    <input
      :value="minutes"
      @input="onMinutes"
      @blur="padMinutes"
      type="number"
      min="0"
      max="59"
      step="5"
      placeholder="MM"
      class="w-8 text-center text-sm font-mono outline-none appearance-none bg-transparent text-ink placeholder:text-stub"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const hours = ref(props.modelValue ? props.modelValue.split(':')[0] : '')
const minutes = ref(props.modelValue ? props.modelValue.split(':')[1] : '')

watch(() => props.modelValue, (val) => {
  const parts = val ? val.split(':') : []
  hours.value = parts[0] ?? ''
  minutes.value = parts[1] ?? ''
})

const emit_ = () => {
  if (hours.value !== '' && minutes.value !== '') {
    emit('update:modelValue', `${(hours.value || '').padStart(2, '0')}:${(minutes.value || '').padStart(2, '0')}`)
  }
}

const onHours = (e: Event) => {
  let v = parseInt((e.target as HTMLInputElement).value)
  if (isNaN(v)) { hours.value = ''; return }
  if (v > 23) v = 23
  if (v < 0) v = 0
  hours.value = String(v)
  emit_()
}

const onMinutes = (e: Event) => {
  let v = parseInt((e.target as HTMLInputElement).value)
  if (isNaN(v)) { minutes.value = ''; return }
  if (v > 59) v = 59
  if (v < 0) v = 0
  minutes.value = String(v)
  emit_()
}

const padHours = () => { if (hours.value) hours.value = hours.value.padStart(2, '0') }
const padMinutes = () => { if (minutes.value) minutes.value = minutes.value.padStart(2, '0') }
</script>

<style scoped>
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
input[type=number] { -moz-appearance: textfield; }
</style>
