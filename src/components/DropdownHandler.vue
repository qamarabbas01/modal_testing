<!-- src/components/DropdownHandler.vue - FIXED VERSION -->
<template>
    <Teleport :to="teleportTarget">
    <div v-show="isOpenInternal" :id="dropdownId" ref="dropdownRef" :role="ariaRole"
      :aria-hidden="(!isOpenInternal).toString()" :data-dropdown-handler="dropdownId" :class="outerContainerClass"
      :style="computedContainerStyle" @mouseenter="onDropdownMouseEnter" @mouseleave="onDropdownMouseLeave" @click.stop>
      <div ref="contentScrollRef" :class="contentContainerClass" :style="contentStyle">
          <slot />
        </div>
      </div>
  
    <div v-if="isOpenInternal && config.overlay" :class="overlayClass" @click="handleOverlayClick"
      @mousemove="handleOverlayHover" />
    </Teleport>
  </template>
  
  <script setup>
  import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick, defineExpose } from 'vue'
  
  const __DROPDOWN_STACK = new Set()
  function __stackRegister(instance) {
    for (const it of __DROPDOWN_STACK) {
      if (it !== instance && typeof it.close === 'function') {
      try { it.close('stack-opened-other') } catch { }
      }
    }
    __DROPDOWN_STACK.add(instance)
  }
  function __stackUnregister(instance) {
    __DROPDOWN_STACK.delete(instance)
  }
  
  const props = defineProps({
  anchor: { type: [HTMLElement, Object], required: true },
  config: { type: Object, required: true },
  })
  const emit = defineEmits(['open', 'close', 'toggle', 'repositioned', 'collided'])
  
  const isOpenInternal = ref(false)
  const dropdownRef = ref(null)
  const contentScrollRef = ref(null)
  const isLoading = ref(false)
const openMode = ref('click')
  const hoverOpenTimer = ref(null)
  const lastPlacement = ref({ flipped: false, snappedEdge: null, align: 'center' })
  const dropdownId = `dh-${Math.random().toString(36).slice(2)}`
  const viewportWidth = () => window.innerWidth || document.documentElement.clientWidth || 1024
const shouldAnimate = ref(false)
  
  const DEFAULTS = Object.freeze({
  trigger: 'click',
  hoverIntentMs: 50,
  align: 'center',
  snapEdge: null,
  offset: 8,
  width: 400,
  height: null,
    maxWidth: null,
  scrollEnabled: true,
  hideScrollbars: true,
  flipOnOverflow: true,
  closeOnOutsideClick: true,
  closeOnOutsideHover: true,
    toggleOnTriggerClick: true,
  forceKeepOpen: false,
    destroyOnRouteChange: true,
    closeOnScroll: true,
  animation: 'none',
  animationDurationMs: 120,
    teleportTo: 'body',
    overlay: false,
    theme: 'generic',
  style: {},
  loader: null,
    ariaRole: 'menu',
  mobileBreakpoint: 640,
  })
  
  function requireEl(el, label) {
    if (!el) throw new Error(`[DropdownHandler] ${label} not found or not mounted.`)
    return el
  }
  function validateConfig(cfg) {
    const triggerOk = ['click', 'hover', 'focus'].includes(cfg.trigger)
    if (!triggerOk) throw new Error(`[DropdownHandler] Invalid trigger: ${cfg.trigger}`)
    const alignOk = ['center', 'left', 'right'].includes(cfg.align)
    if (!alignOk) throw new Error(`[DropdownHandler] Invalid align: ${cfg.align}`)
    const animOk = ['none', 'fade', 'scale', 'slide-up', 'slide-down', 'slide-in-bottom-mobile'].includes(cfg.animation)
  if (!animOk) throw new Error(`[DropdownHandler] Invalid animation: ${cfg.animation}`)
    if (cfg.snapEdge && !['left', 'right'].includes(cfg.snapEdge)) throw new Error(`[DropdownHandler] Invalid snapEdge: ${cfg.snapEdge}`)
    if (cfg.width && typeof cfg.width !== 'number' && typeof cfg.width !== 'string' && typeof cfg.width !== 'object') {
      throw new Error('[DropdownHandler] width must be number|string|responsive map object')
    }
    if (cfg.height && typeof cfg.height !== 'number' && typeof cfg.height !== 'string') {
      throw new Error('[DropdownHandler] height must be number|string')
    }
  }
  const config = computed(() => {
    const cfg = Object.assign({}, DEFAULTS, props.config || {})
    validateConfig(cfg)
    return cfg
  })
  const teleportTarget = computed(() => config.value.teleportTo || 'body')
