<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()

useSeoMeta({
  title: () => t('dev.title'),
  robots: 'noindex',
})

// ── interactive state ────────────────────────────────────────────────
const inputBasic = ref('Youssef El Amrani')
const inputHint = ref('')
const inputError = ref('06 12')
const selectCity = ref('dar-bouazza')
const counter = ref(8)
const chipA = ref(true)
const chipB = ref(false)
const checkA = ref(true)
const checkB = ref(false)
const toggleA = ref(true)
const toggleB = ref(false)
const slot3 = ref('afternoon')
const slot4 = ref('morning')
const date = ref('')
const fav1 = ref(false)
const fav2 = ref(true)
const modalOpen = ref(false)
const sheetOpen = ref(false)

const cityOptions = [
  { value: 'casablanca', label: 'Casablanca' },
  { value: 'dar-bouazza', label: 'Dar Bouazza' },
  { value: 'bouskoura', label: 'Bouskoura' },
  { value: 'marrakech', label: 'Marrakech' },
  { value: 'rabat', label: 'Rabat' },
]

const slots3 = computed(() => [
  { key: 'morning', label: t('slots.morning'), sub: '9h–14h · 350 DH' },
  { key: 'afternoon', label: t('slots.afternoon'), sub: '15h–20h · 400 DH' },
  { key: 'full_day', label: t('slots.fullDay'), sub: '9h–20h · 700 DH' },
])

const slots4 = computed(() => [
  { key: 'morning', label: t('slots.morning'), sub: '9h–14h' },
  { key: 'afternoon', label: t('slots.afternoon'), sub: '15h–20h' },
  { key: 'full_day', label: t('slots.fullDay'), sub: '9h–20h' },
  { key: 'evening', label: t('slots.evening'), sub: '20h–00h' },
])

const aquaRamp: Array<[string, string]> = [
  ['50', '#ECFEFF'],
  ['100', '#CFF7FB'],
  ['200', '#A4ECF5'],
  ['300', '#6FDDED'],
  ['400', '#22D3EE'],
  ['500', '#06B6D4'],
  ['600', '#0891B2'],
  ['700', '#0E7490'],
  ['800', '#155E75'],
  ['900', '#164E63'],
]

const tokens: Array<[string, string, string]> = [
  ['Ink', '#0F3D4C', '--ink'],
  ['Ink muted', '#4F6E78', '--ink-muted'],
  ['Petrol 900', '#164E63', '--aqua-900'],
  ['Coral', '#FB7185', '--coral'],
  ['Coral deep', '#F43F5E', '--coral-deep'],
  ['WhatsApp', '#17A24E', '--wa'],
  ['Amber', '#F59E0B', '--amber'],
  ['Success', '#15A24A', '--success'],
  ['Danger', '#DC2626', '--danger'],
  ['Sand', '#FAFAF7', '--sand'],
  ['Sand 2', '#F1F1EA', '--sand-2'],
  ['Line', '#D3D6CE', '--line-strong'],
]

const typeScale: Array<[string, string]> = [
  ['t-display', 'Masbah'],
  ['t-h1', 'Louez une piscine'],
  ['t-h2', "Piscines à l'abri des regards"],
  ['t-h3', 'Villa avec piscine — Dar Bouazza'],
  ['t-bodyl', 'Body large — réservez votre créneau.'],
  ['t-body', 'Body — payez en espèces sur place.'],
  ['t-sm', 'Small — 87 avis vérifiés.'],
  ['t-over', 'Overline'],
]

const samplePool = {
  id: 'demo-1',
  title: 'Villa avec piscine privée',
  city: 'Dar Bouazza',
  rating: 4.9,
  reviewCount: 87,
  priceFrom: 350,
  coverUrl:
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=70',
  amenities: ['🍖', '🚗', '🧺', '🚿'],
  sheltered: true,
  reliableHost: true,
}
</script>

