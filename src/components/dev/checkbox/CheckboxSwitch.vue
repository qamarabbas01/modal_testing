<script setup>
defineProps({
  modelValue: Boolean,
  label: String,
  version: String,
  'wrapper-label': String
})
</script>

<template>
  <label class="flex items-center gap-2">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
      class="w-4 h-4"
    />
    <span v-if="label">{{ label }}</span>
  </label>
</template>