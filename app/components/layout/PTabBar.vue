<script setup lang="ts">
const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Resolve the signed-in user's own id (own-row RLS on `profiles`) so the
// "Profil" tab points at their public member page; fall back to phone
// verification while unknown / logged out.
const myId = ref<string | null>(null)
async function resolveMyId(): Promise<void> {
  if (!user.value) {
    myId.value = null
    return
  }
  const { data } = await supabase.from('profiles').select('id').maybeSingle()
  myId.value = (data as unknown as { id: string } | null)?.id ?? null
}
onMounted(resolveMyId)
watch(user, resolveMyId)
const profilePath = computed(() =>
  myId.value ? localePath('/membres/' + myId.value) : localePath('/account/phone')
)

// Strip the locale prefix so /fr/bookings and /ar/bookings both match "/bookings".
const basePath = computed(() => {
  const codes = (locales.value ?? []).map((l) => (typeof l === 'string' ? l : l.code))
  let path = route.path
  for (const code of codes) {
    if (path === `/${code}`) return '/'
    if (path.startsWith(`/${code}/`)) {
      path = path.slice(code.length + 1)
      break
    }
  }
  return path === '' ? '/' : path
})

function isActive(target: string): boolean {
  if (target === '/') return basePath.value === '/'
  return basePath.value === target || basePath.value.startsWith(`${target}/`)
}

// Reference locale so it's not flagged as unused (kept for parity with i18n setup).
void locale
</script>

<template>
  <nav class="tabbar" :aria-label="t('nav.primary')">
    <NuxtLink :to="localePath('/')" class="tab" :class="{ 'is-on': isActive('/') }">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z" />
      </svg>
      {{ t('nav.explore') }}
    </NuxtLink>

    <NuxtLink :to="localePath('/bookings')" class="tab" :class="{ 'is-on': isActive('/bookings') }">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2.5" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
      {{ t('nav.bookings') }}
    </NuxtLink>

    <NuxtLink :to="localePath('/publish')" class="tab-fab" :aria-label="t('nav.publish')">
      <span class="ring">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span>{{ t('nav.publish') }}</span>
    </NuxtLink>

    <NuxtLink :to="localePath('/favoris')" class="tab" :class="{ 'is-on': isActive('/favoris') }">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
        />
      </svg>
      {{ t('nav.favorites') }}
    </NuxtLink>

    <NuxtLink
      :to="profilePath"
      class="tab"
      :class="{
        'is-on':
          isActive('/profile') ||
          isActive('/membres') ||
          isActive('/account') ||
          isActive('/compte'),
      }"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
      {{ t('nav.profile') }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tab {
  text-decoration: none;
}
.tab:focus-visible,
.tab-fab:focus-visible {
  outline: none;
  border-radius: var(--r-md);
  box-shadow: var(--focus);
}
</style>
