// app/characters/[slug]/CharacterPageClient.tsx

'use client' // Next.jsのClient Componentとして実行

// Next.jsのページ遷移用コンポーネント
import Link from 'next/link'

// Reactフックと型定義
import {
  useEffect, // マウント時や値変更時の処理
  useMemo, // 計算結果をキャッシュ
  useRef, // DOMや値を保持
  useState, // 状態管理
  type CSSProperties, // style属性用の型
  type ReactNode, // JSX要素の型
} from 'react'

// Supabaseから取得した1行分のデータ
type Row = Record<string, unknown>

// 関連キャラクターカード
type RelatedCard = {
  label: string      // 表示名
  subLabel?: string  // 補足説明
  href?: string | null // 遷移先
   color?: string
}

// 吹き出し用セリフ
type Speech = {
  key: string  // セリフの種類
  text: string // セリフ本文
}


const TITLE_LOGO =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/title2.svg'
const NAME_CHANGER =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/name_changer2.svg'
const PRIVATE_BUTTON =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/prv_button.svg'
const RELATED_BALLOON = '/hukidashi.PNG'
const KOBANASHI =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/kobanashi2.svg'
const SHOWMORE_UP =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/showmore_upper.svg'
const SHOWMORE_DOWN =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/showmore_downer.svg'
const PAGE_UP =
'https://pzrdpwkoewnlwzgzpglv.supabase.co/storage/v1/object/public/characters/images/any/pageup.svg'


  /**
 * シート値を安全に取得
 * null
 * undefined
 * "-"
 * "－"
 * ""
 * は空文字として扱う
 */
function read(row: Row | null | undefined, key: string) {
  const value = row?.[key]
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (text === '' || text === '-' || text === '－') return ''
  return text
}
/** 値が存在するか判定 */
function exists(value: unknown) {
  return read({ v: value } as Row, 'v') !== ''
}
/*配列からランダムで1件取得*/
function randomPick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}
/**
 * 数値を min～max に制限
 *
 * 例:
 * clamp(150,0,100) → 100
 * clamp(-5,0,100) → 0
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
/*複数候補の中から最初に存在する文字列を返す*/
function firstText(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = read(row, key)
    if (value) return value
  }
  return ''
}

function buildOriginHref(origin: string) {// 親の値探し
  if (!origin) return ''
  if (origin.startsWith('http://') || origin.startsWith('https://')) return origin
  if (origin.startsWith('/')) return origin
  return `/characters/${origin}`
}

function MaskIcon({
  id,
  src, // マスクとして使う画像(SVGなど)のURL
  className = '', // 追加のCSSクラス
  style, // 呼び出し元から渡されるスタイル
  ariaLabel, // スクリーンリーダー向けラベル
}: { 
  src: string
  id?: string
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}) {
  return (
    <span
      id={id}
      // ariaLabelがない場合は支援技術から隠す
      aria-hidden={!ariaLabel}
      // スクリーンリーダー用の名称
      aria-label={ariaLabel}
      className={className}
      style={{  
        // width / height を効かせるため
        display: 'inline-block',
        // アイコンの色。currentColor = CSSのcolor値
        backgroundColor: 'currentColor',
        // src画像をマスクとして使用
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        // アイコンを繰り返さない
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',

        // 中央配置
        WebkitMaskPosition: 'center',
        maskPosition: 'center',

        // アスペクト比を維持して収める
        WebkitMaskSize: 'contain',
        maskSize: 'contain',

        // 呼び出し元のスタイルで上書き可能
        ...style,
      }}
    />
  )
}

