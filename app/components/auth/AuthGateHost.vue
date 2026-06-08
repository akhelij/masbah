<script setup lang="ts">
// Host for the global contextual auth sheet. Mount this ONCE near the app root
// (e.g. in app/layouts/default.vue, just before </div> of the shell — the
// orchestrator owns layouts). It binds <AuthSheet> to the useAuthGate state and
// resumes any deferred action once the visitor signs in.
const { state, resolvePending } = useAuthGate()
const user = useSupabaseUser()

const open = computed({
  get: () => state.value.open,
  set: (v: boolean) => {
    state.value.open = v
  },
})

// When the user authenticates while the gate is open, close it and run the
// pending callback (e.g. resume the booking they were attempting).
watch(user, (u) => {
  if (u && state.value.open) resolvePending()
})
</script>

<template>
  <AuthSheet v-model:open="open" :reason="state.reason" />
</template>
