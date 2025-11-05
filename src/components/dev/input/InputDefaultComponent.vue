<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  type: { type: String, default: 'text' }
})
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>