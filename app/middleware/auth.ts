// Route guard for authenticated-only pages. Opt in per page with
// definePageMeta({ middleware: 'auth' }). i18n-prefix aware via localePath.
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (user.value) return

  const localePath = useLocalePath()
  return navigateTo({
    path: localePath('/login'),
    query: { redirect: to.fullPath },
  })
})