const ariaRole = computed(() => config.value.ariaRole || 'menu')
  
  const outerContainerClass = computed(() => {
    const base = [
      'fixed', 'z-[1000]', 'flex', 'flex-col',
    ]
    
    // Add transition-based class for slide-up animation
    if (config.value.animation === 'slide-up') {
      base.push('dropdown-slide-up')
      if (shouldAnimate.value) {
        base.push('dropdown-slide-up-entered')
      } else if (isOpenInternal.value) {
        base.push('dropdown-slide-up-entering')
      }
    } else if (config.value.animation === 'slide-down') {
      base.push('dropdown-slide-down')
      if (shouldAnimate.value) {
        base.push('dropdown-slide-down-entered')
      } else if (isOpenInternal.value) {
        base.push('dropdown-slide-down-entering')
      }
    } else if (config.value.animation !== 'none' && shouldAnimate.value) {
      // For other animations, use keyframe-based classes
      base.push(animationInClass.value)
    }

    const styleClass = config.value.style?.class || ''
    const hasMaxHeight = /max-h-/.test(styleClass) || /max-height/.test(styleClass)
    
    if (config.value.scrollEnabled || hasMaxHeight) {
      base.push('overflow-hidden')
    }
    
    if (styleClass) base.push(styleClass)
    
    return base.join(' ')
  })
  
  const contentContainerClass = computed(() => {
    const arr = []
    arr.push('flex-1', 'min-h-0', 'w-full')
    
    if (config.value.scrollEnabled) {
      arr.push('overflow-auto')
    } else {
      arr.push('overflow-visible')
    }
  if (config.value.hideScrollbars) arr.push('scrollbar-none')
    return arr.join(' ')
  })
  
  const overlayClass = computed(() => [
  'fixed', 'inset-0', 'z-[999]', 'bg-transparent',
  ].join(' '))
  
  const computedContainerStyle = computed(() => {
  const ms = Number(config.value.animationDurationMs || 120)
  const style = {
    '--dh-anim-ms': `${ms}ms`
  }

  if (isOpenInternal.value && !shouldAnimate.value && config.value.animation !== 'none') {
    if (config.value.animation === 'slide-up') {
      // For transition-based slide-up, initial state is handled by CSS class
      // No inline styles needed - CSS transition will handle it
    } else if (config.value.animation === 'slide-down') {
      // For transition-based slide-down, initial state is handled by CSS class
      // No inline styles needed - CSS transition will handle it
    } else if (config.value.animation === 'fade') {
      style.opacity = '0'
    } else if (config.value.animation === 'scale') {
      style.opacity = '0'
      style.transform = 'scale(0.95)'
    } else if (config.value.animation === 'slide-in-bottom-mobile') {
      style.opacity = '0'
      style.transform = 'translateY(16px)'
    }
  }

  return style
  })
  const contentStyle = computed(() => {
    const s = {}
    s.height = '100%'
    s.width = '100%'
    return s
  })
  function styleNum(val) { return val == null || val === '' ? '' : (typeof val === 'number' ? `${val}px` : String(val)) }
  
  function parseResponsiveWidth() {
    const w = config.value.width
    if (typeof w === 'number') return `${w}px`
    if (typeof w === 'string') {
      if (w === 'inherit') return 'inherit'
      return w
    }
    if (w && typeof w === 'object') {
      const vw = viewportWidth()
      let selected = w.default || '400px'
      for (const [rule, val] of Object.entries(w)) {
        if (rule === 'default') continue
        if (rule.startsWith('<')) {
          const max = Number(rule.slice(1))
          if (vw < max) selected = val
        } else if (rule.startsWith('>')) {
          const min = Number(rule.slice(1))
          if (vw > min) selected = val
        }
      }
      return selected
    }
    return '400px'
  }
  function computeWidthPx(anchorEl) {
    const target = parseResponsiveWidth()
    if (target === 'inherit') {
      const rect = anchorEl.getBoundingClientRect()
      return rect.width
    }
    if (target.endsWith('vw')) {
    const n = Number(target.replace('vw', ''))
      return Math.max(0, (window.innerWidth * n) / 100)
    }
    if (target.endsWith('%')) {
    const n = Number(target.replace('%', ''))
      return Math.max(0, (window.innerWidth * n) / 100)
    }
  if (target.endsWith('px')) return Number(target.replace('px', ''))
    const asNum = Number(target)
    return isNaN(asNum) ? 400 : asNum
  }
  function computeLeftForAlign(align, anchorRect, ddWidth) {
  if (align === 'left') return anchorRect.left
    if (align === 'right') return anchorRect.right - ddWidth
    return anchorRect.left + (anchorRect.width / 2) - (ddWidth / 2)
  }
  
  function computeHeightPx() {
    const h = config.value.height
    if (!h) return null
    if (typeof h === 'number') return `${h}px`
    if (typeof h === 'string') {
      if (h === '100%') {
        const anchorEl = resolveAnchor()
        const anchorRect = anchorEl.getBoundingClientRect()
        const offset = Number(config.value.offset || 0)
        const spaceBelow = window.innerHeight - (anchorRect.bottom + offset)
        const spaceAbove = anchorRect.top - offset
        return `${Math.min(window.innerHeight - 20, Math.max(spaceBelow, spaceAbove))}px`
      }
      return h
    }
    return null
  }
  
  function repositionInternal(reason = 'manual') {
    if (!isOpenInternal.value) return
    const anchorEl = resolveAnchor()
    const dd = requireEl(dropdownRef.value, 'Dropdown element')
  
    const anchorRect = anchorEl.getBoundingClientRect()
    const offset = Number(config.value.offset || 0)
  
    const ddWidth = computeWidthPx(anchorEl)
    dd.style.width = `${ddWidth}px`
    
    const computedHeight = computeHeightPx()
    if (computedHeight) {
      dd.style.height = computedHeight
      dd.style.maxHeight = computedHeight
    } else {
      dd.style.minHeight = '0'
    }
  
    void dd.offsetHeight
  
    const isMobile = viewportWidth() < (config.value.mobileBreakpoint || 640)
    let snappedEdge = null
    if (isMobile && config.value.snapEdge) snappedEdge = config.value.snapEdge
  
    let left = computeLeftForAlign(config.value.align, anchorRect, ddWidth)
    if (snappedEdge === 'left') left = 0
    if (snappedEdge === 'right') left = Math.max(0, window.innerWidth - ddWidth)
  
    if (left < 0) left = 0
    if (left + ddWidth > window.innerWidth) left = Math.max(0, window.innerWidth - ddWidth)
  
    const belowTop = anchorRect.bottom + offset
    let ddHeight = dd.offsetHeight || 0
    if (ddHeight === 0 && computedHeight) {
      const heightMatch = computedHeight.match(/(\d+(?:\.\d+)?)px/)
      if (heightMatch) {
        ddHeight = parseFloat(heightMatch[1])
      } else if (computedHeight.includes('vh')) {
        const vhMatch = computedHeight.match(/(\d+(?:\.\d+)?)vh/)
        if (vhMatch) {
          ddHeight = (window.innerHeight * parseFloat(vhMatch[1])) / 100
        }
      }
    }
    if (ddHeight === 0) {
      ddHeight = Math.min(300, window.innerHeight * 0.4)
    }
    
    let top = belowTop
    let flipped = false
  
    if (config.value.flipOnOverflow) {
      const spaceBelow = window.innerHeight - belowTop
      if (spaceBelow < ddHeight && anchorRect.top - offset >= ddHeight) {
        top = anchorRect.top - offset - ddHeight
        flipped = true
        dd.dataset.placement = 'top'
      } else {
        dd.dataset.placement = 'bottom'
      }
    } else {
      dd.dataset.placement = 'bottom'
    }
    
    if (config.value.height === '100%') {
      if (flipped) {
        top = Math.max(0, anchorRect.top - offset)
        dd.style.height = `${window.innerHeight - top - 10}px`
      } else {
        top = belowTop
        dd.style.height = `${window.innerHeight - top - 10}px`
      }
    }
  
    dd.style.left = `${Math.round(left)}px`
    dd.style.top = `${Math.round(top)}px`
  
    if (dd.offsetHeight === 0 && reason === 'open') {
      requestAnimationFrame(() => {
        if (isOpenInternal.value && dropdownRef.value) { 
          repositionInternal('open-layout')
        }
      })
    }
  
    lastPlacement.value = { flipped, snappedEdge, align: config.value.align }
    emit('repositioned', { flipped, snappedEdge, align: config.value.align, reason })
    dispatchDomEvent('repositioned', { flipped, snappedEdge, align: config.value.align, reason })
  }
  
  function resolveAnchor() {
    const a = props.anchor && (props.anchor.$el || props.anchor)
    const anchorEl = a && (a instanceof HTMLElement ? a : a?.value instanceof HTMLElement ? a.value : null)
    return requireEl(anchorEl, 'Anchor element')
  }

  function open(mode = config.value.trigger) {
    if (isOpenInternal.value) {
      nextTick(() => repositionInternal('open-again'))
      return true
    }
    // Reset animation state
    shouldAnimate.value = false
    isOpenInternal.value = true
    openMode.value = mode
    __stackRegister(getExposedApi())
    addGlobalListeners()
    // Wait for DOM to update and element to be rendered
    nextTick(() => {
      repositionInternal('open')
    // Set up scroll prevention on content after it's rendered
      nextTick(() => {
        setupContentScrollPrevention()
      // Trigger animation after element is positioned and visible
      if (config.value.animation === 'slide-up') {
        // Use CSS transition-based animation
        const dd = dropdownRef.value
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (dd) {
              // Element starts with 'dropdown-slide-up-entering' class (translateY(100%))
              // Force reflow
              void dd.offsetHeight
              
              // Set shouldAnimate to true, which adds 'dropdown-slide-up-entered' class
              // This triggers the CSS transition
              shouldAnimate.value = true
              
              // Force reflow to trigger transition
              nextTick(() => {
                if (dd) {
                  void dd.offsetHeight
                }
              })
            }
            applyAnimation(true)
          })
        })
      } else if (config.value.animation === 'slide-down') {
        // Use CSS transition-based animation
        const dd = dropdownRef.value
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (dd) {
              // Element starts with 'dropdown-slide-down-entering' class (translateY(-100%))
              // Force reflow
              void dd.offsetHeight
              
              // Set shouldAnimate to true, which adds 'dropdown-slide-down-entered' class
              // This triggers the CSS transition
              shouldAnimate.value = true
              
              // Force reflow to trigger transition
              nextTick(() => {
                if (dd) {
                  void dd.offsetHeight
                }
              })
            }
            applyAnimation(true)
          })
        })
      } else if (config.value.animation !== 'none') {
        const dd = dropdownRef.value
        const animClass = animationInClass.value

        // Wait for element to be fully rendered with initial inline styles
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (dd && animClass && animClass !== 'animate-none') {
              // Element is visible with inline styles setting initial animation state
              // Add animation class first (while inline styles are still active)
              dd.classList.add(animClass)
              
              // Force reflow to ensure class is applied
              void dd.offsetHeight
              
              // Now clear inline styles - this will trigger the animation
              // because the animation class will take over from the inline styles
              dd.style.opacity = ''
              dd.style.transform = ''
              dd.style.filter = ''
              
              // Force reflow to trigger animation
              void dd.offsetHeight
            }
            applyAnimation(true)
          })
        })
      } else {
        applyAnimation(true)
      }
      })
    })
    emit('open', payload('open'))
    dispatchDomEvent('open', payload('open'))
    return true
  }
  
  let contentScrollHandler = null
  function setupContentScrollPrevention() {
    if (contentScrollHandler && contentScrollRef.value) {
      contentScrollRef.value.removeEventListener('scroll', contentScrollHandler)
    }
    
    const contentScroll = contentScrollRef.value
    if (contentScroll && config.value.scrollEnabled) {
      contentScrollHandler = (e) => {
        e.stopPropagation()
      }
      contentScroll.addEventListener('scroll', contentScrollHandler, { passive: true, capture: false })
    } else {
      contentScrollHandler = null
    }
  }
  function close(origin = 'manual', force = false) {
    if (!isOpenInternal.value) return false
    if (config.value.forceKeepOpen && !force) return false
    
    if (contentScrollHandler && contentScrollRef.value) {
      contentScrollRef.value.removeEventListener('scroll', contentScrollHandler)
      contentScrollHandler = null
    }
    
    // Apply exit animation, then hide
    if (config.value.animation === 'slide-up') {
      // For transition-based slide-up, trigger exit transition
      const dd = dropdownRef.value
      if (dd) {
        dd.classList.remove('dropdown-slide-up-entered')
        dd.classList.add('dropdown-slide-up-exiting')
      }
    } else if (config.value.animation === 'slide-down') {
      // For transition-based slide-down, trigger exit transition
      const dd = dropdownRef.value
      if (dd) {
        dd.classList.remove('dropdown-slide-down-entered')
        dd.classList.add('dropdown-slide-down-exiting')
      }
    }
    
    shouldAnimate.value = false
    applyAnimation(false, () => {
      isOpenInternal.value = false
      const dd = dropdownRef.value
      if (dd && config.value.animation === 'slide-up') {
        dd.classList.remove('dropdown-slide-up-exiting', 'dropdown-slide-up-entering', 'dropdown-slide-up-entered')
      } else if (dd && config.value.animation === 'slide-down') {
        dd.classList.remove('dropdown-slide-down-exiting', 'dropdown-slide-down-entering', 'dropdown-slide-down-entered')
      }
      removeGlobalListeners()
      __stackUnregister(getExposedApi())
      emit('close', payload('close', { origin }))
      dispatchDomEvent('close', payload('close', { origin }))
    })
    return true
  }
  function toggle() { return isOpenInternal.value ? close('toggle') : open('click') }