<template>
  <div class="pg">
    <header class="pg-head">
      <p class="t-over">Masbah · DS</p>
      <h1 class="t-h1">{{ t('dev.title') }}</h1>
      <p class="t-body muted" style="max-width: 60ch; margin-top: 0.4rem">{{ t('dev.subtitle') }}</p>
    </header>

    <!-- ── Colors ─────────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.colors') }}</h2>
      <div class="tok-card">
        <strong class="block-label">Aqua ramp</strong>
        <div class="ramp">
          <div v-for="[k, v] in aquaRamp" :key="k" class="ramp-item">
            <div class="swatch" :style="{ background: v }" />
            <div class="swatch-k">{{ k }}</div>
            <code class="spec">{{ v }}</code>
          </div>
        </div>
      </div>
      <div class="tok-grid">
        <div v-for="[name, hex, varn] in tokens" :key="varn" class="tok-card tok-mini">
          <div class="swatch swatch-flat" :style="{ background: hex }" />
          <div class="tok-mini-body">
            <strong class="tok-name">{{ name }}</strong>
            <code class="spec">{{ hex }}</code>
            <code class="spec">{{ varn }}</code>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Typography ─────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.typography') }}</h2>
      <div class="tok-card stack">
        <div v-for="[cls, text] in typeScale" :key="cls" class="type-row">
          <span :class="cls">{{ text }}</span>
          <code class="spec">.{{ cls }}</code>
        </div>
      </div>
    </section>

    <!-- ── Buttons ────────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.buttons') }}</h2>
      <div class="grid-cards">
        <div
          v-for="variant in ['primary', 'secondary', 'ghost', 'whatsapp', 'destructive'] as const"
          :key="variant"
          class="tok-card"
        >
          <strong class="block-label">{{ variant }}</strong>
          <div class="row">
            <PButton :variant="variant" size="sm">Small</PButton>
            <PButton :variant="variant">Medium</PButton>
            <PButton :variant="variant" size="lg">Large</PButton>
          </div>
          <div class="row" style="margin-top: 0.6rem">
            <PButton :variant="variant" loading>Loading</PButton>
            <PButton :variant="variant" disabled>Disabled</PButton>
          </div>
        </div>
        <div class="tok-card">
          <strong class="block-label">Block + icon</strong>
          <PButton variant="primary" block>
            <template #icon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </template>
            {{ t('nav.publish') }}
          </PButton>
        </div>
      </div>
    </section>

    <!-- ── Icon buttons ───────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.iconButtons') }}</h2>
      <div class="tok-card">
        <div class="row">
          <PIconButton label="Appeler">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </PIconButton>
          <PIconButton variant="whatsapp" label="WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02zm-7.01 15.24a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24z" />
            </svg>
          </PIconButton>
          <PIconButton label="Partager" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
            </svg>
          </PIconButton>
        </div>
      </div>
    </section>

    <!-- ── Inputs & Select ────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.inputs') }}</h2>
      <div class="grid-cards">
        <div class="tok-card">
          <PInput v-model="inputBasic" label="Votre nom" placeholder="ex. Salma Bennani" />
        </div>
        <div class="tok-card">
          <PInput
            v-model="inputHint"
            label="Email"
            type="email"
            placeholder="vous@exemple.ma"
            hint="Jamais partagé publiquement."
          />
        </div>
        <div class="tok-card">
          <PInput
            v-model="inputError"
            label="Téléphone"
            type="tel"
            inputmode="tel"
            error="Numéro marocain incomplet (10 chiffres)."
          />
        </div>
        <div class="tok-card">
          <PSelect v-model="selectCity" label="Ville" :options="cityOptions" />
        </div>
      </div>
    </section>

    <!-- ── Counter ────────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.counter') }}</h2>
      <div class="tok-card">
        <span class="label block-label">Nombre d'invités</span>
        <PCounter v-model="counter" :min="1" :max="25" aria-label="Nombre d'invités" />
        <span class="hint" style="margin-inline-start: 1rem">Valeur : {{ counter }}</span>
      </div>
    </section>

    <!-- ── Chips ──────────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.chips') }}</h2>
      <div class="tok-card">
        <div class="row">
          <PChip v-model="chipA" label="À l'abri des regards" />
          <PChip v-model="chipB" label="🍖 Barbecue" />
          <PChip v-model="checkB" label="🚗 Parking" />
        </div>
      </div>
    </section>

    <!-- ── Checkbox & Toggle ──────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.checkbox') }} · {{ t('dev.toggle') }}</h2>
      <div class="grid-cards">
        <div class="tok-card stack-sm">
          <PCheckbox v-model="checkA" label="J'accepte le règlement intérieur" />
          <PCheckbox v-model="checkB" label="Recevoir des offres" />
        </div>
        <div class="tok-card stack-sm">
          <PToggle v-model="toggleA" label="Piscine à l'abri des regards" />
          <PToggle v-model="toggleB" label="Eau chauffée" />
        </div>
      </div>
    </section>

    <!-- ── Badges ─────────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.badges') }}</h2>
      <div class="tok-card">
        <div class="row">
          <PBadge variant="verified">Vérifié</PBadge>
          <PBadge variant="host">Hôte fiable</PBadge>
          <PBadge variant="privacy">À l'abri des regards</PBadge>
          <PBadge variant="cash">Paiement sur place</PBadge>
          <PBadge variant="phone">Téléphone vérifié</PBadge>
          <PBadge variant="neutral">Neutre</PBadge>
        </div>
      </div>
    </section>

    <!-- ── Skeletons ──────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.skeletons') }}</h2>
      <div class="tok-card stack-sm">
        <PSkeleton width="80%" height="16px" />
        <PSkeleton width="55%" height="12px" />
        <PSkeleton width="120px" height="20px" rounded="999px" />
        <PSkeleton width="48px" height="48px" circle />
      </div>
    </section>

    <!-- ── Rating ─────────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.rating') }}</h2>
      <div class="tok-card stack-sm">
        <PRating :rating="4.8" show-value :count="126" />
        <PRating :rating="3" size="sm" />
        <PRating :rating="5" />
      </div>
    </section>

    <!-- ── Slot picker ────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.slotPicker') }}</h2>
      <div class="grid-cards">
        <div class="tok-card">
          <strong class="block-label">3 créneaux</strong>
          <PSlotPicker v-model="slot3" :options="slots3" />
        </div>
        <div class="tok-card">
          <strong class="block-label">4 créneaux</strong>
          <PSlotPicker v-model="slot4" :options="slots4" />
        </div>
      </div>
    </section>

    <!-- ── Date picker ────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.datePicker') }}</h2>
      <div class="tok-card" style="max-width: 320px">
        <PDatePicker v-model="date" label="Date de visite" hint="Pic de saison : juin – septembre." />
      </div>
    </section>

    <!-- ── Pool card ──────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.poolCard') }}</h2>
      <div class="pool-grid">
        <PoolCard
          v-model:favorite="fav1"
          v-bind="samplePool"
          :slot-label="t('slots.afternoon')"
        />
        <PoolCard
          id="demo-2"
          v-model:favorite="fav2"
          title="Piscine chauffée · Palmeraie"
          city="Marrakech"
          :rating="4.8"
          :review-count="126"
          :price-from="500"
          cover-url="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=70"
          :amenities="['🍖', '🌴', '🧺', '👶']"
          sheltered
        />
        <PoolCardSkeleton />
      </div>
    </section>

    <!-- ── Overlays ───────────────────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.overlays') }}</h2>
      <div class="tok-card">
        <div class="row">
          <PButton @click="modalOpen = true">{{ t('dev.openModal') }}</PButton>
          <PButton variant="secondary" @click="sheetOpen = true">{{ t('dev.openSheet') }}</PButton>
        </div>
      </div>

      <PModal v-model:open="modalOpen" :title="t('dev.modalDemoTitle')">
        <p class="t-body">{{ t('dev.modalDemoBody') }}</p>
        <template #footer>
          <PButton variant="ghost" @click="modalOpen = false">{{ t('common.cancel') }}</PButton>
          <PButton @click="modalOpen = false">{{ t('common.confirm') }}</PButton>
        </template>
      </PModal>

      <PSheet v-model:open="sheetOpen" :title="t('dev.sheetDemoTitle')">
        <p class="t-body">{{ t('dev.sheetDemoBody') }}</p>
        <div class="row" style="margin-top: 1rem">
          <PChip label="🍖 Barbecue" />
          <PChip label="🚗 Parking" />
          <PChip label="👶 Enfants" />
        </div>
        <template #footer>
          <PButton block @click="sheetOpen = false">{{ t('common.confirm') }}</PButton>
        </template>
      </PSheet>
    </section>

    <!-- ── Navigation in context ──────────────────────────────── -->
    <section class="sec">
      <h2 class="sec-title t-h3">{{ t('dev.navigation') }}</h2>
      <p class="t-sm muted" style="margin-bottom: 0.6rem">
        Le PHeader et la PTabBar sont déjà rendus par le layout. Ci-dessous : le sélecteur de langue
        et un aperçu de la tab bar.
      </p>
      <div class="tok-card stack-sm">
        <div>
          <strong class="block-label">LanguageSwitcher</strong>
          <div class="row">
            <LanguageSwitcher />
            <LanguageSwitcher compact />
          </div>
        </div>
        <div>
          <strong class="block-label">PTabBar</strong>
          <div class="tabbar-demo">
            <PTabBar />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pg {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}
