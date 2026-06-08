<script setup lang="ts">
// Account settings (S14-ish). Shows the signed-in user's profile summary and
// notification preferences. notif_prefs is a jsonb column on profiles (migration
// 0015), read/written under own-row RLS. We never read useSupabaseUser().value.id
// — the own row is fetched with .maybeSingle() (own-row RLS).
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { t } = useI18n()
const localePath = useLocalePath()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { signOut } = useAuthForm()

useSeoMeta({
  title: () => `${t('account.seoTitle')} · Masbah`,
  robots: 'noindex',
})

// ── Notification preference keys (mirror the notification types) ──────────
const NOTIF_KEYS = ['new_request', 'request_accepted', 'request_declined', 'new_review'] as const
type NotifKey = (typeof NOTIF_KEYS)[number]
type NotifPrefs = Partial<Record<NotifKey, boolean>>

const NOTIF_META: { key: NotifKey; label: string; hint: string }[] = [
  { key: 'new_request', label: 'account.notif.newRequest', hint: 'account.notif.newRequestHint' },
  {
    key: 'request_accepted',
    label: 'account.notif.requestAccepted',
    hint: 'account.notif.requestAcceptedHint',
  },
  {
    key: 'request_declined',
    label: 'account.notif.requestDeclined',
    hint: 'account.notif.requestDeclinedHint',
  },
  { key: 'new_review', label: 'account.notif.newReview', hint: 'account.notif.newReviewHint' },
]

// ── Local typing for the own-row profiles read/update (placeholder Database
// type resolves to `never` builders, so re-type just the chains we use). ──
interface AccountProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  phone_verified: boolean
  created_at: string
  notif_prefs: NotifPrefs | null
}
/* eslint-disable no-unused-vars -- type-only method signatures (param names are documentation) */
interface AccountProfileQuery {
  from(table: 'profiles'): {
    select(cols: string): {
      maybeSingle(): Promise<{ data: AccountProfile | null; error: { message: string } | null }>
    }
    update(patch: { notif_prefs: NotifPrefs }): {
      eq(col: 'id', value: string): Promise<{ error: { message: string } | null }>
    }
  }
}
/* eslint-enable no-unused-vars */
const db = supabase as unknown as AccountProfileQuery

// ── State ────────────────────────────────────────────────────────────────
const profile = ref<AccountProfile | null>(null)
const pending = ref(true)
// All notification types default to ON; an explicit `false` in notif_prefs disables one.
const prefs = reactive<Record<NotifKey, boolean>>({
  new_request: true,
  request_accepted: true,
  request_declined: true,
  new_review: true,
})
const savedTick = ref(false)
const saveError = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | null = null

async function load(): Promise<void> {
  pending.value = true
  if (!user.value) {
    pending.value = false
    return
  }
  const { data } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, phone, phone_verified, created_at, notif_prefs')
    .maybeSingle()
  profile.value = data
  const saved = (data?.notif_prefs ?? {}) as NotifPrefs
  for (const k of NOTIF_KEYS) prefs[k] = saved[k] !== false
  pending.value = false
}
onMounted(load)
watch(user, load)

// ── Identity display ─────────────────────────────────────────────────────
const displayName = computed(() => profile.value?.full_name?.trim() || '')
const initials = computed(() => {
  const n = displayName.value
  if (!n) return (user.value?.email?.[0] ?? '?').toUpperCase()
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
})
const memberYear = computed(() => {
  const c = profile.value?.created_at
  return c ? new Date(c).getFullYear() : null
})
const profilePath = computed(() =>
  profile.value?.id ? localePath('/membres/' + profile.value.id) : null
)

// ── Save a toggle change ─────────────────────────────────────────────────
async function onToggle(key: NotifKey, value: boolean): Promise<void> {
  prefs[key] = value
  if (!profile.value?.id) return
  saveError.value = false
  const payload: NotifPrefs = {}
  for (const k of NOTIF_KEYS) payload[k] = prefs[k]
  const { error } = await db
    .from('profiles')
    .update({ notif_prefs: payload })
    .eq('id', profile.value.id)
  if (error) {
    saveError.value = true
    return
  }
  savedTick.value = true
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => (savedTick.value = false), 2200)
}
onBeforeUnmount(() => {
  if (savedTimer) clearTimeout(savedTimer)
})

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo(localePath('/'))
}
</script>