/* ---------------- Public API ---------------- */
function reposition() {
  if (!isOpenInternal.value) {
    console.warn('[DropdownHandler] reposition() called but dropdown is not open')
    return false
  }
  // Wait for next tick to ensure DOM is ready
  nextTick(() => {
    if (isOpenInternal.value && dropdownRef.value) {
      repositionInternal('public')
    }
  })
  return true
}
function isOpen()     { return !!isOpenInternal.value }
function publicClose(origin = 'manual') {
  return close(origin, true)
}

// Lazy initialization to avoid reference errors
let _exposedApi = null
function getExposedApi() {
  if (!_exposedApi) {
    _exposedApi = {
      open, 
      close: publicClose, 
      toggle, 
      reposition, 
      isOpen
    }
  }
  return _exposedApi
}

// Create exposedApi for defineExpose
const exposedApi = getExposedApi()
  
  function payload(type, extra = {}) {
    const anchorEl = (() => { try { return resolveAnchor() } catch { return null } })()
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : null
    return {
      type, id: dropdownId, timestamp: Date.now(),
      trigger: config.value.trigger,
      placement: lastPlacement.value,
      anchorRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
      ...extra,
    }
  }
  function dispatchDomEvent(name, detail) {
    document.dispatchEvent(new CustomEvent(`DropdownHandler:${name}`, { detail }))
  }
  

  const animationInClass = computed(() => {
    const map = {
      'none': 'animate-none',
      'fade': 'animate-fade-in',
      'scale': 'animate-scale-in',
      'slide-up': 'animate-slide-up-in',
      'slide-down': 'animate-slide-down-in',
      'slide-in-bottom-mobile': 'animate-slide-in-bottom-mobile',
    }
    return map[config.value.animation] || 'animate-none'
  })
  function applyAnimation(opening, doneCb) {
  const ms = Number(config.value.animationDurationMs || 120)
    if (config.value.animation === 'none' || ms === 0) {
      if (typeof doneCb === 'function') doneCb()
      return
    }
  setTimeout(() => {
    if (typeof doneCb === 'function') doneCb()
  }, ms)
}


