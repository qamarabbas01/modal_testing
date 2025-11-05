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
    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>