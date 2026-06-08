<script setup lang="ts">
// Entry point of the publish flow: resume the owner's most recent draft if one
// exists, otherwise create a fresh draft, then redirect to the step editor.
// Renders a lightweight loading state while it decides (no flicker of the shell).
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { createDraft } = usePoolMutations()

useSeoMeta({
  title: () => `${t('publish.seoTitle')} · Masbah`,
  robots: 'noindex',
})

const errorMessage = ref<string | null>(null)

async function start(): Promise<void> {
  if (!user.value) return
  errorMessage.value = null

  // Resume the most recently updated draft, if any.
  const { data, error } = await supabase
    .from('pools')
    .select('id')
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!error && data) {
    const existing = data as unknown as { id: string }
    await navigateTo(localePath(`/publish/${existing.id}`), { replace: true })
    return
  }

  const { id, error: createErr } = await createDraft()
  if (createErr || !id) {
    errorMessage.value = t('publish.createError')
    return
  }
  await navigateTo(localePath(`/publish/${id}`), { replace: true })
}

onMounted(start)
</script>

<template>
  <div class="publish-entry">
    <template v-if="errorMessage">
      <p class="error-msg">{{ errorMessage }}</p>
      <PButton variant="primary" @click="start">{{ t('common.retry') }}</PButton>
    </template>
    <template v-else>
      <span class="spinner" aria-hidden="true" />
      <p class="muted">{{ t('publish.loading') }}</p>
    </template>
  </div>
</template>

<style scoped>
.publish-entry {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}
.spinner {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 3px solid var(--line-strong);
  border-top-color: var(--aqua-600);
  animation: spin 0.8s linear infinite;
}
.error-msg {
  color: var(--danger);
  font-weight: 600;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 1.6s;
  }
}
</style>