function addGlobalListeners() {
  if (config.value.trigger === 'click' || config.value.trigger === 'focus') {
    document.addEventListener('click', handleDocumentClick, true)
    document.addEventListener('keydown', handleEscapeKey)
  }
  if (config.value.closeOnScroll && config.value.trigger !== 'hover') {
    window.addEventListener('scroll', handleWindowScroll, true)
  }
}
function removeGlobalListeners() {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('keydown', handleEscapeKey)
  window.removeEventListener('scroll', handleWindowScroll, true)
}

function handleDocumentClick(e) {
  if (!isOpenInternal.value) return
  if (config.value.trigger !== 'click' && config.value.trigger !== 'focus') return

  const anchorEl = resolveAnchor()
  const ddEl = dropdownRef.value

  if (anchorEl.contains(e.target)) {
    if (config.value.toggleOnTriggerClick) {
      e.preventDefault()
      toggle()
    }
    return
  }

  if (ddEl && ddEl.contains(e.target)) {
    const closeBtn = e.target.closest('[data-dropdown-close]')
    if (closeBtn) {
      close('close-button', true)
    }
    return
  }

  if (config.value.closeOnOutsideClick) {
    close('outside-click')
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape' && isOpenInternal.value && (config.value.trigger === 'click' || config.value.trigger === 'focus')) {
    close('escape-key')
  }
}

