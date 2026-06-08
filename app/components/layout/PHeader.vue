<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

const city = ref('')

function search(): void {
  const q = city.value.trim()
  router.push(localePath(q ? `/search?city=${encodeURIComponent(q)}` : '/search'))
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
        >
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
        <LanguageSwitcher class="lang-desk" />
        <LanguageSwitcher class="lang-mobile" compact />
        <button class="avatar avatar-btn" type="button" :aria-label="t('nav.profile')">
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
        </button>
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
        >
        <button class="btn btn-primary btn-sm search-btn" type="submit" :aria-label="t('common.search')">
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
