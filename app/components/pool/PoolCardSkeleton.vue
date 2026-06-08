<script setup lang="ts">
// Loading placeholder mirroring PoolCard's layout (S1 §06 skeleton variant).
</script>

<template>
  <article class="pcard" aria-hidden="true">
    <div class="skel" style="aspect-ratio: 4 / 3; border-radius: 0" />
    <div class="body">
      <div class="skel" style="height: 16px; width: 80%" />
      <div class="skel" style="height: 12px; width: 55%; margin-top: 0.6rem" />
      <div class="skel" style="height: 12px; width: 40%; margin-top: 0.9rem" />
      <div class="skel" style="height: 20px; width: 48%; margin-top: 0.9rem; border-radius: 99px" />
    </div>
  </article>
</template>

<style scoped>
.body {
  padding: 0.95rem 1.05rem 1.15rem;
}
</style>
