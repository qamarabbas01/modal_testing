<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  'font-size': {
    type: String,
    default: 'text-base'
  },
  'font-weight': {
    type: String,
    default: 'font-normal'
  },
  'font-color': {
    type: String,
    default: 'text-gray-700'
  }
})

const paragraphClasses = computed(() => {
  return [
    props['font-size'],
    props['font-weight'],
    props['font-color']
  ].join(' ')
})
</script>

<template>
  <p :class="paragraphClasses">
    {{ text }}
  </p>
</template>