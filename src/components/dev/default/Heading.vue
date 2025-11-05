<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    default: 'h2'
  },
  theme: {
    type: String,
    default: ''
  }
})

const headingClasses = computed(() => {
  const classes = []
  if (props.theme === 'AuthHeading') {
    classes.push('text-white', 'font-bold', 'font-["Poppins"]')
  }
  return classes.join(' ')
})
</script>

<template>
  <component :is="tag" :class="headingClasses">
    {{ text }}
  </component>
</template>