function handleWindowScroll() {
  if (config.value.closeOnScroll && isOpenInternal.value) {
    close('scroll')
  }
}

function onDropdownMouseEnter() {
  if (openMode.value === 'hover' && hoverOpenTimer.value) {
    clearTimeout(hoverOpenTimer.value)
    hoverOpenTimer.value = null
  }
}

function onDropdownMouseLeave() {
  if (openMode.value === 'hover' && config.value.closeOnOutsideHover) {
    close('hover-leave')
  }
}

function handleOverlayClick() {
  if (isOpenInternal.value) {
    close('overlay-click', true)
  }
}

function handleOverlayHover() {
  if (config.value.closeOnOutsideHover && openMode.value === 'hover') {
    close('overlay-hover')
  }
}

  let focusClickHandler = null
  let focusMouseDownHandler = null
  let focusMouseUpHandler = null

  function bindTrigger() {
    const anchorEl = resolveAnchor()
    anchorEl.removeEventListener('click', onAnchorClick)
    anchorEl.removeEventListener('focus', onAnchorFocus)
    anchorEl.removeEventListener('blur', onAnchorBlur)
    if (focusClickHandler) {
      anchorEl.removeEventListener('click', focusClickHandler)
      focusClickHandler = null
    }
    if (focusMouseDownHandler) {
      anchorEl.removeEventListener('mousedown', focusMouseDownHandler)
      focusMouseDownHandler = null
    }
    if (focusMouseUpHandler) {
      anchorEl.removeEventListener('mouseup', focusMouseUpHandler)
      document.removeEventListener('mouseup', focusMouseUpHandler)
      focusMouseUpHandler = null
    }
    cleanupHover(anchorEl)
    if (config.value.trigger === 'click') {
      anchorEl.addEventListener('click', onAnchorClick)
    } else if (config.value.trigger === 'focus') {
      anchorEl.addEventListener('focus', onAnchorFocus)
      anchorEl.addEventListener('blur', onAnchorBlur)
      focusMouseDownHandler = (e) => {
        e.stopPropagation()
        if (!isOpenInternal.value) {
          open('focus')
        }
      }
      focusMouseUpHandler = (e) => {
        const anchorEl = resolveAnchor()
        if (anchorEl && anchorEl.contains(e.target)) {
          if (isOpenInternal.value && !config.value.forceKeepOpen) {
            close('mouseup')
          }
        }
      }
      anchorEl.addEventListener('mousedown', focusMouseDownHandler)
      document.addEventListener('mouseup', focusMouseUpHandler)
    } else if (config.value.trigger === 'hover') {
      setupHover(anchorEl)
    }
  }

  function onAnchorClick(e) {
    if (config.value.trigger === 'click') {
      e.preventDefault()
      e.stopPropagation()
    }
    if (isOpenInternal.value && config.value.toggleOnTriggerClick) {
      if (config.value.forceKeepOpen) return
      close('anchor-click-toggle')
    } else if (!isOpenInternal.value) {
      open('click')
    }
  }

  function onAnchorFocus(e) { 
    if (!isOpenInternal.value) {
      open('focus')
    }
  }

  function onAnchorBlur(e) {
    if (config.value.forceKeepOpen) return
    const relatedTarget = e.relatedTarget
    const dd = dropdownRef.value
    if (relatedTarget && dd && dd.contains(relatedTarget)) {
    return
    }
    setTimeout(() => {
      const anchorEl = resolveAnchor()
      if (document.activeElement !== anchorEl && isOpenInternal.value) {
        close('focus-blur')
      }
    }, 0)
  }

