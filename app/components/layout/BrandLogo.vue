<script setup lang="ts">
// Masbah wave + sun mark (S1 §09). Self-contained gradient so it renders
// anywhere without a shared <defs>. Pairs with the "masbah" wordmark.
withDefaults(
  defineProps<{
    size?: number
    withWordmark?: boolean
  }>(),
  {
    size: 30,
    withWordmark: true,
  }
)

const gradId = useId()
</script>

<template>
  <span class="brand">
    <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#22D3EE" />
          <stop offset="1" stop-color="#0E7490" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" :fill="`url(#${gradId})`" />
      <path
        d="M5 19c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2"
        stroke="#fff"
        stroke-width="2.1"
        stroke-linecap="round"
      />
      <path
        d="M5 23.5c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2"
        stroke="#fff"
        stroke-width="2.1"
        stroke-linecap="round"
        stroke-opacity=".6"
      />
      <circle cx="22.5" cy="10" r="3" fill="#FCD34D" />
    </svg>
    <strong v-if="withWordmark" class="wordmark">masbah</strong>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
}
.wordmark {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink-strong);
}
</style>
