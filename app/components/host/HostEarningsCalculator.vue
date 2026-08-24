<script setup lang="ts">
// Interactive earnings calculator for host acquisition page.
// Lets potential hosts visualize income based on their pool's potential.
const { t } = useI18n()

const pricePerSlot = ref(400)
const slotsPerWeek = ref(5)
const occupancyRate = ref(60)

const monthlyEarnings = computed(() => {
  const weekly = pricePerSlot.value * slotsPerWeek.value * (occupancyRate.value / 100)
  return Math.round(weekly * 4)
})

const yearlyEarnings = computed(() => monthlyEarnings.value * 12)

const seasonalMultiplier = computed(() => {
  // Summer months (June-September) = 1.5x, rest = 0.7x
  const summerMonthly = monthlyEarnings.value * 1.5
  const offSeasonMonthly = monthlyEarnings.value * 0.7
  const summerTotal = summerMonthly * 4
  const offSeasonTotal = offSeasonMonthly * 8
  return Math.round(summerTotal + offSeasonTotal)
})

// Preset configurations
const presets = [
  { label: 'Villa standard', price: 350, slots: 4, occupancy: 50 },
  { label: 'Belle piscine', price: 600, slots: 6, occupancy: 70 },
  { label: 'Premium', price: 1000, slots: 8, occupancy: 80 },
]

function applyPreset(p: typeof presets[0]) {
  pricePerSlot.value = p.price
  slotsPerWeek.value = p.slots
  occupancyRate.value = p.occupancy
}
</script>

<template>
  <div class="calculator">
    <!-- Presets -->
    <div class="presets">
      <button
        v-for="(p, i) in presets"
        :key="i"
        class="preset-btn"
        @click="applyPreset(p)"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Sliders -->
    <div class="sliders">
      <div class="slider-group">
        <label class="slider-label">
          <span>{{ t('hostLanding.calculator.priceLabel', 'Prix par créneau') }}</span>
          <span class="slider-value">{{ pricePerSlot }} DH</span>
        </label>
        <input
          v-model.number="pricePerSlot"
          type="range"
          min="100"
          max="2000"
          step="50"
          class="slider"
        />
      </div>

      <div class="slider-group">
        <label class="slider-label">
          <span>{{ t('hostLanding.calculator.slotsLabel', 'Créneaux par semaine') }}</span>
          <span class="slider-value">{{ slotsPerWeek }}</span>
        </label>
        <input
          v-model.number="slotsPerWeek"
          type="range"
          min="1"
          max="14"
          step="1"
          class="slider"
        />
      </div>

      <div class="slider-group">
        <label class="slider-label">
          <span>{{ t('hostLanding.calculator.occupancyLabel', 'Taux d\'occupation') }}</span>
          <span class="slider-value">{{ occupancyRate }}%</span>
        </label>
        <input
          v-model.number="occupancyRate"
          type="range"
          min="10"
          max="100"
          step="5"
          class="slider"
        />
      </div>
    </div>

    <!-- Results -->
    <div class="results">
      <div class="result-card result-primary">
        <span class="result-label">{{ t('hostLanding.calculator.monthly', 'Revenus mensuels estimés') }}</span>
        <span class="result-value">{{ monthlyEarnings.toLocaleString() }} DH</span>
      </div>
      <div class="result-row">
        <div class="result-card">
          <span class="result-label">{{ t('hostLanding.calculator.yearly', 'Revenus annuels') }}</span>
          <span class="result-value result-small">{{ yearlyEarnings.toLocaleString() }} DH</span>
        </div>
        <div class="result-card result-seasonal">
          <span class="result-label">{{ t('hostLanding.calculator.seasonal', 'Avec saisonnalité') }}</span>
          <span class="result-value result-small">{{ seasonalMultiplier.toLocaleString() }} DH</span>
          <span class="result-hint">{{ t('hostLanding.calculator.seasonalHint', 'Été + hors-saison') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calculator {
  max-width: 640px;
  margin-inline: auto;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  padding: 1.6rem;
  box-shadow: var(--sh-sm);
}

.presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}
.preset-btn {
  padding: 0.45rem 0.9rem;
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
  background: var(--sand-2);
  color: var(--ink);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--dur-1);
}
.preset-btn:hover {
  background: var(--aqua-50);
  border-color: var(--aqua-200);
  color: var(--aqua-700);
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1.6rem;
}
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink);
}
.slider-value {
  color: var(--aqua-700);
  font-weight: 800;
}
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--aqua-100);
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--aqua-600);
  cursor: pointer;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--aqua-600);
  cursor: pointer;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.result-card {
  background: var(--sand-2);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.result-primary {
  background: linear-gradient(135deg, var(--aqua-50), var(--aqua-100));
  border-color: var(--aqua-200);
  text-align: center;
  padding: 1.4rem;
}
.result-label {
  font-size: 0.85rem;
  color: var(--ink-muted);
  font-weight: 500;
}
.result-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--aqua-700);
  letter-spacing: -0.02em;
}
.result-small {
  font-size: 1.3rem;
}
.result-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}
.result-seasonal {
  background: linear-gradient(135deg, var(--amber-soft), #fff8e7);
  border-color: var(--amber-200);
}
.result-seasonal .result-value {
  color: var(--amber-ink);
}
.result-hint {
  font-size: 0.75rem;
  color: var(--ink-muted);
}

@media (max-width: 480px) {
  .result-row { grid-template-columns: 1fr; }
  .result-value { font-size: 1.6rem; }
}
</style>
