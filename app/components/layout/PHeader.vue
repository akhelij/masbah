<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { signOut } = useAuthForm()

// Resolve the signed-in user's own id (own-row RLS on `profiles`; the user
// ref's id is unreliable) so the "Profil" links point at their public member
// page. Falls back to phone verification while unknown.
const myId = ref<string | null>(null)
async function resolveMyId(): Promise<void> {
  if (!user.value) {
    myId.value = null
    return
  }
  const { data } = await supabase.from('profiles').select('id').maybeSingle()
  myId.value = (data as unknown as { id: string } | null)?.id ?? null
}
const profilePath = computed(() =>
  myId.value ? localePath('/membres/' + myId.value) : localePath('/account/phone')
)

const city = ref('')

// Live unread notification count for the bell badge (signed-in only). subscribe()
// opens the realtime channel so the badge updates without a refresh.
const { unreadCount, subscribe, unsubscribe } = useNotifications()
onMounted(() => {
  if (user.value) {
    subscribe()
    void resolveMyId()
  }
})
// Open the channel as soon as the user signs in (and close it on sign-out).
watch(user, (u) => {
  if (u) {
    subscribe()
    void resolveMyId()
  } else {
    unsubscribe()
    myId.value = null
  }
})
onBeforeUnmount(unsubscribe)

function search(): void {
  const q = city.value.trim()
  router.push(localePath(q ? `/search?city=${encodeURIComponent(q)}` : '/search'))
}

// ── Account menu (authed) ───────────────────────────────────────────────
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const initials = computed(() => {
  const meta = user.value?.user_metadata as { full_name?: string; name?: string } | undefined
  const name = (meta?.full_name ?? meta?.name ?? '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
    return (first + last).toUpperCase()
  }
  // Fall back to the first letter of the email.
  return (user.value?.email?.[0] ?? '?').toUpperCase()
})

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function closeMenu(): void {
  menuOpen.value = false
}

onClickOutside(menuRef, closeMenu)

// Close the menu on navigation.
watch(() => route.fullPath, closeMenu)

async function onSignOut(): Promise<void> {
  closeMenu()
  await signOut()
  await navigateTo(localePath('/'))
}
</script>

