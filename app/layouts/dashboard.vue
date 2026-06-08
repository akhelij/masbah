<script setup lang="ts">
// Owner/renter dashboard shell: header + constrained content, no marketing
// footer. Mobile tab bar for primary navigation.
</script>

<template>
  <div class="shell">
    <PHeader />
    <main class="wrap shell-main">
      <slot />
    </main>
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
  width: 100%;
  padding-block: 1.5rem 2.5rem;
}
@media (max-width: 767px) {
  .shell-main {
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
</style>
