// Typed accessor for the `profiles` table.
//
// The generated `Database` type is still a placeholder (app/types/database.types.ts)
// with no tables, so `useSupabaseClient<Database>().from('profiles')` resolves to
// a `never`-typed query builder. Until real types are generated, this composable
// supplies a minimal local schema for `profiles` so onboarding / phone / confirm
// can read and update it with full type safety.
//
// Columns mirror supabase/migrations/0001_init_profiles.sql.

export interface ProfileRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  phone_verified: boolean
  preferred_lang: 'fr' | 'ar'
  bio: string | null
  created_at: string
}

type ProfileUpdate = Partial<Omit<ProfileRow, 'id' | 'created_at'>>

// Minimal structural typing of just the query chains we use, so we avoid both
// the placeholder Database's `never` builders and a direct (unresolvable from
// app code) import of supabase-js. Replace with generated types once available.
interface ProfilesResult {
  error: { message: string } | null
}
interface ProfilesSelectResult<T> {
  data: T | null
  error: { message: string } | null
}
interface ProfilesQuery {
  from(table: 'profiles'): {
    update(patch: ProfileUpdate): { eq(col: 'id', value: string): Promise<ProfilesResult> }
    select(cols: 'full_name'): {
      eq(
        col: 'id',
        value: string
      ): {
        maybeSingle(): Promise<ProfilesSelectResult<Pick<ProfileRow, 'full_name'>>>
      }
    }
  }
}

export function useProfiles() {
  // Re-type the shared client against the local profiles chains. The underlying
  // client is identical; only the compile-time typing differs.
  const supabase = useSupabaseClient() as unknown as ProfilesQuery

  function update(id: string, patch: ProfileUpdate): Promise<ProfilesResult> {
    return supabase.from('profiles').update(patch).eq('id', id)
  }

  function selectFullName(
    id: string
  ): Promise<ProfilesSelectResult<Pick<ProfileRow, 'full_name'>>> {
    return supabase.from('profiles').select('full_name').eq('id', id).maybeSingle()
  }

  return { update, selectFullName }
}
