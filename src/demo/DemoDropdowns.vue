<!-- src/demo/DemoDropdowns.vue
30 usage tests (minimal markup, Tailwind utilities only). 
Each case shows a trigger + dropdown content. 
Assumes Tailwind with optional scrollbar-none utility and custom animations:
- animate-fade-in, animate-scale-in, animate-slide-up-in, animate-slide-down-in, animate-slide-in-bottom-mobile
-->
<template>
  <div class="p-6 space-y-10">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">DropdownHandler — 30 Usage Tests</h1>
      <RouterLink to="/"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
        ← Back to Home
      </RouterLink>
    </div>

    <!-- 1: Hover, center align, inherit width -->
    <section>
      <button ref="a1" class="px-3 py-2 border rounded">1) Hover center inherit</button>
      <DropdownHandler :anchor="a1" :config="cfg({
        trigger: 'hover', hoverIntentMs: 50, align: 'center', width: 'inherit',
        animation: 'fade', animationDurationMs: 120,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl p-0' }
      })">
        <div class="p-4 text-sm">Cart preview… <button class="ml-2 underline" data-dropdown-close>Close</button></div>
      </DropdownHandler>
    </section>

    <!-- 2: Click, right align, fixed width -->
    <section>
      <button ref="a2" class="px-3 py-2 border rounded">2) Click right 360px</button>
      <DropdownHandler :anchor="a2" :config="cfg({
        trigger: 'click', align: 'right', width: 360, animation: 'slide-down', animationDurationMs: 140,
        style: { class: 'bg-white border border-gray-200 rounded-lg shadow-xl' }
      })">
        <div class="p-4 text-sm">
          Notifications<br>• New follower<br>• Comment
          <button class="ml-2 underline" data-dropdown-close>Close</button>
        </div>
      </DropdownHandler>
    </section>

    <!-- 3: Force keep open (must close via JS) -->
    <section>
      <button ref="a3" class="px-3 py-2 border rounded" @click="ref3?.open()">3) Force keep open</button>
      <DropdownHandler ref="ref3" :anchor="a3" :config="cfg({
        trigger: 'click', align: 'center', width: 420, height: '50vh',
        forceKeepOpen: true, toggleOnTriggerClick: false,
        closeOnOutsideClick: false, closeOnScroll: false,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' },
        animation: 'scale', animationDurationMs: 120
      })">
        <div class="p-4 text-sm space-x-2">
          <button class="px-2 py-1 border rounded" @click="ref3?.close('js')">Close via JS</button>
          <button class="px-2 py-1 border rounded">Option A</button>
          <button class="px-2 py-1 border rounded">Option B</button>
        </div>
      </DropdownHandler>
    </section>

    <!-- 4: Mobile edge snap left + 100vw -->
    <section>
      <button ref="a4" class="px-3 py-2 border rounded">4) Mobile snap-left 100vw</button>
      <DropdownHandler :anchor="a4" :config="cfg({
        trigger: 'click', align: 'center', width: { '<640': '100vw', default: '480px' },
        snapEdge: 'left', animation: 'slide-in-bottom-mobile', animationDurationMs: 160,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }
      })">
        <div class="p-4 text-sm">Mobile slide-in panel</div>
      </DropdownHandler>
    </section>

    <!-- 5: Focus trigger -->
    <section>
      <button ref="a5" class="px-3 py-2 border rounded" tabindex="0">5) Focus trigger</button>
      <DropdownHandler :anchor="a5" :config="cfg({
        trigger: 'focus', align: 'center', width: 320,
        style: { class: 'bg-white border border-gray-200 rounded-lg shadow' }, animation: 'fade', animationDurationMs: 100
      })">
        <div class="p-4 text-sm">Opens on focus; closes on blur/Esc</div>
      </DropdownHandler>
    </section>

    <!-- 6: Tall content (scroll inside, hidden scrollbars) -->
    <section>
      <button ref="a6" class="px-3 py-2 border rounded">6) Tall content scroll</button>
      <DropdownHandler :anchor="a6" :config="cfg({
        trigger: 'click', align: 'center', width: 420, height: '40vh',
        scrollEnabled: true, hideScrollbars: true, closeOnScroll: false,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }
      })">
        <div class="p-4 space-y-2 text-sm">
          <div v-for="i in 30" :key="i">Row {{ i }}</div>
          <button class="underline" data-dropdown-close>Close</button>
        </div>
      </DropdownHandler>
    </section>

    <!-- 7: Left align, flip to top when no space -->
    <section>
      <button ref="a7" class="px-3 py-2 border rounded">7) Left align + flip</button>
      <DropdownHandler :anchor="a7" :config="cfg({
        trigger: 'click', align: 'left', width: 360, flipOnOverflow: true,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'slide-up', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Flips to top if needed</div>
      </DropdownHandler>
    </section>

    <!-- 8: Right align, inherit width -->
    <section>
      <button ref="a8" class="px-3 py-2 border rounded w-64">8) Right align + inherit</button>
      <DropdownHandler :anchor="a8" :config="cfg({
        trigger: 'click', align: 'right', width: 'inherit',
        style: { class: 'bg-white border border-gray-200 rounded-md shadow-lg' }, animation: 'fade', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Inherits trigger width</div>
      </DropdownHandler>
    </section>

    <!-- 9: Outside hover close (hover mode) -->
    <section>
      <button ref="a9" class="px-3 py-2 border rounded">9) Hover + outside-hover-close</button>
      <DropdownHandler :anchor="a9" :config="cfg({
        trigger: 'hover', align: 'center', width: 300, closeOnOutsideHover: true,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'fade', animationDurationMs: 100
      })">
        <div class="p-4 text-sm">Closes when leaving area (no grace)</div>
      </DropdownHandler>
    </section>

    <!-- 10: Close on scroll -->
    <section>
      <button ref="a10" class="px-3 py-2 border rounded">10) Close on scroll</button>
      <DropdownHandler :anchor="a10" :config="cfg({
        trigger: 'click', align: 'center', width: 320, closeOnScroll: true,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'fade', animationDurationMs: 100
      })">
        <div class="p-4 text-sm">Scroll page to close</div>
      </DropdownHandler>
    </section>

    <!-- 11: No close on scroll -->
    <section>
      <button ref="a11" class="px-3 py-2 border rounded">11) Keep open on scroll</button>
      <DropdownHandler :anchor="a11" :config="cfg({
        trigger: 'click', align: 'center', width: 320, closeOnScroll: false,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'fade', animationDurationMs: 100
      })">
        <div class="p-4 text-sm">Won't close on scroll</div>
      </DropdownHandler>
    </section>

    <!-- 12: Overlay on -->
    <section>
      <button ref="a12" class="px-3 py-2 border rounded">12) Overlay enabled</button>
      <DropdownHandler :anchor="a12" :config="cfg({
        trigger: 'click', align: 'center', width: 340, overlay: true,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'scale', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Click overlay to close</div>
      </DropdownHandler>
    </section>

    <!-- 13: Toggle on re-click anchor -->
    <section>
      <button ref="a13" class="px-3 py-2 border rounded">13) Toggle on anchor</button>
      <DropdownHandler :anchor="a13" :config="cfg({
        trigger: 'click', align: 'center', width: 320, toggleOnTriggerClick: true,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'fade', animationDurationMs: 100
      })">
        <div class="p-4 text-sm">Click anchor again to close</div>
      </DropdownHandler>
    </section>

    <!-- 14: Explicit 100% height (within viewport) -->
    <section>
      <button ref="a14" class="px-3 py-2 border rounded">14) Height 100%</button>
      <DropdownHandler :anchor="a14" :config="cfg({
        trigger: 'click', align: 'center', width: 420, height: '100%', scrollEnabled: true,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }
      })">
        <div class="p-4 text-sm">Fills available height</div>
      </DropdownHandler>
    </section>

    <!-- 15: Max width via Tailwind class (in style.class) -->
    <section>
      <button ref="a15" class="px-3 py-2 border rounded">15) Tailwind max-w-lg</button>
      <DropdownHandler :anchor="a15" :config="cfg({
        trigger: 'click', align: 'center', width: 'inherit',
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl max-w-lg' }
      })">
        <div class="p-4 text-sm">Max width capped by Tailwind class</div>
      </DropdownHandler>
    </section>

    <!-- 16: Big shadow theme -->
    <section>
      <button ref="a16" class="px-3 py-2 border rounded">16) Theme: big shadow</button>
      <DropdownHandler :anchor="a16" :config="cfg({
        trigger: 'click', align: 'center', width: 380,
        style: { class: 'bg-white border border-gray-200 rounded-2xl shadow-2xl' }, animation: 'scale', animationDurationMs: 140
      })">
        <div class="p-4 text-sm">Theme preset-like</div>
      </DropdownHandler>
    </section>

    <!-- 17: Minimal borderless -->
    <section>
      <button ref="a17" class="px-3 py-2 border rounded">17) Borderless</button>
      <DropdownHandler :anchor="a17" :config="cfg({
        trigger: 'click', align: 'center', width: 300,
        style: { class: 'bg-white rounded-md shadow' }, animation: 'fade', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">No border, subtle shadow</div>
      </DropdownHandler>
    </section>

    <!-- 18: Dark panel -->
    <section>
      <button ref="a18" class="px-3 py-2 border rounded">18) Dark panel</button>
      <DropdownHandler :anchor="a18" :config="cfg({
        trigger: 'click', align: 'right', width: 360,
        style: { class: 'bg-gray-900 text-gray-100 rounded-lg shadow-xl border border-gray-800' }, animation: 'fade', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Dark theme content</div>
      </DropdownHandler>
    </section>

    <!-- 19: Left edge snap on small screens only -->
    <section>
      <button ref="a19" class="px-3 py-2 border rounded">19) Snap-left mobile</button>
      <DropdownHandler :anchor="a19" :config="cfg({
        trigger: 'click', align: 'left', width: { '<640': '100vw', default: '420px' }, snapEdge: 'left',
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'slide-in-bottom-mobile', animationDurationMs: 160
      })">
        <div class="p-4 text-sm">Edge snapped on mobile</div>
      </DropdownHandler>
    </section>

    <!-- 20: Right edge snap on small screens only -->
    <section>
      <button ref="a20" class="px-3 py-2 border rounded">20) Snap-right mobile</button>
      <DropdownHandler :anchor="a20" :config="cfg({
        trigger: 'click', align: 'right', width: { '<640': '100vw', default: '420px' }, snapEdge: 'right',
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'slide-in-bottom-mobile', animationDurationMs: 160
      })">
        <div class="p-4 text-sm">Edge snapped right on mobile</div>
      </DropdownHandler>
    </section>

    <!-- 21: Immediate reopen repositions -->
    <section>
      <button ref="a21" class="px-3 py-2 border rounded" @click="openTwice(21)">21) Reposition on reopen</button>
      <DropdownHandler ref="ref21" :anchor="a21" :config="cfg({
        trigger: 'click', align: 'center', width: 360, animation: 'fade', animationDurationMs: 100,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }
      })">
        <div class="p-4 text-sm">Open → Open again triggers reposition</div>
      </DropdownHandler>
    </section>

    <!-- 22: Destroy on route-like change -->
    <section>
      <button ref="a22" class="px-3 py-2 border rounded" @click="pushHash()">22) Destroy on route/hash</button>
      <DropdownHandler :anchor="a22" :config="cfg({
        trigger: 'click', align: 'center', width: 340, destroyOnRouteChange: true,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'fade', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Change hash to close/destroy</div>
      </DropdownHandler>
    </section>

    <!-- 23: Keep on route-like change -->
    <section>
      <button ref="a23" class="px-3 py-2 border rounded" @click="pushHash()">23) Persist on route/hash</button>
      <DropdownHandler :anchor="a23" :config="cfg({
        trigger: 'click', align: 'center', width: 340, destroyOnRouteChange: false,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'fade', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Stays open across hash change</div>
      </DropdownHandler>
    </section>

    <!-- 24: Max height via Tailwind (e.g., max-h-full) -->
    <section>
      <button ref="a24" class="px-3 py-2 border rounded">24) Tailwind max-h</button>
      <DropdownHandler :anchor="a24" :config="cfg({
        trigger: 'click', align: 'center', width: 320,
        style: { class: 'bg-white border border-gray-200 rounded shadow max-h-full' }, scrollEnabled: true
      })">
        <div class="p-4 space-y-2 text-sm">
          <div v-for="i in 20" :key="i">Item {{ i }}</div>
        </div>
      </DropdownHandler>
    </section>

    <!-- 25: Overlay + hover trigger + outside hover close -->
    <section>
      <button ref="a25" class="px-3 py-2 border rounded">25) Overlay + hover</button>
      <DropdownHandler :anchor="a25" :config="cfg({
        trigger: 'hover', align: 'center', width: 300, overlay: true, closeOnOutsideHover: true,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'fade', animationDurationMs: 100
      })">
        <div class="p-4 text-sm">Hover + overlay</div>
      </DropdownHandler>
    </section>

    <!-- 26: Explicit slide-up animation -->
    <section>
      <button ref="a26" class="px-3 py-2 border rounded">26) slide-up</button>
      <DropdownHandler :anchor="a26" :config="cfg({
        trigger: 'click', align: 'center', width: 320,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'slide-up', animationDurationMs: 200
      })">
        <div class="p-4 text-sm">Slide up animation</div>
      </DropdownHandler>
    </section>

    <!-- 27: Explicit slide-down animation -->
    <section>
      <button ref="a27" class="px-3 py-2 border rounded">27) slide-down</button>
      <DropdownHandler :anchor="a27" :config="cfg({
        trigger: 'click', align: 'center', width: 320,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'slide-down', animationDurationMs: 200
      })">
        <div class="p-4 text-sm">Slide down animation</div>
      </DropdownHandler>
    </section>

    <!-- 28: Explicit scale animation -->
    <section>
      <button ref="a28" class="px-3 py-2 border rounded">28) scale</button>
      <DropdownHandler :anchor="a28" :config="cfg({
        trigger: 'click', align: 'center', width: 320,
        style: { class: 'bg-white border border-gray-200 rounded shadow' }, animation: 'scale', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Scale animation</div>
      </DropdownHandler>
    </section>

    <!-- 29: No animation -->
    <section>
      <button ref="a29" class="px-3 py-2 border rounded">29) no animation</button>
      <DropdownHandler :anchor="a29" :config="cfg({
        trigger: 'click', align: 'center', width: 320, animation: 'none',
        style: { class: 'bg-white border border-gray-200 rounded shadow' }
      })">
        <div class="p-4 text-sm">Instant open/close</div>
      </DropdownHandler>
    </section>

    <!-- 30: Programmatic control (open/close/toggle/reposition) -->
    <section>
      <div class="flex gap-2">
        <button ref="a30" class="px-3 py-2 border rounded">30) Programmatic</button>
        <button class="px-2 py-1 border rounded" @click="ref30?.open()">open()</button>
        <button class="px-2 py-1 border rounded" @click="ref30?.close()">close()</button>
        <button class="px-2 py-1 border rounded" @click="ref30?.toggle()">toggle()</button>
        <button class="px-2 py-1 border rounded" @click="ref30?.reposition()">reposition()</button>
      </div>
      <DropdownHandler ref="ref30" :anchor="a30" :config="cfg({
        trigger: 'click', align: 'center', width: 360,
        style: { class: 'bg-white border border-gray-200 rounded-xl shadow-xl' }, animation: 'fade', animationDurationMs: 120
      })">
        <div class="p-4 text-sm">Programmatic API demo</div>
      </DropdownHandler>
    </section>
  </div>




  <p class="select-none" @copy.prevent @cut.prevent @paste.prevent @contextmenu.prevent
    style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis unde dicta temporibus maxime, laboriosam facere
    consectetur quasi molestiae modi vitae amet repellendus autem excepturi explicabo aspernatur? Corrupti dolorem
    exercitationem corporis!
  </p>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import DropdownHandler from '@/components/DropdownHandler.vue'

/* anchors */
const a1 = ref(null), a2 = ref(null), a3 = ref(null), a4 = ref(null), a5 = ref(null),
  a6 = ref(null), a7 = ref(null), a8 = ref(null), a9 = ref(null), a10 = ref(null),
  a11 = ref(null), a12 = ref(null), a13 = ref(null), a14 = ref(null), a15 = ref(null),
  a16 = ref(null), a17 = ref(null), a18 = ref(null), a19 = ref(null), a20 = ref(null),
  a21 = ref(null), a22 = ref(null), a23 = ref(null), a24 = ref(null), a25 = ref(null),
  a26 = ref(null), a27 = ref(null), a28 = ref(null), a29 = ref(null), a30 = ref(null)

/* refs for programmatic examples */
const ref3 = ref(null)
const ref21 = ref(null)
const ref30 = ref(null)

/* tiny helpers */
const cfg = (o) => o
function openTwice(n) {
  if (n === 21) {
    ref21.value?.open()
    setTimeout(() => ref21.value?.open(), 150)
  }
}
function pushHash() {
  location.hash = Math.random().toString(36).slice(2)
}
</script>