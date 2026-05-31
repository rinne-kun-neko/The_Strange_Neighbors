// app/characters/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import CharacterPageClient from './CharacterPageClient'

type Row = Record<string, unknown>

type RelatedCard = {
  label: string
  subLabel?: string
  href?: string | null
}

const FALLBACK_STAND =
  'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/stand_color/009.png'

const FALLBACK_SYMBOL =
  'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/stand_color/018.png'

function read(row: Row | null | undefined, key: string) {
  const value = row?.[key]

  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

/* ===========================
   今のキャラ→無ければ ids=0
=========================== */
function readWithIds0(
  row: Row,
  ids0Row: Row | null | undefined,
  key: string,
) {
  const current = read(row, key)

  if (current) return current

  return read(ids0Row, key)
}

function pickRandom<T>(items: T[], count: number) {
  return [...items]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

function collectGalleryPool(row: Row) {
  const pool = new Set<string>()

  for (const [key, value] of Object.entries(row)) {
    if (!value || typeof value !== 'string') continue

    if (
      /image|thumb|stamp|stand|symbol|death|deth|window|samune|gallery/i.test(
        key,
      ) ||
      key === 'stand_color_image'
    ) {
      pool.add(value)
    }
  }

  return [...pool]
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('suggested_alias', slug)
    .single<Row>()

  const { data: ids0Row } = await supabase
    .from('characters')
    .select('*')
    .eq('ids', 0)
    .single<Row>()

  if (error || !data) notFound()

  const color = read(data, 'color') || '#ffffff'
  const colorV = read(data, 'color_v') || '#000000'

  /* ===========================
     立ち絵
     samune_image
     ↓
     ids=0 の samune_image
     ↓
     FALLBACK
  =========================== */
  const standImage =
    readWithIds0(data, ids0Row, 'stand_image') ||
    FALLBACK_STAND

  /* ===========================
     シンボル
     symbol_image
     ↓
     ids=0 の symbol_image
     ↓
     FALLBACK
  =========================== */
  const symbolImage =
    readWithIds0(data, ids0Row, 'symbol_image') ||
    FALLBACK_SYMBOL

  /* ===========================
     死に絵
  =========================== */
const deathImage =
  readWithIds0(data, ids0Row, 'death_image') ||
  read(data, 'stand_image') ||
  read(ids0Row, 'stand_image')
  
  /* ===========================
     種族画像など
  =========================== */
  const raceImage =
    readWithIds0(data, ids0Row, 'race_image')

  /* ===========================
     ギャラリー
     （変更なし）
  =========================== */
  const galleryPoolRaw = collectGalleryPool(data)

  const galleryPool =
    galleryPoolRaw.length
      ? galleryPoolRaw
      : [standImage]

  const galleryClosed =
    pickRandom(
      galleryPool,
      Math.min(8, galleryPool.length),
    )

  const galleryOpen = galleryPool

  /* ===========================
     関連キャラ
  =========================== */
  const relationSlots = Array.from(
    { length: 15 },
    (_, i) => {
      const n = String(i + 1).padStart(2, '0')

      return {
        label: read(data, `related_h_${n}`),
        subLabel: read(data, `related_y_${n}`),
        hrefKey: read(data, `related_id_${n}`),
      }
    },
  ).filter((slot) => slot.label)

  const relationCards: RelatedCard[] =
    pickRandom(relationSlots, 5).map(
      (slot) => ({
        label: slot.label,
        subLabel: slot.subLabel || undefined,
        href: slot.hrefKey
          ? `/characters/${slot.hrefKey}`
          : null,
      }),
    )

  return (
    <CharacterPageClient
      character={data}
      ids0Row={ids0Row}
      color={color}
      colorV={colorV}
      standImage={standImage}
      symbolImage={symbolImage}
      deathImage={deathImage}
      raceImage={raceImage}
      relationCards={relationCards}
      galleryClosed={galleryClosed}
      galleryOpen={galleryOpen}
    />
  )
}