function setupHover(anchorEl) {
  cleanupHover(anchorEl)
  hoverAnchorEnter = () => {
    clearTimeout(hoverOpenTimer.value)
    hoverOpenTimer.value = setTimeout(() => {
      if (!isOpenInternal.value) {
        open('hover')
      }
    }, Number(config.value.hoverIntentMs || 50))
  }
  hoverAnchorLeave = (e) => {
    clearTimeout(hoverOpenTimer.value)
    hoverOpenTimer.value = null
    if (!isOpenInternal.value) return
    const dd = dropdownRef.value
    if (!dd) {
      close('hover-leave-anchor')
      return
    }
    const related = e.relatedTarget
    if (related && (dd.contains(related) || anchorEl.contains(related))) return
    close('hover-leave-anchor')
  }
  anchorEl.addEventListener('mouseenter', hoverAnchorEnter)
  anchorEl.addEventListener('mouseleave', hoverAnchorLeave)
}

let hoverAnchorEnter = null, hoverAnchorLeave = null

function cleanupHover(anchorEl) {
  if (hoverOpenTimer.value) {
    clearTimeout(hoverOpenTimer.value)
    hoverOpenTimer.value = null
  }
  if (anchorEl && hoverAnchorEnter) {
    anchorEl.removeEventListener('mouseenter', hoverAnchorEnter)
  }
  if (anchorEl && hoverAnchorLeave) {
    anchorEl.removeEventListener('mouseleave', hoverAnchorLeave)
  }
  hoverAnchorEnter = hoverAnchorLeave = null
}

  function handleRouteLikeChange() {
    if (!config.value.destroyOnRouteChange) return
    close('route-change')
  }
  
  onMounted(() => {
    window.addEventListener('popstate', handleRouteLikeChange)
    window.addEventListener('hashchange', handleRouteLikeChange)
    bindTrigger()
  })

  onBeforeUnmount(() => {
    if (hoverOpenTimer.value) {
      clearTimeout(hoverOpenTimer.value)
      hoverOpenTimer.value = null
    }
    
    if (contentScrollHandler && contentScrollRef.value) {
      contentScrollRef.value.removeEventListener('scroll', contentScrollHandler)
      contentScrollHandler = null
    }
    
    removeGlobalListeners()
    const anchorEl = (() => { try { return resolveAnchor() } catch { return null } })()
    if (anchorEl) {
      anchorEl.removeEventListener('click', onAnchorClick)
      anchorEl.removeEventListener('focus', onAnchorFocus)
      anchorEl.removeEventListener('blur', onAnchorBlur)
      if (focusClickHandler) {
        anchorEl.removeEventListener('click', focusClickHandler)
        focusClickHandler = null
      }
      if (focusMouseDownHandler) {
        anchorEl.removeEventListener('mousedown', focusMouseDownHandler)
        focusMouseDownHandler = null
      }
      if (focusMouseUpHandler) {
        anchorEl.removeEventListener('mouseup', focusMouseUpHandler)
        document.removeEventListener('mouseup', focusMouseUpHandler)
        focusMouseUpHandler = null
      }
      cleanupHover(anchorEl)
    }
    window.removeEventListener('popstate', handleRouteLikeChange)
    window.removeEventListener('hashchange', handleRouteLikeChange)
  __stackUnregister(getExposedApi())
  })
  
  watch(() => props.config, () => {
    validateConfig(config.value)
    nextTick(() => {
      bindTrigger()
      if (isOpenInternal.value) repositionInternal('config-change')
    })
  }, { deep: true })
  
  defineExpose(exposedApi)
  </script>
  