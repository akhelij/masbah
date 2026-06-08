<script setup lang="ts">
type Variant = 'auto' | 'sheet'

const props = withDefaults(
  defineProps<{
    title?: string
    variant?: Variant
    labelClose?: string
  }>(),
  {
    variant: 'auto',
  }
)

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const closeLabel = computed(() => props.labelClose ?? t('common.close'))

function close(): void {
  open.value = false
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'Tab') trapFocus(e)
}

function focusables(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
}

function trapFocus(e: KeyboardEvent): void {
  const items = focusables()
  if (items.length === 0) {
    e.preventDefault()
    panel.value?.focus()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  open,
  async (isOpen) => {
    if (import.meta.server) return
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      const items = focusables()
      ;(items[0] ?? panel.value)?.focus()
    } else {
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (!import.meta.server) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="overlay"
        :class="{ 'is-sheet': variant === 'sheet' }"
        @keydown="onKeydown"
      >
        <div class="backdrop" @click="close" />
        <div
          ref="panel"
          class="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
        >
          <header v-if="title || $slots.header" class="panel-head">
            <slot name="header">
              <h2 :id="titleId" class="t-h3 panel-title">{{ title }}</h2>
            </slot>
            <button class="icon-btn close-btn" type="button" :aria-label="closeLabel" @click="close">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="panel-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="panel-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 45, 56, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: calc(100dvh - 2rem);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-lg);
  overflow: hidden;
}
.panel:focus-visible {
  outline: none;
  box-shadow: var(--sh-lg), var(--focus);
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 1.25rem 0.75rem;
}
.panel-title {
  flex: 1;
  min-width: 0;
}
.close-btn {
  flex: none;
  width: 38px;
  height: 38px;
}
.panel-body {
  padding: 0.25rem 1.25rem 1.25rem;
  overflow-y: auto;
}
.panel-foot {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid var(--line);
}

/* Bottom-sheet presentation: forced for variant=sheet, and on mobile for auto. */
.overlay.is-sheet {
  align-items: flex-end;
  padding: 0;
}
.overlay.is-sheet .panel {
  max-width: 640px;
  border-radius: var(--r-2xl) var(--r-2xl) 0 0;
  max-height: 90dvh;
}
@media (max-width: 639px) {
  .overlay {
    align-items: flex-end;
    padding: 0;
  }
  .panel {
    max-width: none;
    border-radius: var(--r-2xl) var(--r-2xl) 0 0;
    max-height: 90dvh;
  }
}

/* transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--dur-2) var(--ease-soft);
}
.modal-enter-active .panel,
.modal-leave-active .panel {
  transition: transform var(--dur-2) var(--ease-water);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .panel,
.modal-leave-to .panel {
  transform: scale(0.96);
}
.overlay.is-sheet.modal-enter-from .panel,
.overlay.is-sheet.modal-leave-to .panel {
  transform: translateY(100%);
}
@media (max-width: 639px) {
  .modal-enter-from .panel,
  .modal-leave-to .panel {
    transform: translateY(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .panel,
  .modal-leave-active .panel {
    transition-duration: 0.01ms;
  }
  .modal-enter-from .panel,
  .modal-leave-to .panel,
  .overlay.is-sheet.modal-enter-from .panel,
  .overlay.is-sheet.modal-leave-to .panel {
    transform: none;
  }
}
</style>
