<script setup lang="ts">
// Marketing/public shell: sticky header, full-bleed-capable slot,
// desktop footer, and the mobile bottom tab bar.
</script>

<template>
  <div class="shell">
    <PHeader />
    <main class="shell-main">
      <slot />
    </main>
    <AppFooter class="hidden md:block" />
    <PTabBar class="md:hidden fixed bottom-0 inset-x-0 z-40" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.shell-main {
  flex: 1;
}
/* Clear the fixed mobile tab bar (≈ tab height + safe area). */
@media (max-width: 767px) {
  .shell-main {
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
</style>
