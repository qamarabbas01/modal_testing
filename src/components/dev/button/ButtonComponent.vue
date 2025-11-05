<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'default'
  },
  size: {
    type: String,
    default: 'md'
  },
  leftIcon: {
    type: String,
    default: null
  },
  rightIcon: {
    type: String,
    default: null
  },
  leftIconClass: {
    type: String,
    default: ''
  },
  rightIconClass: {
    type: String,
    default: ''
  },
  btnBg: {
    type: String,
    default: null
  },
  btnHoverBg: {
    type: String,
    default: null
  },
  btnText: {
    type: String,
    default: null
  },
  btnHoverText: {
    type: String,
    default: null
  }
})

const buttonClasses = computed(() => {
  const classes = ['inline-flex', 'items-center', 'justify-center', 'font-medium', 'rounded-lg', 'transition-all', 'duration-200', 'group']
  
  // Size classes
  const sizeMap = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  classes.push(sizeMap[props.size] || sizeMap.md)
  
  // Variant classes
  if (props.variant === 'authPink') {
    classes.push('bg-pink-500', 'text-white', 'hover:bg-pink-600')
  } else if (props.variant === 'authTransparent') {
    classes.push('bg-transparent', 'border', 'border-white', 'text-white', 'hover:bg-white/10')
  } else if (props.variant === 'polygonLeft') {
    classes.push('bg-green-500', 'text-black', 'hover:bg-black', 'hover:text-green-500', 'clip-path-polygon')
  } else {
    classes.push('bg-gray-500', 'text-white', 'hover:bg-gray-600')
  }
  
  return classes.join(' ')
})

const buttonStyle = computed(() => {
  const style = {}
  if (props.btnBg) style.backgroundColor = props.btnBg
  if (props.btnText) style.color = props.btnText
  return style
})
</script>

<template>
  <button
    :class="buttonClasses"
    :style="buttonStyle"
    class="relative"
  >
    <img
      v-if="leftIcon"
      :src="leftIcon"
      :class="leftIconClass"
      class="mr-2"
      alt=""
    />
    <span>{{ text }}</span>
    <img
      v-if="rightIcon"
      :src="rightIcon"
      :class="rightIconClass"
      class="ml-2"
      alt=""
    />
  </button>
</template>

<style scoped>
.clip-path-polygon {
  clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
}
</style>