function ClickableDiv({
  onClick,
  className = '',
  children,
  ariaLabel,
}: {
  onClick: () => void
  className?: string
  children: ReactNode
  ariaLabel?: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {children}
    </div>
  )
}
// ボタン押下で内容の表示/非表示を切り替える
function SectionToggle({
  label,
  icon = '◀',
  side = 'left',
  open,
  onToggle,
  children,
}: {
  label?: string
  icon?: string
  side?: 'left' | 'right'
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="grid gap-2">
      <ClickableDiv
         
        onClick={onToggle}
        className={[
          'flex items-center gap-3 text-lg font-bold py-2',
          side === 'left' ? 'justify-start' : 'justify-end',
        ].join(' ')}
      >
        {side === 'left' ? (
          <>
            <span
              className={[
                'inline-block text-[50px]transition-transform duration-300',
                open ? 'rotate-180' : 'rotate-0',
              ].join(' ')}
            >
              {icon}
            </span>

            {label ? <span className="tracking-[0.08em]">{label}</span> : null}
          </>
        ) : (
          <>
            {label ? <span className="tracking-[0.08em]">{label}</span> : null}

            <span
              className={[
                'inline-block text-[50px] transition-transform duration-300',
                open ? '-rotate-180' : 'rotate-0',
              ].join(' ')}
            >
              {icon}
            </span>
          </>
        )}
      </ClickableDiv>

      <div
        className={[
          'grid overflow-hidden transition-all duration-500 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  )
}

function NameSwap({
  alias, // ニックネーム・表示名
  tempSurname, // 一時的な姓（変身後など）
  givenName, // 名
  tempSurnamePhonetic, // 一時的な姓のふりがな（今は未使用っぽい）
  givenNamePhonetic, // 名のふりがな（今は未使用っぽい）
  origin, // 元データ（URLなど）
  onToggleView, // 表示切り替え用（親から渡されてる）
}: {
  alias: string
  tempSurname: string
  givenName: string
  tempSurnamePhonetic: string
  givenNamePhonetic: string
  origin: string
  onToggleView: () => void
}) {
  // 名前表示の切り替え状態（姓・名の表示切替用っぽい）
  const [swap, setSwap] = useState(false)

  // 一時的な姓があるかチェック
  const hasTempName = exists(tempSurname)

  // origin をURLとして整形
  const originHref = buildOriginHref(origin)

  // 一時的な名前がない場合はシンプル表示
  if (!hasTempName) {
    return (
      <div className="grid gap-2">
        <div
  style={{
    fontSize: '4em',
    fontWeight: 900,
    lineHeight: 1.05,
  }}
>
  {alias}
</div>
      </div>
    )
  }

  
  return (
    <div className="grid gap-2 border-b border-[color:var(--line)] pb-3">
      <div className="flex items-start gap-3">
        

        <div className="min-w-0 flex-1">
          <div className="relative min-h-[66px] overflow-hidden">
            <div
              className={[
                'text-[28px] font-black leading-[1.05] transition-all duration-500',
                swap ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100',
              ].join(' ')}
            >
              {alias}
            </div>

            <div
              className={[
                'absolute inset-x-0 top-[-56px] text-[28px] font-black leading-[1.05] transition-all duration-500',
                swap ? 'top-0 opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              {tempSurname} {givenName}
            </div>
          </div>

          <div className="text-[11px] leading-5 opacity-75">
            {tempSurnamePhonetic} {givenNamePhonetic}
          </div>

        </div>

       
      </div>
    </div>
  )
}

function ValueLine({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  if (!value) return null

  return (
    <div className="profile-row">
      <div className="profile-row__label">
        {label}
      </div>

      <div className="profile-row__value">
        {value}
      </div>
    </div>
  )
}

function InversePill({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  const text = read({ v: value } as Row, 'v')
  if (!text) return null

  return (
    <div className="grid gap-1">
      <div className="text-[11px] font-bold tracking-[0.12em] underline underline-offset-4 opacity-75">
        {label}
      </div>
      <div
        className="inline-block w-fit rounded-[14px] bg-[color:var(--fg)] px-3 py-1.5 text-[14px] font-medium"
        style={{
          color: 'var(--bg)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

function StatBar({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  const n = Number(value)
  const safe = Number.isFinite(n) ? clamp(n, 0, 100) : 0

  return (
    <div className="grid gap-1">
      <div className="text-[11px] font-bold tracking-[0.1em] opacity-80">{label}</div>
      <div className="h-3 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${safe}%`,
            background: 'currentColor',
          }}
        />
      </div>
    </div>
  )
}

function RadarChart({
  items,
}: {
  items: Array<{ label: string; value: number }>
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 50)
    return () => window.clearTimeout(id)
  }, [])

  const size = 500
  const center = size / 2
  const radius = 70
  const labelRadius = radius + 18
  const stepCount = 5
  const angleStep = (Math.PI * 2) / items.length

  const score = (value: string | number | null | undefined) => {
  switch (String(value).trim()) {
    case '×':
      return 1
    case '△':
      return 2
    case '〇':
    case '○':
      return 3
    case '◎':
      return 4
    default:
      return 0
  }
}

  const ringPoints = (ratio: number) =>
    items
      .map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep
        const x = center + Math.cos(angle) * radius * ratio
        const y = center + Math.sin(angle) * radius * ratio
        return `${x},${y}`
      })
      .join(' ')

  const valuePoints = items
    .map((item, i) => {
const ratio = score(item.value) 
      const angle = -Math.PI / 2 + i * angleStep
      const x = center + Math.cos(angle) * radius * ratio
      const y = center + Math.sin(angle) * radius * ratio
      return '${x},${y}'
    })
    .join(' ')


  return (
<div className="relative mx-auto aspect-square w-40 hide"><svg
  viewBox={`0 0 ${size} ${size}`}
  className="w-full h-full"
>        {[1, 2, 3, 4, 5].map((step) => {
          const ratio = step / stepCount
          return (
            <polygon
              key={step}
              points={ringPoints(ratio)}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
          )
        })}

        {items.map((item, i) => {
          const angle = -Math.PI / 2 + i * angleStep
          const x = center + Math.cos(angle) * radius
          const y = center + Math.sin(angle) * radius
          const len = Math.hypot(x - center, y - center)
          return (
            <line
              key={item.label}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.24}
              strokeWidth={1.2}
              strokeDasharray={`${len}`}
              strokeDashoffset={mounted ? '0' : `${len}`}
              style={{
                transition: 'stroke-dashoffset .75s ease',
                transitionDelay: `${i * 40}ms`,
              }}
            />
          )
        })}

        <g
          style={{
            transformOrigin: `${center}px ${center}px`,
            transform: mounted ? 'scale(1)' : 'scale(0.12)',
            opacity: mounted ? 1 : 0,
            transition: 'transform .75s cubic-bezier(.2,.9,.1,1), opacity .35s ease',
          }}
        >
         <polygon
  points={valuePoints}
  fill="currentColor"
  fillOpacity={0.45}
  stroke="currentColor"
  strokeOpacity={0.95}
  strokeWidth={1.5}
/>
          {items.map((item, i) => {
            const ratio = clamp(item.value, 0, 4)/4
            const angle = -Math.PI / 2 + i * angleStep
            const x = center + Math.cos(angle) * radius * ratio
            const y = center + Math.sin(angle) * radius * ratio
            return (
              <circle
                key={item.label}
                cx={x}
                cy={y}
                r="3.5"
                fill="currentColor"
                opacity={0.95}
              />
            )
          })}
        </g>
        {items.map((item, i) => {
  const angle = -Math.PI / 2 + i * angleStep

  const x = center + Math.cos(angle) * labelRadius
  const y = center + Math.sin(angle) * labelRadius

  return (
    <text
      key={`label-${item.label}`}
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="5"
      fill="currentColor"
      opacity="0.8"
    >
      {item.label}
    </text>
  )
})}
      </svg>

      {items.map((item, i) => {
        const angle = -Math.PI / 2 + i * angleStep
        const x = center + Math.cos(angle) * labelRadius
        const y = center + Math.sin(angle) * labelRadius
        return (
          <div
            key={item.label}
            className="pointer-events-none absolute text-[10px] font-bold tracking-[0.08em]"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </div>
        )
      })}

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-current/30 px-3 py-1 text-[10px] font-bold tracking-[0.12em] opacity-80"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        STATUS
      </div>
    </div>
  )
}
// 1個の吹き出し
function Balloon({ item }: { item: RelatedCard }) {
  const [active, setActive] = useState(false)

  return (
   <Link
 href={item.href || '#'}
 scroll={true}
      className="group block"
      style={{ cursor: 'default',position: 'relative' }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
    >
      <div
  className="relative"
          style={
          { width: '100%',height: '100%',  flexShrink: 0,
            color: 'var(--fg)',       // 通常色
            '--hover-color': item.color || '#c60000',
            position: 'relative',
          } as CSSProperties
        }
      /*<img 
  src={RELATED_BALLOON}
  alt=""
  style={{
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  }}
/>*/>
  <img
  src={RELATED_BALLOON}
  alt=""
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  }}
/>
<div
  className="absolute inset-0"
  style={{
    background: 'red',
    position: 'absolute',
    top: 0,
    borderStyle: 'inset',
    borderWidth: '3px',
  }}
/><div
  className="inset-0 transition-opacity duration-300"
  style={{
    opacity: active ? 1 : 0,
    background: 'var(--hover-color)',
    maskImage: `url(${RELATED_BALLOON})`,
    WebkitMaskImage: `url(${RELATED_BALLOON})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  }}
/>
        <div className="LABEL absolute inset-0 z-10” style={{color:'inherit',top:'0',left:'0',right:'0',bottom:'0',display:'flex',alignItems:'center',justifyContent:'center'}}>"
        style={{ position: 'absolute',top:'0',color:'inherit' }}>
         <div
  className="font-bold"
  style={{
    width: '100%',
    color: 'inherit',
    fontSize: '14px',
    marginTop: '1em',
  }}
>
  {item.label}
</div>

          {item.subLabel && (
<div
  className="mt-1 text-xs opacity-80"
  style={{
    position: 'absolute',top:'0',
    color: 'var(--bg)',
  }}
>
  {item.subLabel}
</div>          )}
        </div>
      </div>
    </Link>
  )}
function RelatedBubble({ items }: { items: RelatedCard[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '2px',
        justifyContent:'flex-start',
        padding: '0 18px 0 8px',
        width: '100%',
      }}
    >
      {items.slice(0, 5).map((item, i) => (
        <Balloon
          key={i}
          item={item}
        />
      ))}
    </div>
  )
}
function SpeechBubble({
  source,
  text,
}: {
  source: string
  text: string
}) {
  const short = text.length <= 26

  return (
    <div className="fixed right-3 bottom-20 z-40 w-[min(58vw,360px)]">
      <div className="relative rounded-[22px] border border-[color:var(--fg)] bg-white px-4 py-3 text-[color:var(--fg)] shadow-lg">
        <div className="mb-1 text-[10px] font-bold tracking-[0.12em] opacity-70">
          {source}
        </div>

        <div
          className={[
            'whitespace-pre-wrap text-[13px] leading-7',
            short ? 'grid min-h-[88px] place-items-center text-center' : 'text-left',
          ].join(' ')}
        >
          {text}
        </div>

        <div className="absolute -right-1 bottom-6 h-4 w-4 rotate-45 border-b border-r border-[color:var(--fg)] bg-white" />
      </div>
    </div>
  )
}

function GalleryTile({ src }: { src: string }) {
  return (
    <div className="aspect-square overflow-hidden rounded-[18px] bg-black/10" style={{
      width: '100%',
      height: '100%', 
      aspectRatio: '1 / 1',
      borderRadius: '18px',
      overflow: 'hidden',

    }}>
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

export default function CharacterPageClient({
  character,
  ids0Row,
  color,
  colorV,
  standImage,
  symbolImage,
  deathImage,
  raceImage,
  relationCards,
  galleryClosed,
  galleryOpen,
}: {
  character: Row
  ids0Row: Row | null
  color: string
  colorV: string
  standImage: string
  symbolImage: string
  deathImage: string
  raceImage: string
  relationCards: RelatedCard[]
  galleryClosed: string[]
  galleryOpen: string[]
}) {
  const [view, setView] = useState<'front' | 'back' | 'private'>('front')
  const [transition, setTransition] = useState<'toBack' | 'toFront' | 'toPrivate' | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [speech, setSpeech] = useState<Speech | null>(null)

  const [openPanels, setOpenPanels] = useState({
    basic: true,
    status: true,
    statusMore: false,
    galleryMore: false,
    tags: true,
    conditions: true,
    dialogue: true,
  })

const fallbackCards: RelatedCard[] = [
  { label: '???', subLabel: 'unknown' },
  { label: '???', subLabel: 'unknown' },
  { label: '???', subLabel: 'unknown' },
  { label: '???', subLabel: 'unknown' },
  { label: '???', subLabel: 'unknown' },
]

  const displayCards = [...relationCards, ...fallbackCards].slice(0, 5)

  const timerRef = useRef<number | null>(null)

  const pageStyle = useMemo(() => {
    if (view === 'front') {/*表色*/
      return {
        '--bg': colorV,
        '--fg': color,
        '--line': color,
      } as CSSProperties
    }
    if (view === 'back') {/*裏色*/
      return {
        '--bg': color,
        '--fg': colorV,
        '--line': colorV,
      } as CSSProperties
    }
    return {/*プラベ色*/
      '--bg': '#000000',
      '--fg': '#ffffff',
      '--line': '#ffffff',
    } as CSSProperties
  }, [view, color, colorV])

  const alias = read(character, 'alias')
  const tempSurname = read(character, 'temp_surname')
  const givenName = read(character, 'given_name')
  const tempSurnamePhonetic = read(character, 'temp_surname_phonetic')
  const givenNamePhonetic = read(character, 'given_name_phonetic')
  const origin = read(character, 'origin')
  const surname = read(character, 'surname')
  const surnamePhonetic = read(character, 'surname_phonetic')

const frontStandImage =
  standImage ||
  read(character, 'stand_image') ||
  read(ids0Row, 'stand_image')
const frontSymbolImage =
  symbolImage ||
  read(character, 'symbol_image') ||
  read(ids0Row, 'symbol_image')
const frontRaceImage =
  raceImage ||
  read(character, 'race_image') ||
  read(ids0Row, 'race_image')
const frontDeathImage =
  deathImage ||
  read(character, 'death_image') ||
  read(ids0Row, 'death_image')

  const backPortrait = useMemo(() => {
    const death = frontDeathImage
    if (death) return { src: death, reversed: false }

    if (frontStandImage) return { src: frontStandImage, reversed: true }

    const ids0Stand = read(ids0Row, 'stand_image')
    if (ids0Stand) return { src: ids0Stand, reversed: false }

    return { src: '', reversed: false }
  }, [character, frontDeathImage, frontStandImage])

  const birthMonth = read(character, 'birth_month')
  const birthDay = read(character, 'birth_day')
  const zodiac = read(character, 'zodiac')

  const basicRows = [
    ['年齢', read(character, 'prime_age')],
    ['身長', read(character, 'height')],
    ['誕生日', [birthMonth,"/",birthDay,zodiac].filter(Boolean).join(' ')  ],
    ['利き手', read(character, 'dominant_hand')],
    ['係', read(character, 'club_order')],
    ['一人称', read(character, 'first_person_pronoun')],
    ['二人称', read(character, 'second_person_pronoun')],
    ['三人称', read(character, 'shird_person_pronoun')],
  ] as const

  const basicRows2 = [
    ['性格', read(character, 'personality')],
    ['ギャップ', read(character, 'hidden_side')],
  ] as const

  const radarItems = [
    { label: 'ATK', value: read(character, 'atk') || 0 },
    { label: 'DEF', value: read(character, 'def') || 0 },
    { label: 'STR', value: read(character, 'str') || 0 },
    { label: 'HP', value: read(character, 'hp') || 0 },
    { label: 'STA', value: read(character, 'stamina') || 0 },
    { label: 'MP', value: read(character, 'mp') || 0 },
    { label: 'DEX', value: read(character, 'dex_evasion') || 0 },
    { label: 'ASPD', value: read(character, 'attack_speed') || 0 },
  ]

  const rightBars = [
    ['SAN', read(character, 'san')],
    ['穢れ耐性', read(character, 'corruption_resist')],
    ['外見', read(character, 'appearance')],
    ['コミュ力', read(character, 'social_skill')],
  ] as const

  const powerRows = [
    ['物理適性', read(character, 'physical_power')],
    ['魔法適性', read(character, 'arcane_power')],
  ] as const

  const meleeRows = [
    ['近距離適正', read(character, 'melee_aptitude')],
    ['近距離武器', read(character, 'melee_weapon')],
    ['近距離役割', read(character, 'melee_role')],
    ['近距離ウルト1', read(character, 'melee_ultimate1')],
    ['近距離ウルト', read(character, 'melee_ultimate')],
  ] as const

  const midRows = [
    ['中距離適正', read(character, 'mid_aptitude')],
    ['中距離武器', read(character, 'mid_weapon')],
    ['中距離役割', read(character, 'mid_role')],
    ['中距離ウルト1', read(character, 'mid_ultimate1')],
    ['中距離ウルト', read(character, 'mid_ultimate')],
  ] as const

  const longRows = [
    ['遠距離適正', read(character, 'long_aptitude')],
    ['遠距離武器', read(character, 'long_weapon')],
    ['遠距離役割', read(character, 'long_role')],
    ['遠距離ウルト1', read(character, 'long_ultimate1')],
    ['遠距離ウルト', read(character, 'long_ultimate')],
  ] as const

  const supportRows = [
    ['外野適正', read(character, 'support_aptitude')],
    ['外野武器', read(character, 'support_weapon')],
    ['外野役割', read(character, 'support_role')],
    ['外野ウルト1', read(character, 'support_ultimate1')],
    ['外野ウルト', read(character, 'support_ultimate')],
  ] as const

  const signatureWeapon = read(character, 'signature_weapon')
  const weaponImage = read(character, 'wepon_image') || read(character, 'weapon_image')

  const tags = useMemo(
    () =>
      [
        read(character, 'tags1'),
        read(character, 'tags2'),
        read(character, 'tags3'),
        read(character, 'tags4'),
        read(character, 'tags5'),
        read(character, 'tags6'),
        read(character, 'tags7'),
      ].filter(Boolean),
    [character],
  )

  const randomTags = useMemo(() => {
    const pool = tags.length ? [...tags] : []
    return pool.sort(() => Math.random() - 0.5).slice(0, 3)
  }, [tags])

  const conditionRows = [
    ['来訪条件', read(character, 'spawn_condition')],
    ['親友条件', read(character, 'best_friend_condition')],
    ['恋人ルート', read(character, 'romance_route')],
    ['共通場所', read(character, 'common_area')],
  ] as const

  const [dialogueTab, setDialogueTab] = useState<'daily' | 'season' | 'room' | 'quest' | 'battle' | 'other'>('daily')

  const speechPool = useMemo(() => {
    const columns = [
      ['welcome_line', read(character, 'welcome_line')],
      ['idle_line', read(character, 'idle_line')],
      ['talk_1', read(character, 'talk_1')],
      ['talk_2', read(character, 'talk_2')],
      ['talk_3', read(character, 'talk_3')],
      ['favorites', read(character, 'favorites')],
      ['hates', read(character, 'hates')],
      ['likes_people', read(character, 'likes_people')],
      ['dislikes_people', read(character, 'dislikes_people')],
      ['morning_line', read(character, 'morning_line')],
      ['noon_line', read(character, 'noon_line')],
      ['evening_line', read(character, 'evening_line')],
      ['night_line', read(character, 'night_line')],
      ['spring_line_1', read(character, 'spring_line_1')],
      ['spring_line_2', read(character, 'spring_line_2')],
      ['spring_line_3', read(character, 'spring_line_3')],
      ['summer_line_1', read(character, 'summer_line_1')],
      ['summer_line_2', read(character, 'summer_line_2')],
      ['summer_line_3', read(character, 'summer_line_3')],
      ['autumn_line_1', read(character, 'autumn_line_1')],
      ['autumn_line_2', read(character, 'autumn_line_2')],
      ['autumn_line_3', read(character, 'autumn_line_3')],
      ['winter_line_1', read(character, 'winter_line_1')],
      ['winter_line_2', read(character, 'winter_line_2')],
      ['winter_line_3', read(character, 'winter_line_3')],
      ['call_response', read(character, 'call_response')],
      ['invite_fav', read(character, 'invite_fav')],
      ['invite_neutral', read(character, 'invite_neutral')],
      ['invite_disliked', read(character, 'invite_disliked')],
      ['tap', read(character, 'tap')],
      ['tap_spam', read(character, 'tap_spam')],
      ['idle_30s', read(character, 'idle_30s')],
      ['quest_accepted_1', read(character, 'quest_accepted_1')],
      ['quest_accepted_2', read(character, 'quest_accepted_2')],
      ['quest_complete_1', read(character, 'quest_complete_1')],
      ['quest_complete_2', read(character, 'quest_complete_2')],
      ['quest_failed', read(character, 'quest_failed')],
      ['leader_line', read(character, 'leader_line')],
      ['member_good', read(character, 'member_good')],
      ['member_neutral', read(character, 'member_neutral')],
      ['member_bad', read(character, 'member_bad')],
      ['departure', read(character, 'departure')],
      ['enemy_spotted_1', read(character, 'enemy_spotted_1')],
      ['enemy_spotted_2', read(character, 'enemy_spotted_2')],
      ['boss_encounter', read(character, 'boss_encounter')],
      ['tap_voice_1', read(character, 'tap_voice_1')],
      ['tap_voice_2', read(character, 'tap_voice_2')],
      ['tap_voice_3', read(character, 'tap_voice_3')],
      ['free_talk_1', read(character, 'free_talk_1')],
      ['free_talk_2', read(character, 'free_talk_2')],
      ['free_talk_3', read(character, 'free_talk_3')],
      ['dodge_1', read(character, 'dodge_1')],
      ['dodge_2', read(character, 'dodge_2')],
      ['injured_1', read(character, 'injured_1')],
      ['injured_2', read(character, 'injured_2')],
      ['injured_3', read(character, 'injured_3')],
      ['heavy_hit', read(character, 'heavy_hit')],
      ['critical_hit', read(character, 'critical_hit')],
      ['retreat_1', read(character, 'retreat_1')],
      ['retreat_2', read(character, 'retreat_2')],
      ['revive_1', read(character, 'revive_1')],
      ['revive_2', read(character, 'revive_2')],
      ['ally_down_leader', read(character, 'ally_down_leader')],
      ['ally_down_1', read(character, 'ally_down_1')],
      ['ally_down_2', read(character, 'ally_down_2')],
      ['solo_line', read(character, 'solo_line')],
      ['healed_line', read(character, 'healed_line')],
      ['defeated', read(character, 'defeated')],
      ['buff_1', read(character, 'buff_1')],
      ['buff_2', read(character, 'buff_2')],
      ['debuff_1', read(character, 'debuff_1')],
      ['debuff_2', read(character, 'debuff_2')],
      ['skill_1', read(character, 'skill_1')],
      ['skill_2', read(character, 'skill_2')],
      ['skill_3', read(character, 'skill_3')],
      ['ultimate_charge_alt', read(character, 'ultimate_charge_alt')],
      ['ultimate_charge', read(character, 'ultimate_charge')],
      ['perfect_victory', read(character, 'perfect_victory')],
      ['light_damage', read(character, 'light_damage')],
      ['moderate_damage', read(character, 'moderate_damage')],
      ['close_victory', read(character, 'close_victory')],
      ['retreat', read(character, 'retreat')],
      ['special_victory', read(character, 'special_victory')],
      ['who_are_you', read(character, 'who_are_you')],
      ['first_encounter', read(character, 'first_encounter')],
      ['happy_birthday', read(character, 'happy_birthday')],
    ] as const

    return columns
      .filter(([, value]) => exists(value))
      .map(([key, text]) => ({ key, text }))
  }, [character])

  const allClosed =
    !openPanels.basic &&
    !openPanels.status &&
    !openPanels.statusMore &&
    !openPanels.galleryMore &&
    !openPanels.tags &&
    !openPanels.conditions &&
    !openPanels.dialogue

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setIsScrolled(y > 16)
      setIsAtBottom(max <= 0 ? true : y >= max - 24)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const switchView = (next: 'front' | 'back' | 'private') => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (view === next) return

    const nextTransition =
      view === 'front' && next === 'back'
        ? 'toBack'
        : view === 'back' && next === 'front'
          ? 'toFront'
          : 'toPrivate'

    setTransition(nextTransition)
    timerRef.current = window.setTimeout(() => {
      setView(next)
      setTransition(null)
      timerRef.current = null
    }, 560)
  }

  const handleStandClick = () => {
    if (!allClosed || speechPool.length === 0) return
    setSpeech(randomPick(speechPool))
  }

  const closedGallery = (galleryClosed.length ? galleryClosed : [frontStandImage]).slice(0, 8)
  const openGallery = galleryOpen.length ? galleryOpen : galleryClosed

  const backPortraitStyle: CSSProperties | undefined = backPortrait.reversed
    ? { filter: 'invert(1) hue-rotate(180deg)' }
    : undefined

  return (
    <main
      className="mx-auto min-h-screen max-w-[760px] px-3 pb-32 pt-16"
      style={{
        ...pageStyle,
        background:'var(--bg)',color: 'var(--fg)', isolation: 'isolate'
      }}
    >
      {transition === 'toBack' ? (
          <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            background: color,
            animation: 'dripDown .56s ease-out forwards',
          }}
        />
      ) : null}

      {transition === 'toFront' ? (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            background: colorV,
            clipPath: 'circle(0% at calc(100% - 56px) 90px)',
            animation: 'radialGrow .56s ease-out forwards',
          }}
        />
      ) : null}

      <header
        className={[
          'fixed left-0 right-0 top-0 z-40 border-b border-black/10 transition-all duration-300',
        ].join(' ')}
        style={{ position: 'fixed', left: 0,top: 0, zIndex: 40 ,minHeight:'56px',width:'50%',overflow:'hidden'}}
      >
        <div  className="box-wrap" 
              style={{ position: 'relative', width: '10%', height: '100%' }}  >
        
        <div    className="mx-auto flex max-w-[760px] items-center justify-between px-3 py-3">
          <Link id="top-logo" href="/" className="block text-[color:var(--fg)] cursor-default no-underline"
                style={{ display: 'block', position: 'relative', width:'100%',height:'100%' ,color: 'var(--fg)', textDecoration: 'none' }}
          >
              <MaskIcon src={TITLE_LOGO}
                style={{   width: '112px',   height: '112px', }}
              />
          </Link>

  
        </div>
        </div>
      </header>
      <div id="bottom-images" className="fixed bottom-0 right-0 rflow-visible" style={{ zIndex: '-1' }}>
          <div className="relative overflow-visible">
              <ClickableDiv
                onClick={handleStandClick}
                className="relative overflow-visible rounded-none"
                aria-label="立ち絵を押すとしゃべる"
              >
                <img src={frontStandImage}
                  alt="キャライラスト"
                 className="
                 right-0
                 bottom-0
                 h-screen
                 w-auto
                 object-contain
                 pointer-events-none
                 
                absolute
                  "
                />   
                <div
                  className={[
                    'absolute inset-0 transition-all duration-300',
                    isScrolled ? 'bg-[color:var(--bg)]/10 backdrop-blur-[2px]' : 'bg-transparent',
                  ].join(' ')}
                />
              </ClickableDiv>
          </div>
      </div>

      <div style={{ height: '56px' }}></div>
            ** head end **

        <ClickableDiv
        style={{
    width: 40,
    height: 40,
    display: 'inline-block',
    position: 'fixed',
    right: '0',
    top: '0',
  }}
            onClick={() => switchView(view === 'private' ? 'front' : 'private')}
            className="grid h-7 w-7 place-items-center opacity-25"
            aria-label="プライベートへ"
            
          >
            <MaskIcon src={PRIVATE_BUTTON} style={{
    width: 40,
    height: 40,
    color: 'var(--bg)',
    display: 'inline-block',
    position: 'fixed',
    right: '0',
    top: '0',
  }}
/>
          </ClickableDiv> 
フロント表示
      {view === 'front' ? (
        <div className="grid gap-4">
          <section className="grid gap-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-[44px_1fr_92px] items-start gap-3">
                <ClickableDiv
                   
                  onClick={() => setView('front')}
                  className="relative mt-1 h-11 w-11 shrink-0"
                  aria-label="名前切り替え"
                >
                 
                  <span className="absolute inset-1 grid place-items-center rounded-xl bg-current/10">
                    <MaskIcon src={NAME_CHANGER} 
                    style={{    width: 40,    height: 40,    display: 'inline-block', 
                    }}
/>
                  </span>
                </ClickableDiv>

                <div className="min-w-0">
                  <NameSwap
                    alias={alias}
                    tempSurname={tempSurname}
                    givenName={givenName}
                    tempSurnamePhonetic={tempSurnamePhonetic}
                    givenNamePhonetic={givenNamePhonetic}
                    origin={origin}
                    onToggleView={() => switchView('back')}
                  />
                </div>

                <ClickableDiv
                   id="front-symbol"
                  onClick={() => switchView('back')}
                  className="w-[92px] shrink-0 overflow-hidden"
                  aria-label="表裏切り替え"
                >
                 
                  <MaskIcon 
                   src={frontSymbolImage} style={{
    height: "7em", width: "7em" ,
    color: 'var(--fg)',
    display: 'inline-block',
    right: '0',
    top: '0',
  }}
/> 
                </ClickableDiv>
              </div>

            </div>
          </section>

          <SectionToggle /*第一プロフ*/
            icon="◀"
            side="left"
            open={openPanels.basic}
            onToggle={() => setOpenPanels((s) => ({ ...s, basic: !s.basic }))}
          >
            <section className="grid gap-3">
              {basicRows.map(([label, value]) => (
                <ValueLine key={label} label={label} value={value} />
              ))}
              {basicRows2.map(([label, value]) => (
                <InversePill key={label} label={label} value={value} />
              ))}
            </section>
          </SectionToggle>

          <SectionToggle
            icon="◀"
            side="left"
            open={openPanels.status}
            onToggle={() => setOpenPanels((s) => ({ ...s, status: !s.status }))}
          >
            <section className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-start">
                <div className="grid gap-3 rounded-[24px] bg-white/5 p-3">
                  <RadarChart items={radarItems} />
                </div>

                <div className="grid gap-4 pt-2">
                  {rightBars.map(([label, value]) => (
                    <StatBar key={label} label={label} value={value} />
                  ))}
                  {powerRows.map(([label, value]) => (
                    <ValueLine key={label} label={label} value={value} />
                  ))}
                </div>
              </div>

              <div className="ml-auto grid w-full max-w-[60%] gap-2">
                <ClickableDiv
                   
                  onClick={() => setOpenPanels((s) => ({ ...s, statusMore: !s.statusMore }))}
                  className="flex items-center justify-end gap-2 text-sm font-bold"
                >
                  <span>showmore↴</span>
                </ClickableDiv>

                <div
                  className={[
                    'grid overflow-hidden transition-all duration-500 ease-out',
                    openPanels.statusMore ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  ].join(' ')}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-4 pt-1">
                      <ClickableDiv
                         
                        onClick={() => setOpenPanels((s) => ({ ...s, statusMore: false }))}
                        className="flex items-center justify-center gap-2"
                        aria-label="showmoreを閉じる"
                      >
                        <MaskIcon src={SHOWMORE_UP} style={{
                        width: 40,
                        height: 40,
                        display: 'inline-block',
                       }}
                      />
                      </ClickableDiv>

                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <div className="text-[12px] font-bold tracking-[0.1em]">近距離</div>
                          {meleeRows.map(([label, value]) => (
                            <ValueLine key={label} label={label} value={value} />
                          ))}
                        </div>

                        <div className="grid gap-2">
                          <div className="text-[12px] font-bold tracking-[0.1em]">中距離</div>
                          {midRows.map(([label, value]) => (
                            <ValueLine key={label} label={label} value={value} />
                          ))}
                        </div>

                        <div className="grid gap-2">
                          <div className="text-[12px] font-bold tracking-[0.1em]">遠距離</div>
                          {longRows.map(([label, value]) => (
                            <ValueLine key={label} label={label} value={value} />
                          ))}
                        </div>

                        <div className="grid gap-2">
                          <div className="text-[12px] font-bold tracking-[0.1em]">外野</div>
                          {supportRows.map(([label, value]) => (
                            <ValueLine key={label} label={label} value={value} />
                          ))}
                        </div>

                        <div className="grid gap-2">
                          <div className="text-[12px] font-bold tracking-[0.1em]">武器</div>
                          <ValueLine label="武器種類" value={signatureWeapon} />
                          <div className="flex items-center justify-center">
                            {weaponImage ? (
                              <img
                                src={weaponImage}
                                alt="武器見た目"
                                className="max-h-[180px] object-contain"
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <ClickableDiv
                         
                        onClick={() => setOpenPanels((s) => ({ ...s, statusMore: false }))}
                        className="flex items-center justify-end gap-2"
                        aria-label="showmoreを閉じる"
                      >
                        <MaskIcon src={SHOWMORE_DOWN} style={{
                          width: 40,
                          height: 40,
                          display: 'inline-block',
                       }}
                      />
                      </ClickableDiv>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </SectionToggle>
*****************************************************
          <section className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4" style={{ 
              display: 'grid',
              gridTemplateColumns: '20% 20% 20% 20%',
              gap: '3px',
              width: '50%',
              
            }}
            >
              {closedGallery.map((src, i) => (
                <GalleryTile key={`${src}-${i}`} src={src} />
              ))}
            </div>

            <ClickableDiv
               
              onClick={() => setOpenPanels((s) => ({ ...s, galleryMore: !s.galleryMore }))}
              className="flex items-center justify-end gap-2 text-sm font-bold"
            >
              <span>showmore↴</span>
            </ClickableDiv>

            <div
              className={[
                'grid overflow-hidden transition-all duration-500 ease-out',
                openPanels.galleryMore ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              ].join(' ')}
            >
              <div className="overflow-hidden">
                <div className="grid gap-3 pt-1">
                  <ClickableDiv
                     
                    onClick={() => setOpenPanels((s) => ({ ...s, galleryMore: false }))}
                    className="flex items-center justify-center gap-2"
                    aria-label="ギャラリーを閉じる"
                  >
                    <MaskIcon src={SHOWMORE_UP} style={{
                      width: 40,
                      height: 40,
                      display: 'inline-block',
                    }}
                  />
                  </ClickableDiv>

                  

                  <div className="grid gap-2">
                    <div className="text-[12px] font-bold tracking-[0.1em]">stamp</div>
                  </div>

                  <ClickableDiv
                     
                    onClick={() => setOpenPanels((s) => ({ ...s, galleryMore: false }))}
                    className="flex items-center justify-end gap-2"
                    aria-label="ギャラリーを閉じる"
                  >
                    <MaskIcon src={SHOWMORE_DOWN} style={{
                      width: 40,
                      height: 40,
                      display: 'inline-block',
                    }}
                  />
                  </ClickableDiv>
                </div>
              </div>
            </div>
          </section>

          <SectionToggle
            icon="▶"
            side="right"
            open={openPanels.tags}
            onToggle={() => setOpenPanels((s) => ({ ...s, tags: !s.tags }))}
          >
            <section className="grid gap-2">
              {randomTags.map((tag, i) => (
                <div
                  key={`${tag}-${i}`}
                  className="inline-block w-fit rounded-[14px] bg-[color:var(--fg)] px-3 py-1.5 text-[14px]"
                  style={{
                    color: 'var(--bg)',
                  }}
                >
                  {tag}
                </div>
              ))}
            </section>
          </SectionToggle>

          <SectionToggle
            icon="▶"
            side="right"
            open={openPanels.conditions}
            onToggle={() => setOpenPanels((s) => ({ ...s, conditions: !s.conditions }))}
          >
            <section className="grid gap-3">
              {conditionRows.map(([label, value]) => {
                const text = read({ v: value } as Row, 'v')
                if (!text) return null
                return (
                  <div key={label} className="grid min-h-[48px] grid-cols-[120px_1fr] items-center gap-2">
                    <div className="text-right text-[12px] font-bold tracking-[0.1em]">
                      {label}
                    </div>
                    <div className="justify-self-start rounded-[14px] bg-[color:var(--fg)] px-3 py-2 text-[13px] text-[color:var(--bg)]">
                      {text}
                    </div>
                  </div>
                )
              })}
            </section>
          </SectionToggle>

          <SectionToggle
            icon="◀"
            side="left"
            open={openPanels.dialogue}
            onToggle={() => setOpenPanels((s) => ({ ...s, dialogue: !s.dialogue }))}
          >
          <section className="overflow-x-auto"  style={{ marginRight: '16px' }}>
          <RelatedBubble items={displayCards} />
          </section>
          
            <section className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[132px_1fr] md:items-start">
                <div className="grid gap-2">
                  {[
                    ['daily', '日常'],
                    ['season', '時候'],
                    ['room', '部屋'],
                    ['quest', '依頼'],
                    ['battle', '戦闘'],
                    ['other', 'その他'],
                  ].map(([key, label]) => (
                    <ClickableDiv
                      key={key}
                       
                      onClick={() => setDialogueTab(key as typeof dialogueTab)}
                      className={[
                        'rounded-[14px] px-3 py-2 text-left text-[12px] font-bold transition-colors',
                        dialogueTab === key
                          ? 'bg-[color:var(--fg)] text-[color:var(--bg)]'
                          : 'bg-black/10 text-current',
                      ].join(' ')}
                    >
                      {label}
                    </ClickableDiv>
                  ))}
                </div>

                <div className="grid gap-2">
                  {dialogueTab === 'daily' && (
                    <>
                      <ValueLine label="初対面" value={read(character, 'welcome_line')} />
                      <ValueLine label="放置" value={read(character, 'idle_line')} />
                      <ValueLine label="雑談1" value={read(character, 'talk_1')} />
                      <ValueLine label="雑談2" value={read(character, 'talk_2')} />
                      <ValueLine label="雑談3" value={read(character, 'talk_3')} />
                      <ValueLine label="好き" value={read(character, 'favorites')} />
                      <ValueLine label="嫌い" value={read(character, 'hates')} />
                      <ValueLine label="好意的な人" value={read(character, 'likes_people')} />
                      <ValueLine label="苦手な人" value={read(character, 'dislikes_people')} />
                    </>
                  )}

                  {dialogueTab === 'season' && (
                    <>
                      <ValueLine label="朝" value={read(character, 'morning_line')} />
                      <ValueLine label="昼" value={read(character, 'noon_line')} />
                      <ValueLine label="夕" value={read(character, 'evening_line')} />
                      <ValueLine label="深夜" value={read(character, 'night_line')} />
                      <ValueLine label="春1" value={read(character, 'spring_line_1')} />
                      <ValueLine label="春2" value={read(character, 'spring_line_2')} />
                      <ValueLine label="春3" value={read(character, 'spring_line_3')} />
                      <ValueLine label="夏1" value={read(character, 'summer_line_1')} />
                      <ValueLine label="夏2" value={read(character, 'summer_line_2')} />
                      <ValueLine label="夏3" value={read(character, 'summer_line_3')} />
                      <ValueLine label="秋1" value={read(character, 'autumn_line_1')} />
                      <ValueLine label="秋2" value={read(character, 'autumn_line_2')} />
                      <ValueLine label="秋3" value={read(character, 'autumn_line_3')} />
                      <ValueLine label="冬1" value={read(character, 'winter_line_1')} />
                      <ValueLine label="冬2" value={read(character, 'winter_line_2')} />
                      <ValueLine label="冬3" value={read(character, 'winter_line_3')} />
                    </>
                  )}

                  {dialogueTab === 'room' && (
                    <>
                      <ValueLine label="呼ばれた時" value={read(character, 'call_response')} />
                      <ValueLine label="招待(好き)" value={read(character, 'invite_fav')} />
                      <ValueLine label="招待(普通)" value={read(character, 'invite_neutral')} />
                      <ValueLine label="招待(苦手)" value={read(character, 'invite_disliked')} />
                      <ValueLine label="タップ" value={read(character, 'tap')} />
                      <ValueLine label="連打" value={read(character, 'tap_spam')} />
                      <ValueLine label="放置30秒" value={read(character, 'idle_30s')} />
                    </>
                  )}

                  {dialogueTab === 'quest' && (
                    <>
                      <ValueLine label="依頼受領1" value={read(character, 'quest_accepted_1')} />
                      <ValueLine label="依頼受領2" value={read(character, 'quest_accepted_2')} />
                      <ValueLine label="依頼達成1" value={read(character, 'quest_complete_1')} />
                      <ValueLine label="依頼達成2" value={read(character, 'quest_complete_2')} />
                      <ValueLine label="依頼失敗" value={read(character, 'quest_failed')} />
                    </>
                  )}

                  {dialogueTab === 'battle' && (
                    <>
                      <ValueLine label="隊長" value={read(character, 'leader_line')} />
                      <ValueLine label="組員(良)" value={read(character, 'member_good')} />
                      <ValueLine label="組員(普)" value={read(character, 'member_neutral')} />
                      <ValueLine label="組員(悪)" value={read(character, 'member_bad')} />
                      <ValueLine label="出発" value={read(character, 'departure')} />
                      <ValueLine label="見敵1" value={read(character, 'enemy_spotted_1')} />
                      <ValueLine label="見敵2" value={read(character, 'enemy_spotted_2')} />
                      <ValueLine label="ボス" value={read(character, 'boss_encounter')} />
                      <ValueLine label="タップ1" value={read(character, 'tap_voice_1')} />
                      <ValueLine label="タップ2" value={read(character, 'tap_voice_2')} />
                      <ValueLine label="タップ3" value={read(character, 'tap_voice_3')} />
                      <ValueLine label="自由1" value={read(character, 'free_talk_1')} />
                      <ValueLine label="自由2" value={read(character, 'free_talk_2')} />
                      <ValueLine label="自由3" value={read(character, 'free_talk_3')} />
                      <ValueLine label="回避1" value={read(character, 'dodge_1')} />
                      <ValueLine label="回避2" value={read(character, 'dodge_2')} />
                      <ValueLine label="怪我1" value={read(character, 'injured_1')} />
                      <ValueLine label="怪我2" value={read(character, 'injured_2')} />
                      <ValueLine label="怪我3" value={read(character, 'injured_3')} />
                      <ValueLine label="大ダメ" value={read(character, 'heavy_hit')} />
                      <ValueLine label="会心" value={read(character, 'critical_hit')} />
                      <ValueLine label="撤退1" value={read(character, 'retreat_1')} />
                      <ValueLine label="撤退2" value={read(character, 'retreat_2')} />
                      <ValueLine label="蘇生1" value={read(character, 'revive_1')} />
                      <ValueLine label="蘇生2" value={read(character, 'revive_2')} />
                      <ValueLine label="味方戦闘不能(隊長)" value={read(character, 'ally_down_leader')} />
                      <ValueLine label="味方戦闘不能1" value={read(character, 'ally_down_1')} />
                      <ValueLine label="味方戦闘不能2" value={read(character, 'ally_down_2')} />
                      <ValueLine label="単騎" value={read(character, 'solo_line')} />
                      <ValueLine label="回復" value={read(character, 'healed_line')} />
                      <ValueLine label="戦闘不能" value={read(character, 'defeated')} />
                      <ValueLine label="バフ1" value={read(character, 'buff_1')} />
                      <ValueLine label="バフ2" value={read(character, 'buff_2')} />
                      <ValueLine label="デバフ1" value={read(character, 'debuff_1')} />
                      <ValueLine label="デバフ2" value={read(character, 'debuff_2')} />
                      <ValueLine label="スキル1" value={read(character, 'skill_1')} />
                      <ValueLine label="スキル2" value={read(character, 'skill_2')} />
                      <ValueLine label="スキル3" value={read(character, 'skill_3')} />
                      <ValueLine label="ウルト蓄積1" value={read(character, 'ultimate_charge_alt')} />
                      <ValueLine label="ウルト蓄積" value={read(character, 'ultimate_charge')} />
                      <ValueLine label="完全勝利" value={read(character, 'perfect_victory')} />
                      <ValueLine label="損害軽微" value={read(character, 'light_damage')} />
                      <ValueLine label="損害中" value={read(character, 'moderate_damage')} />
                      <ValueLine label="辛勝" value={read(character, 'close_victory')} />
                      <ValueLine label="撤退" value={read(character, 'retreat')} />
                      <ValueLine label="特殊勝利" value={read(character, 'special_victory')} />
                    </>
                  )}

                  {dialogueTab === 'other' && (
                    <>
                      <ValueLine label="誰" value={read(character, 'who_are_you')} />
                      <ValueLine label="初対面" value={read(character, 'first_encounter')} />
                      <ValueLine label="誕生日" value={read(character, 'happy_birthday')} />
                    </>
                  )}
                </div>
              </div>
            </section>
          </SectionToggle>

<section className="grid gap-3">
</section>

        </div>
      ) : null}
バック表示
      {view === 'back' ? (
        <div className="grid gap-4">
          <section className="grid gap-4">
            <div className="border-b border-[color:var(--line)] pb-3">
              <div className="flex items-start gap-3">
                <ClickableDiv
                   
                  onClick={() => switchView('front')}
                  className="relative mt-1 h-11 w-11 shrink-0"
                  aria-label="表へ戻る"
                >
                   <span className="absolute inset-1 grid place-items-center rounded-xl bg-current/10">
                    <MaskIcon src={NAME_CHANGER} style={{
                      width: 40,
                      height: 40,
                      display: 'inline-block',
                    }}
                  />
                  </span>
                </ClickableDiv>

                <div className="min-w-0 flex-1">
                  <div className="text-[28px] font-black leading-[1.05]">{alias}</div>
                  <div className="text-[11px] leading-5 opacity-75">
                    {surnamePhonetic} {givenNamePhonetic}
                  </div>
                  <div className="text-[12px] leading-5 opacity-85">
                    {surname} {givenName}
                  </div>
                </div>

                <ClickableDiv
                   
                  onClick={() => switchView('front')}
                  className="mt-1 overflow-hidden"
                >
                  <img src={frontSymbolImage} alt="シンボルマーク" style={{ height: "7em", width: "auto" }} />
                </ClickableDiv>
              </div>
            </div>

            {backPortrait.src ? (
              <div className="overflow-hidden rounded-[24px]">
                <img
                  src={backPortrait.src}
                  alt="裏の立ち絵"
                  className="block w-full object-cover"
                  style={backPortraitStyle}
                />
              </div>
            ) : null}

           <div className="grid gap-3">
            {[
                  'sex',
                  'race',
                  'element_affinity',
                  'show_hide',
                  'age_at_death',
                  'intent',
                  'premeditation',
                  'scars',
                ].filter((field) => read(character, field))
              .map((field) => (
                <ValueLine
                  key={field}
                  label={read(ids0Row, field)}
                  value={read(character, field)}
                />
              ))}
            </div>
          </section>

          <div className="grid gap-3">
            <ValueLine label="家族" value={read(character, 'family')} />
            <ValueLine label="背景" value={read(character, 'background')} />
            <ValueLine label="好き" value={read(character, 'likes')} />
            <ValueLine label="嫌い" value={read(character, 'dislikes')} />
            <ValueLine label="動機" value={read(character, 'motive')} />
          </div>
        </div>
      ) : null}
プライベート
      {view === 'private' ? (
        <div className="grid gap-4 bg-white text-black">
          <section className="grid gap-4">
            <div className="border-b border-black/10 pb-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[28px] font-black leading-[1.05]">{alias}</div>
                  <div className="text-[11px] leading-5 opacity-75">
                    {surnamePhonetic} {givenNamePhonetic}
                  </div>
                  <div className="text-[12px] leading-5 opacity-85">
                    {surname} {givenName}
                  </div>
                </div>

                <ClickableDiv
                   
                  onClick={() => switchView('front')}
                  className="mt-1 overflow-hidden"
                >
                  <img src={frontSymbolImage} alt="シンボルマーク" style={{ height: "7em", width: "auto" }} />
                </ClickableDiv>
              </div>
            </div>

            <div className="grid gap-3">
            {[
              'alias',
              'alias_origin',
              'surname',
              'given_name',
              'name_origin',
              'archetype',
              'sync_detail',
              'faction1',
              'core_elements',
              'outfit',
              'memo',
            ]
            .filter((field) => read(character, field))
            .map((field) => (
              <ValueLine
                key={field}
                label={read(ids0Row, field)}
                value={read(character, field)}
              />
            ))}
            </div>

            <div className="rounded-[24px] bg-white p-4 text-black">
              <div className="mb-2 text-[11px] font-bold tracking-[0.12em] opacity-75">
                らふ / image
              </div>
            </div>
          </section>
        </div>
      ) : null}
共通
ボトム
      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
        
        <ClickableDiv           
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--fg)]"
          style={{ color: 'var(--bg)' }}
          aria-label="上へ戻る"
        >
          <MaskIcon src={PAGE_UP} style={{
              fontSize:'40px',
              width:140,    height: 100,
              display: 'inline-block',
              }}
          />
        </ClickableDiv>
      <div id="bottom-images" className="fixed bottom-0 right-0 rflow-visible" style={{ zIndex: '-1' }}>
        {isAtBottom ? (
          <a
            href="#smalltalk"
            style={{ color: 'var(--fg)' }}
            className="inline-flex items-center gap-1 text-[5px] font-bold tracking-[0.08em]"
          >
            <MaskIcon src={KOBANASHI} style={{
            width: '10em', height: 'auto',      color: 'currentColor',

            }}
        />
          </a>
        ) : null}
      </div>
    </div>  

      {speech ? <SpeechBubble source={speech.key} text={speech.text} /> : null}
    </main>
  )
}