<template>
  <div class="account-page">
    <h1 class="t-h1 page-title">{{ t('account.title') }}</h1>

    <!-- loading -->
    <div v-if="pending" class="loading">
      <div class="skel" style="height: 120px; border-radius: var(--r-2xl)" />
      <div class="skel" style="height: 220px; margin-top: 1rem; border-radius: var(--r-2xl)" />
    </div>

    <template v-else>
      <!-- ── Profile summary ── -->
      <section class="card profile-card">
        <span v-if="profile?.avatar_url" class="avatar-wrap">
          <NuxtImg
            :src="profile.avatar_url"
            :alt="displayName"
            width="64"
            height="64"
            format="webp"
            class="avatar pf-avatar"
          />
        </span>
        <span v-else class="avatar pf-avatar pf-avatar-fallback">{{ initials }}</span>

        <div class="pf-info">
          <h2 class="pf-name">{{ displayName || user?.email }}</h2>
          <p v-if="memberYear" class="muted t-sm">
            {{ t('account.memberSince', { year: memberYear }) }}
          </p>
          <div class="pf-status">
            <PBadge v-if="profile?.phone_verified" variant="verified">
              <template #icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </template>
              {{ t('account.phoneVerified') }}
            </PBadge>
            <span v-else class="pf-unverified">
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
              {{ t('account.phoneNotVerified') }}
            </span>
          </div>
        </div>
      </section>

      <!-- ── Quick links ── -->
      <nav class="card link-list" :aria-label="t('account.title')">
        <NuxtLink v-if="profilePath" :to="profilePath" class="link-row">
          <span class="link-ico">
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
          </span>
          <span class="link-label">{{ t('account.viewPublicProfile') }}</span>
          <svg
            class="link-chev flip-x"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </NuxtLink>

        <NuxtLink :to="localePath('/account/phone')" class="link-row">
          <span class="link-ico">
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
          </span>
          <span class="link-label">{{ t('account.verifyPhone') }}</span>
          <span v-if="!profile?.phone_verified" class="link-pill">{{
            t('account.verifyPhoneCta')
          }}</span>
          <svg
            class="link-chev flip-x"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </NuxtLink>
      </nav>

      <!-- ── Notification preferences ── -->
      <section class="card notif-card">
        <div class="notif-head">
          <div>
            <h2 class="t-h3">{{ t('account.notifTitle') }}</h2>
            <p class="muted t-sm" style="margin-top: 0.2rem">{{ t('account.notifSubtitle') }}</p>
          </div>
          <span v-if="savedTick" class="saved-pill" role="status">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {{ t('account.notifSaved') }}
          </span>
        </div>

        <p v-if="saveError" class="notif-error">{{ t('account.notifError') }}</p>

        <ul class="notif-list">
          <li v-for="item in NOTIF_META" :key="item.key" class="notif-row">
            <div class="notif-text">
              <span class="notif-label">{{ t(item.label) }}</span>
              <span class="muted t-sm">{{ t(item.hint) }}</span>
            </div>
            <PToggle
              :model-value="prefs[item.key]"
              :aria-label="t(item.label)"
              @update:model-value="(v: boolean) => onToggle(item.key, v)"
            />
          </li>
        </ul>
      </section>

      <!-- ── Sign out ── -->
      <div class="signout-row">
        <button type="button" class="btn btn-secondary signout-btn" @click="onSignOut">
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
          {{ t('account.signOut') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.account-page {
  max-width: 640px;
  margin-inline: auto;
}
.page-title {
  margin-bottom: 1.4rem;
}
.loading .skel {
  background: linear-gradient(100deg, var(--sand-2) 30%, #fff 50%, var(--sand-2) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  margin-bottom: 1rem;
}

/* profile summary */
.profile-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.3rem;
}
.avatar-wrap {
  flex: none;
}
.pf-avatar {
  width: 64px;
  height: 64px;
  font-size: 1.4rem;
  object-fit: cover;
  flex: none;
}
.pf-avatar-fallback {
  background: linear-gradient(135deg, #22d3ee, #0e7490);
  color: #fff;
  font-weight: 700;
}
.pf-info {
  min-width: 0;
}
.pf-name {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  word-break: break-word;
}
.pf-status {
  margin-top: 0.5rem;
}
.pf-unverified {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--amber-ink);
  background: var(--amber-soft);
  padding: 0.28rem 0.6rem;
  border-radius: var(--r-pill);
}
.pf-unverified svg {
  width: 14px;
  height: 14px;
}

/* quick links */
.link-list {
  padding: 0.3rem;
}
.link-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 0.9rem;
  border-radius: var(--r-lg);
  text-decoration: none;
  color: var(--ink);
  transition: background-color var(--dur-1);
}
.link-row + .link-row {
  border-top: 1px solid var(--line);
  border-radius: 0;
}
.link-row:hover {
  background: var(--aqua-50);
}
.link-ico {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
  background: var(--aqua-50);
  color: var(--aqua-700);
  display: grid;
  place-items: center;
  flex: none;
}
.link-ico svg {
  width: 19px;
  height: 19px;
}
.link-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
}
.link-pill {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--amber-ink);
  background: var(--amber-soft);
  padding: 0.2rem 0.5rem;
  border-radius: var(--r-pill);
}
.link-chev {
  width: 18px;
  height: 18px;
  color: var(--ink-faint);
  flex: none;
}

/* notifications */
.notif-card {
  padding: 1.2rem 1.3rem;
}
.notif-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.saved-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--success);
  background: var(--success-soft);
  padding: 0.3rem 0.6rem;
  border-radius: var(--r-pill);
  flex: none;
}
.saved-pill svg {
  width: 14px;
  height: 14px;
}
.notif-error {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-soft);
  padding: 0.6rem 0.8rem;
  border-radius: var(--r-md);
  margin-bottom: 0.9rem;
}
.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.notif-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.9rem;
  border-top: 1px solid var(--line);
}
.notif-row:first-child {
  border-top: none;
  padding-top: 0;
}
.notif-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.notif-label {
  font-weight: 600;
  font-size: 0.95rem;
}

/* sign out */
.signout-row {
  margin-top: 1.4rem;
}
.signout-btn {
  width: 100%;
  color: var(--danger-deep);
  border-color: var(--line-strong);
}
.signout-btn:hover {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger-deep);
}
.signout-btn svg {
  color: var(--danger);
}
</style>