.pg-head {
  border-bottom: 1px solid var(--line);
  padding-bottom: 1.5rem;
}
.sec {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.sec-title {
  border-inline-start: 4px solid var(--aqua-500);
  padding-inline-start: 0.6rem;
}
.tok-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-sm);
  padding: 1.2rem;
}
.block-label {
  display: block;
  margin-bottom: 0.8rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: capitalize;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.stack-sm {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: flex-start;
}
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.8rem;
}
.spec {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: var(--ink-muted);
}

/* colors */
.ramp {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}
.swatch {
  height: 56px;
  border-radius: var(--r-md);
  box-shadow: inset 0 0 0 1px rgba(10, 45, 56, 0.06);
}
.swatch-flat {
  height: 52px;
  border-radius: 0;
}
.swatch-k {
  margin-top: 0.35rem;
  font-weight: 700;
  font-size: 0.78rem;
}
.tok-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.8rem;
}
.tok-mini {
  padding: 0;
  overflow: hidden;
}
.tok-mini-body {
  padding: 0.7rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.tok-name {
  font-size: 0.85rem;
}

/* typography */
.type-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--line-2);
}
.type-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* pool grid */
.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
  gap: 1.1rem;
}

/* tab bar preview frame */
.tabbar-demo {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
  max-width: 420px;
}
.tabbar-demo :deep(.tabbar) {
  border-top: none;
}
</style>
