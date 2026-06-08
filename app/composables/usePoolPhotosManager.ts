import type { PoolPhoto } from '~/types/db'

interface MutationResult {
  error: { message: string } | null
}
interface PhotoInsertRow {
  pool_id: string
  storage_path: string
  position: number
  is_cover: boolean
}
// Narrow write chains on pool_photos (placeholder Database → `never` otherwise).
interface PoolPhotosQuery {
  from(table: 'pool_photos'): {
    insert(row: PhotoInsertRow): {
      select(cols: string): { single(): Promise<{ data: unknown; error: { message: string } | null }> }
    }
    update(patch: { position?: number; is_cover?: boolean }): {
      eq(col: 'id', value: string): Promise<MutationResult>
    }
    delete(): { eq(col: 'id', value: string): Promise<MutationResult> }
  }
}

const PHOTO_COLUMNS = 'id, pool_id, storage_path, position, is_cover'
const MAX_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type PhotoErrorCode = 'too_large' | 'bad_type' | 'decode_failed' | 'upload_failed' | 'db_failed'

export class PhotoError extends Error {
  code: PhotoErrorCode
  constructor(code: PhotoErrorCode) {
    super(code)
    this.code = code
  }
}

/**
 * Resize an image to fit within MAX_DIMENSION (longest side) and re-encode as
 * WebP via a canvas. Returns the encoded Blob. Throws PhotoError('decode_failed')
 * if the browser cannot decode/encode the source.
 */
async function resizeToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new PhotoError('decode_failed')

  const { width, height } = bitmap
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const targetW = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new PhotoError('decode_failed')
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY)
  )
  if (!blob) throw new PhotoError('decode_failed')
  return blob
}

/** List / upload (resize→webp) / reorder / setCover / delete pool photos. */
export function usePoolPhotosManager(id: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()
  const writeClient = supabase as unknown as PoolPhotosQuery

  const poolId = computed(() => toValue(id))

  async function list(): Promise<PoolPhoto[]> {
    const { data, error } = await supabase
      .from('pool_photos')
      .select(PHOTO_COLUMNS)
      .eq('pool_id', poolId.value)
      .order('position', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as PoolPhoto[]
  }

  /**
   * Validate (≤5MB + image type), resize+convert to WebP, upload to
   * `<pool_id>/<uuid>.webp`, then insert a pool_photos row. `nextPosition` is the
   * position to assign; the first photo of a pool becomes the cover.
   * Returns the created row.
   */
  async function upload(file: File, nextPosition: number, makeCover: boolean): Promise<PoolPhoto> {
    if (file.size > MAX_BYTES) throw new PhotoError('too_large')
    if (file.type && !ACCEPTED_TYPES.includes(file.type)) throw new PhotoError('bad_type')

    const blob = await resizeToWebp(file)
    if (blob.size > MAX_BYTES) throw new PhotoError('too_large')

    const path = `${poolId.value}/${crypto.randomUUID()}.webp`
    const { error: upErr } = await supabase.storage
      .from('pool-photos')
      .upload(path, blob, { contentType: 'image/webp', upsert: false })
    if (upErr) throw new PhotoError('upload_failed')

    const { data, error: insErr } = await writeClient
      .from('pool_photos')
      .insert({
        pool_id: poolId.value,
        storage_path: path,
        position: nextPosition,
        is_cover: makeCover,
      })
      .select(PHOTO_COLUMNS)
      .single()
    if (insErr) {
      // Roll back the orphaned object so we don't leak storage.
      await supabase.storage.from('pool-photos').remove([path])
      throw new PhotoError('db_failed')
    }
    return data as unknown as PoolPhoto
  }

  /** Persist a new ordering: write each row's position by its index. */
  async function reorder(orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((photoId, index) =>
        writeClient.from('pool_photos').update({ position: index }).eq('id', photoId)
      )
    )
  }

  /** Mark one photo as cover and clear the flag on all the others. */
  async function setCover(coverId: string, allIds: string[]): Promise<void> {
    await Promise.all(
      allIds.map((photoId) =>
        writeClient
          .from('pool_photos')
          .update({ is_cover: photoId === coverId })
          .eq('id', photoId)
      )
    )
  }

  /** Remove the storage object then the row. */
  async function remove(photo: Pick<PoolPhoto, 'id' | 'storage_path'>): Promise<void> {
    // Only delete the object if it's a bucket key (seed rows may be full URLs).
    if (!/^https?:\/\//i.test(photo.storage_path)) {
      await supabase.storage.from('pool-photos').remove([photo.storage_path])
    }
    await writeClient.from('pool_photos').delete().eq('id', photo.id)
  }

  return { list, upload, reorder, setCover, remove }
}