<template>
  <header class="hdr">
    <div class="wrap hdr-inner">
      <NuxtLink :to="localePath('/')" class="brand-link" :aria-label="t('nav.home')">
        <BrandLogo :size="30" />
      </NuxtLink>

      <!-- Desktop search -->
      <form class="searchbar desk-search" role="search" @submit.prevent="search">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--aqua-700)"
          stroke-width="2"
          stroke-linecap="round"
          class="pin"
          aria-hidden="true"
        >
          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          v-model="city"
          type="search"
          :placeholder="t('home.searchPlaceholder')"
          :aria-label="t('home.searchPlaceholder')"
        />
        <button class="btn btn-primary btn-sm search-btn" type="submit">
          {{ t('common.search') }}
        </button>
      </form>

      <div class="actions">
        <NuxtLink :to="localePath('/publish')" class="btn btn-ghost btn-sm publish-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ t('nav.publish') }}
        </NuxtLink>
        <div class="hidden md:flex"><LanguageSwitcher /></div>
        <div class="flex md:hidden"><LanguageSwitcher compact /></div>

        <!-- Notification bell (signed in) -->
        <NuxtLink
          v-if="user"
          :to="localePath('/notifications')"
          class="icon-btn bell"
          :aria-label="
            unreadCount
              ? t('notifications.bellWithCount', { count: unreadCount })
              : t('notifications.bell')
          "
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
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span v-if="unreadCount" class="bell-badge">{{
            unreadCount > 99 ? '99+' : unreadCount
          }}</span>
        </NuxtLink>

        <!-- Signed out: sign-in CTA -->
        <NuxtLink
          v-if="!user"
          :to="localePath('/login')"
          class="btn btn-secondary btn-sm signin-link"
        >
          {{ t('auth.signIn.cta') }}
        </NuxtLink>

        <!-- Signed in: avatar + dropdown -->
        <div v-else ref="menuRef" class="account">
          <button
            class="avatar avatar-btn avatar-initials"
            type="button"
            :aria-label="t('nav.profile')"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="toggleMenu"
          >
            {{ initials }}
          </button>

          <div v-if="menuOpen" class="menu" role="menu">
            <NuxtLink :to="profilePath" class="menu-item" role="menuitem">
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
              {{ t('auth.menu.profile') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/bookings')" class="menu-item" role="menuitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {{ t('auth.menu.bookings') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/account/phone')" class="menu-item" role="menuitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              {{ t('auth.menu.verifyPhone') }}
            </NuxtLink>
            <hr class="menu-sep" />
            <button type="button" class="menu-item menu-signout" role="menuitem" @click="onSignOut">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5M21 12H9" />
              </svg>
              {{ t('auth.menu.signOut') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile search (second row) -->
    <div class="wrap mob-search-row">
      <form class="searchbar mob-search" role="search" @submit.prevent="search">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--aqua-700)"
          stroke-width="2"
          stroke-linecap="round"
          class="pin"
          aria-hidden="true"
        >
          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          v-model="city"
          type="search"
          :placeholder="t('home.searchPlaceholder')"
          :aria-label="t('home.searchPlaceholder')"
        />
        <button
          class="btn btn-primary btn-sm search-btn"
          type="submit"
          :aria-label="t('common.search')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </form>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.hdr-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-block: 0.7rem;
}
.brand-link {
  text-decoration: none;
  border-radius: var(--r-md);
}
.brand-link:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.desk-search {
  flex: 1;
  max-width: 460px;
  padding: 0.3rem 0.3rem 0.3rem 0.9rem;
}
.pin {
  width: 18px;
  height: 18px;
  flex: none;
}
.search-btn {
  padding-inline: 1rem;
  flex: none;
}
.actions {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: none;
}
.avatar-btn {
  width: 38px;
  height: 38px;
  border: 1.5px solid var(--line-strong);
  background: var(--sand-2);
  color: var(--ink-muted);
  cursor: pointer;
  padding: 0;
}
.avatar-btn svg {
  width: 20px;
  height: 20px;
}
.avatar-btn:hover {
  border-color: var(--aqua-500);
  color: var(--aqua-800);
}
.avatar-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.avatar-initials {
  background: linear-gradient(135deg, #22d3ee, #0e7490);
  color: #fff;
  border-color: transparent;
  font-weight: 700;
  font-size: 0.85rem;
}
.avatar-initials:hover {
  color: #fff;
  border-color: transparent;
  filter: brightness(1.05);
}
.signin-link {
  flex: none;
}

/* notification bell */
.bell {
  position: relative;
  width: 38px;
  height: 38px;
  flex: none;
}
.bell svg {
  width: 19px;
  height: 19px;
}
.bell-badge {
  position: absolute;
  top: -3px;
  inset-inline-end: -3px;
  min-width: 17px;
  height: 17px;
  padding-inline: 0.25rem;
  border-radius: 99px;
  background: var(--coral-deep);
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
}

/* account dropdown */
.account {
  position: relative;
  flex: none;
}
.menu {
  position: absolute;
  inset-inline-end: 0;
  top: calc(100% + 0.5rem);
  min-width: 220px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-pop);
  padding: 0.4rem;
  z-index: 60;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: var(--r-md);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  text-align: start;
  transition: background-color var(--dur-1);
}
.menu-item:hover {
  background: var(--aqua-50);
  color: var(--aqua-800);
}
.menu-item:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.menu-item svg {
  width: 18px;
  height: 18px;
  flex: none;
  color: var(--ink-muted);
}
.menu-item:hover svg {
  color: var(--aqua-700);
}
.menu-sep {
  border: none;
  border-top: 1px solid var(--line);
  margin: 0.35rem 0.2rem;
}
.menu-signout {
  color: var(--danger-deep);
}
.menu-signout:hover {
  background: var(--danger-soft);
  color: var(--danger-deep);
}
.menu-signout svg {
  color: var(--danger);
}
.menu-signout:hover svg {
  color: var(--danger-deep);
}

/* Responsive: hide desktop bits on mobile, show compact bits */
.lang-mobile {
  display: none;
}
.mob-search-row {
  display: none;
}

@media (max-width: 767px) {
  .desk-search {
    display: none;
  }
  .publish-link {
    display: none;
  }
  .lang-desk {
    display: none;
  }
  .lang-mobile {
    display: inline-flex;
  }
  .mob-search-row {
    display: block;
    padding-bottom: 0.7rem;
  }
  .mob-search {
    padding: 0.3rem 0.3rem 0.3rem 0.8rem;
  }
}
</style>
