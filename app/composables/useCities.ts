import type { City } from '~/types/db'

// All active cities, ordered by French name. Cached with useAsyncData so the
// (rarely-changing) list is fetched once per key and shared across components.
//
// Like useProfiles, we re-type the Supabase client to a minimal query surface:
// the generated Database type is a placeholder, so `from()` would be `never`.
// Results are cast to db.ts interfaces.

export function useCities() {
  const supabase = useSupabaseClient()

  const { data, pending, error, refresh } = useAsyncData<City[]>('cities', async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
      .eq('is_active', true)
      .order('name_fr', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as City[]
  })

  const cities = computed<City[]>(() => data.value ?? [])
  return { cities, pending, error, refresh }
}
