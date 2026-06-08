<script setup lang="ts">
// Inline error banner used by the auth forms (S9 `.err-banner`).
defineProps<{
  message: string
}>()
</script>

<template>
  <div class="err-banner" role="alert">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
    <div>{{ message }}</div>
  </div>
</template>

<style scoped>
.err-banner {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  background: var(--danger-soft);
  border: 1px solid #f3c0c0;
  border-radius: var(--r-lg);
  padding: 0.75rem 0.85rem;
  color: var(--danger-deep);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.4;
}
.err-banner svg {
  width: 18px;
  height: 18px;
  flex: none;
  margin-top: 1px;
}
</style>
