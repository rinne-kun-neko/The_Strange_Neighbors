'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

// このファイルでは、DBの1行を「キー名 -> 値」の入れ物として扱う。
// 例: row['alias'] で仮名を読む。
type Row = Record<string, unknown>

type RelatedCard = {
  label: string
  subLabel?: string
  href?: string | null
}

// --------------------------------------------------
// 文字列を安全に読むためのヘルパー
// --------------------------------------------------

// row[key] を文字列として取り出す。
// null / undefined / 空文字は '' にそろえる。
function read(row: Row | null | undefined, key: string) {
  const value = row?.[key]
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

// 値が「入っているか」を判定する。
// 画面上では、空なら ー を出したいので使う。
function exists(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

// --------------------------------------------------
// 表示用の小さな部品
// --------------------------------------------------

function Box({
  label,
  value,
  accent,
  tall = false,
}: {
  label: string
  value?: string | number | null
  accent?: boolean
  tall?: boolean
}) {
  const filled = exists(value)

  return (
    <div
      className={[
        'relative rounded-[24px] border p-4 pt-10',
        accent ? 'border-transparent' : 'border-white/10 bg-white/5 text-white',
        tall ? 'min-h-[116px]' : '',
      ].join(' ')}
      style={
        accent
          ? {
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
            }
          : undefined
      }
    >
      {/* 左上の小さいラベル */}
      <div
        className={[
          'absolute left-3 top-3 rounded-md border px-2 py-1 text-[11px] font-bold tracking-[0.12em]',
          accent
            ? 'border-transparent bg-[var(--accent-ink)] text-[var(--accent)]'
            : 'border-[color:var(--accent)] text-[var(--accent)]',
        ].join(' ')}
      >
        {label}
      </div>

      {/* 中身。改行をそのまま見せる */}
      <div className="whitespace-pre-wrap text-[14px] leading-7">
        {filled ? String(value) : 'ー'}
      </div>
    </div>
  )
}

function ImageFrame({
  src,
  alt,
  tall = false,
  noFrame = false,
  onClick,
}: {
  src: string
  alt: string
  tall?: boolean
  noFrame?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative block w-full overflow-hidden',
        noFrame ? 'rounded-none border-0 bg-transparent p-0' : 'rounded-[24px] border border-white/10 bg-white/5 p-3',
        tall ? 'min-h-[280px]' : 'min-h-[180px]',
      ].join(' ')}
    >
      <img
        src={src}
        alt={alt}
        className={['h-full w-full object-contain', noFrame ? '' : 'rounded-[18px]'].join(' ')}
      />
    </button>
  )
}

// 5段階評価を表示する箱。
// 値が「◎ 〇 △ ✕ 欠落」ならその位置を点灯。
// 数字なら 0〜100 を雑に5段階へ変換する。
function Step5({ value }: { value?: string | number | null }) {
  const marks = ['◎', '〇', '△', '✕', '欠落']
  const text = exists(value) ? String(value) : ''

  const current =
    marks.includes(text)
      ? marks.indexOf(text)
      : Number.isFinite(Number(text))
        ? Math.max(0, Math.min(4, 4 - Math.round(Number(text) / 25)))
        : -1

  return (
    <div className="grid grid-cols-5 gap-1">
      {marks.map((mark, i) => (
        <div
          key={mark}
          className={[
            'grid min-h-9 place-items-center rounded-xl border text-[11px] transition-all duration-300',
            i === current
              ? 'border-transparent bg-[var(--accent)] text-[var(--accent-ink)]'
              : 'border-white/10 bg-white/5 text-white/50',
          ].join(' ')}
        >
          {mark}
        </div>
      ))}
    </div>
  )
}

// 0〜100 の数値を横棒で表示する。
function RangeBar({ value }: { value?: string | number | null }) {
  const n = Number(value)
  const safe = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0

  return (
    <div className="space-y-2">
      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${safe}%`, background: 'var(--accent)' }}
        />
      </div>
      <div className="text-[12px] text-white/70">{exists(value) ? String(value) : 'ー'}</div>
    </div>
  )
}

// 折りたたみ表示のセクション。
// openByDefault=true なら最初から開く。
function ToggleSection({
  label,
  children,
  openByDefault = false,
}: {
  label: string
  children: React.ReactNode
  openByDefault?: boolean
}) {
  const [open, setOpen] = useState(openByDefault)

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold tracking-[0.08em]"
      >
        {/* 開いている時はラベルを消して、矢印だけにする */}
        <span className="text-[var(--accent)]">{open ? '' : label}</span>
        <span className="text-white/75">{open ? '▲' : '▼'}</span>
      </button>

      <div
        className={[
          'grid transition-all duration-500',
          open ? 'grid-rows-[1fr] px-4 pb-4 opacity-100' : 'grid-rows-[0fr] px-4 opacity-0',
        ].join(' ')}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

// --------------------------------------------------
// セリフ表示
// --------------------------------------------------

function DialogueTabs({ character }: { character: Row }) {
  // タブごとに、表示したい key をまとめる。
  const tabs = [
    {
      id: 'daily',
      label: '日常',
      rows: [
        ['初めまして', 'welcome_line'],
        ['放置', 'idle_line'],
        ['雑談1', 'talk_1'],
        ['雑談2', 'talk_2'],
        ['雑談3', 'talk_3'],
        ['favorites', 'favorites'],
        ['hates', 'hates'],
        ['likes_people', 'likes_people'],
        ['dislikes_people', 'dislikes_people'],
      ],
    },
    {
      id: 'season',
      label: '時候',
      rows: [
        ['朝', 'morning_line'],
        ['昼', 'noon_line'],
        ['夕', 'evening_line'],
        ['深夜', 'night_line'],
        ['春1', 'spring_line_1'],
        ['春2', 'spring_line_2'],
        ['春3', 'spring_line_3'],
        ['夏1', 'summer_line_1'],
        ['夏2', 'summer_line_2'],
        ['夏3', 'summer_line_3'],
        ['秋1', 'autumn_line_1'],
        ['秋2', 'autumn_line_2'],
        ['秋3', 'autumn_line_3'],
        ['冬1', 'winter_line_1'],
        ['冬2', 'winter_line_2'],
        ['冬3', 'winter_line_3'],
      ],
    },
    {
      id: 'room',
      label: '部屋',
      rows: [
        ['呼ばれた', 'call_response'],
        ['招待(好み)', 'invite_fav'],
        ['招待(普通)', 'invite_neutral'],
        ['招待(苦手)', 'invite_disliked'],
        ['tap', 'tap'],
        ['つつきすぎ', 'tap_spam'],
        ['放置(30秒)', 'idle_30s'],
      ],
    },
    {
      id: 'quest',
      label: '依頼',
      rows: [
        ['受領1', 'quest_accepted_1'],
        ['受領2', 'quest_accepted_2'],
        ['達成1', 'quest_complete_1'],
        ['達成2', 'quest_complete_2'],
        ['失敗', 'quest_failed'],
      ],
    },
    {
      id: 'battle',
      label: '戦闘',
      rows: [
        ['隊長', 'leader_line'],
        ['組員(適正)', 'member_good'],
        ['組員(普通)', 'member_neutral'],
        ['組員(悪い)', 'member_bad'],
        ['出発', 'departure'],
        ['見敵1', 'enemy_spotted_1'],
        ['見敵2', 'enemy_spotted_2'],
        ['ボス', 'boss_encounter'],
        ['tap1', 'tap_voice_1'],
        ['tap2', 'tap_voice_2'],
        ['tap3', 'tap_voice_3'],
        ['free1', 'free_talk_1'],
        ['free2', 'free_talk_2'],
        ['free3', 'free_talk_3'],
        ['回避1', 'dodge_1'],
        ['回避2', 'dodge_2'],
        ['怪我1', 'injured_1'],
        ['怪我2', 'injured_2'],
        ['怪我3', 'injured_3'],
        ['重傷', 'heavy_hit'],
        ['クリティカル', 'critical_hit'],
        ['撤退1', 'retreat_1'],
        ['撤退2', 'retreat_2'],
        ['蘇生1', 'revive_1'],
        ['蘇生2', 'revive_2'],
        ['味方戦闘不能時(隊長)', 'ally_down_leader'],
        ['味方戦闘不能時1', 'ally_down_1'],
        ['味方戦闘不能時2', 'ally_down_2'],
        ['単騎', 'solo_line'],
        ['回復される', 'healed_line'],
        ['戦闘不能', 'defeated'],
        ['バフ1', 'buff_1'],
        ['バフ2', 'buff_2'],
        ['デバフ1', 'debuff_1'],
        ['デバフ2', 'debuff_2'],
        ['スキル1', 'skill_1'],
        ['スキル2', 'skill_2'],
        ['スキル3', 'skill_3'],
        ['ウルトチャージ2', 'ultimate_charge_alt'],
        ['ウルトチャージ', 'ultimate_charge'],
        ['完全勝利', 'perfect_victory'],
        ['損害軽微', 'light_damage'],
        ['損害多少', 'moderate_damage'],
        ['辛勝', 'close_victory'],
        ['撤退', 'retreat'],
        ['特殊勝利', 'special_victory'],
      ],
    },
    {
      id: 'other',
      label: 'その他',
      rows: [
        ['何者ですか？', 'who_are_you'],
        ['初対面', 'first_encounter'],
        ['ハピバ', 'happy_birthday'],
      ],
    },
  ] as const

  const [current, setCurrent] = useState<(typeof tabs)[number]['id']>('daily')

  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 md:grid-cols-[136px_1fr]">
      {/* 左側のタブボタン */}
      <div className="grid gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrent(tab.id)}
            className={[
              'rounded-2xl border px-3 py-2 text-left text-sm font-bold transition-colors',
              current === tab.id
                ? 'border-transparent bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'border-white/10 bg-black/15 text-white/80',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 右側の本文 */}
      <div className="min-h-[240px] rounded-[20px] border border-white/10 bg-black/15 p-3">
        <div className="grid gap-2">
          {tabs
            .find((tab) => tab.id === current)
            ?.rows.map(([label, key]) => {
              const value = read(character, key)
              if (!value) return null

              return (
                <div
                  key={label}
                  className="grid grid-cols-[88px_1fr] gap-3 rounded-2xl border border-white/10 bg-black/15 p-3"
                >
                  <div className="text-[12px] font-bold tracking-[0.08em] text-[var(--accent)]">
                    {label}
                  </div>
                  <div className="whitespace-pre-wrap text-[14px] leading-7">{value}</div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

// まだ未実装の小話枠。
// ここは後で「タップしたらランダム表示」などにしてもよい。
function SmallTalkStub() {
  return (
    <section id="smalltalk" className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="text-[12px] font-bold tracking-[0.08em] text-[var(--accent)]">小話</div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/80">tap to 小話</div>
    </section>
  )
}

// --------------------------------------------------
// メインのページ
// --------------------------------------------------

export default function CharacterPageClient({
  slug,
  character,
  accent,
  standImage,
  symbolImage,
  pickedTags,
  relationCards,
  galleryClosed,
  galleryOpen,
}: {
  slug: string
  character: Row
  accent: string
  standImage: string
  symbolImage: string
  pickedTags: string[]
  relationCards: RelatedCard[]
  galleryClosed: string[]
  galleryOpen: string[]
}) {
  // どの面を見せるか
  const [view, setView] = useState<'front' | 'back' | 'private'>('front')

  // 仮名と別名を切り替える用
  const [nameSwap, setNameSwap] = useState(false)

  // CSS変数をこのページだけに差し込む。
  const style = useMemo(
    () =>
      ({
        '--accent': accent,
        '--accent-ink': '#05070c',
      }) as React.CSSProperties,
    [accent],
  )

  // --------------------------------------------------
  // 基本情報の取り出し
  // --------------------------------------------------

  const alias = read(character, 'alias')
  const aliasAlt = read(character, 'alias_alt')
  const tempSurname = read(character, 'temp_surname')
  const tempGiven = read(character, 'given_name')
  const surname = read(character, 'surname')
  const givenName = read(character, 'given_name')
  const surnamePhonetic = read(character, 'surname_phonetic') || read(character, 'temp_surname_phonetic')
  const givenPhonetic = read(character, 'given_name_phonetic')
  const sex = read(character, 'sex')
  const race = read(character, 'race')
  const raceImage = read(character, 'race_image')
  const standColorImage = read(character, 'stand_color_image') || standImage
  const symbol = read(character, 'symbol_image') || symbolImage
  const noImage = 'NoImage'

  // ギャラリーは、枠の数を固定したいので closed 側は 8 枚にそろえる。
  const galleryClosedCards = Array.from({ length: 8 }).map((_, i) => galleryClosed[i] || '')
  const galleryOpenCards = galleryOpen.length ? galleryOpen : []

  // --------------------------------------------------
  // 表示用の配列をまとめる
  // --------------------------------------------------
  // ここは「同じ形の Box をたくさん並べる」ための準備。
  // 1行ずつ手で書くと長くなるので、配列にして map している。

  const basicFields: Array<[string, string]> = [
    ['年齢', read(character, 'prime_age')],
    ['身長', read(character, 'height')],
    ['誕生日(月)', read(character, 'birth_month')],
    ['誕生日(日)', read(character, 'birth_day')],
    ['利き手', read(character, 'dominant_hand')],
    ['係', read(character, 'club_order')],
    ['一人称', read(character, 'first_person_pronoun')],
    ['二人称', read(character, 'second_person_pronoun')],
    ['三人称', read(character, 'third_person_pronoun')],
  ]

  const stat5Fields: Array<[string, string]> = [
    ['ATK', read(character, 'atk')],
    ['DEF', read(character, 'def')],
    ['STR', read(character, 'str')],
    ['HP', read(character, 'hp')],
    ['STAMINA', read(character, 'stamina')],
    ['MP', read(character, 'mp')],
    ['DEX/EVA', read(character, 'dex_evasion')],
    ['ATK SPD', read(character, 'attack_speed')],
  ]

  const numberBars: Array<[string, string]> = [
    ['SAN', read(character, 'san')],
    ['穢れ耐性', read(character, 'corruption_resist')],
    ['外見', read(character, 'appearance')],
    ['コミュ力', read(character, 'social_skill')],
  ]

  const frontBoxes: Array<[string, string]> = [
    ['性格', read(character, 'personality')],
    ['ギャップ', read(character, 'hidden_side')],
    ['快楽のきっかけ', read(character, 'pleasure_trigger')],
    ['癖', read(character, 'quirks')],
    ['後ろめたい癖', read(character, 'guilty_habit')],
    ['自己評価', read(character, 'self_rating')],
    ['他者評価', read(character, 'reputation')],
    ['服装', read(character, 'outfit')],
  ]

  const backBoxes: Array<[string, string]> = [
    ['表示/非表示', read(character, 'show_hide')],
    ['享年', read(character, 'age_at_death')],
    ['殺意', read(character, 'intent')],
    ['計画性', read(character, 'premeditation')],
    ['死因', read(character, 'cause_of_death')],
    ['原因', read(character, 'reason')],
    ['凶器', read(character, 'weapon_used')],
    ['犯人', read(character, 'killer')],
    ['動機', read(character, 'motive')],
    ['死の自覚', read(character, 'awareness_of_death')],
    ['現状認識', read(character, 'mood')],
    ['傷跡', read(character, 'scars')],
  ]

  const familyStages: Array<[string, string]> = [
    ['生まれる前', read(character, 'before_birth')],
    ['乳児期', read(character, 'infancy')],
    ['幼児期前期', read(character, 'early_childhood')],
    ['幼児期後期', read(character, 'late_childhood')],
    ['学童期', read(character, 'school_age')],
    ['思春期', read(character, 'adolescence')],
    ['青年期', read(character, 'youth')],
    ['成人期', read(character, 'young_adult')],
    ['熟年期', read(character, 'mature_adult')],
    ['中年期', read(character, 'middle_age')],
    ['壮年期', read(character, 'late_middle_age')],
    ['老年期', read(character, 'elderly')],
    ['後期高齢', read(character, 'advanced_age')],
  ]

  const likesBoxes: Array<[string, string]> = [
    ['好き', read(character, 'likes')],
    ['嫌い', read(character, 'dislikes')],
    ['理想の相手', read(character, 'ideal_type')],
    ['好きな理由', read(character, 'reason_like')],
    ['苦手な相手', read(character, 'disliked_type')],
    ['苦手な理由', read(character, 'reason_dislike')],
    ['趣味', read(character, 'hobbies')],
    ['悦を感じる事象', read(character, 'pleasure_trigger')],
    ['悪癖', read(character, 'quirks')],
    ['後ろめたい癖', read(character, 'guilty_habit')],
    ['過剰', read(character, 'excess')],
    ['不足', read(character, 'lacking')],
    ['悪い点', read(character, 'bad_point')],
  ]

  // private 面だけに出す情報
  const privateBoxes: Array<[string, string]> = [
    ['仮名', alias],
    ['仮名の由来', read(character, 'alias_origin')],
    ['苗字ふりがな', surnamePhonetic],
    ['名前ふりがな', givenPhonetic],
    ['苗字', surname],
    ['名前', givenName],
    ['名前の由来', read(character, 'name_origin')],
    ['元ネタ', read(character, 'source_origin')],
    ['元設定', read(character, 'archetype')],
    ['同期詳細', read(character, 'sync_detail')],
    ['所属', read(character, 'faction1')],
    ['構成要素', read(character, 'core_elements')],
    ['服装メモ', read(character, 'outfit')],
    ['メモ', read(character, 'memo')],
  ]

  return (
    <main className="relative mx-auto min-h-screen max-w-[640px] px-3 pb-10 pt-20 text-white" style={style}>
      {/* --------------------------------------------------
          上の固定ヘッダー
          - 左: トップへ戻るリンク
          - 右: private 表示へ切り替えるボタン
      -------------------------------------------------- */}
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-white/10 bg-[#05070ce6] backdrop-blur-md">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-3 py-3">
          <Link href="/" className="text-sm font-bold tracking-[0.12em] text-white">
            タイトルロゴ
          </Link>

          <button
            type="button"
            onClick={() => setView((v) => (v === 'private' ? 'front' : 'private'))}
            className="grid h-7 w-7 place-items-center opacity-35"
            aria-label="プライベート"
            style={{
              background: 'var(--accent)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            }}
          />
        </div>
      </header>

      {/* --------------------------------------------------
          front 面
          ふつうに見せるページ。
          ここにキャラの見た目・基本情報・セリフなどを並べる。
      -------------------------------------------------- */}
      {view === 'front' && (
        <div className="grid gap-4">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="relative min-h-[66px] overflow-hidden">
                  {/* 仮名の切り替えアニメーション */}
                  <div
                    className={[
                      'text-[28px] font-black leading-[1.05] tracking-[0.02em] transition-all duration-500',
                      nameSwap ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100',
                    ].join(' ')}
                  >
                    {alias}
                  </div>

                  {aliasAlt ? (
                    <div
                      className={[
                        'absolute inset-x-0 top-[-56px] text-[28px] font-black leading-[1.05] tracking-[0.02em] transition-all duration-500',
                        nameSwap ? 'top-0 opacity-100' : 'opacity-0',
                      ].join(' ')}
                    >
                      {aliasAlt}
                    </div>
                  ) : null}
                </div>

                <div className="mt-1 text-[12px] text-white/70">{`${tempSurname} ${tempGiven}`.trim()}</div>
              </div>

              {aliasAlt ? (
                <button
                  type="button"
                  onClick={() => setNameSwap((v) => !v)}
                  className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-base font-bold text-[var(--accent)]"
                  aria-label="名前切り替え"
                >
                  <span className="absolute left-1 top-1 text-[10px]">↘</span>
                  <span className="absolute bottom-1 right-1 text-[10px]">↖</span>
                  <span>↻</span>
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.82fr]">
              {/* 立ち絵を押すと裏面へ移動 */}
              <ImageFrame src={standColorImage} alt="キャライラスト" tall noFrame onClick={() => setView('back')} />

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setView('back')}
                  className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-0"
                >
                  <img src={symbol} alt="シンボル" className="h-[180px] w-full object-contain" />
                </button>

                <Box label="仮苗字 / 名前の元" value={read(character, 'alias_origin')} />
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <Box label="性別" value={sex} accent />
            <Box label="種族" value={race} accent />
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            {basicFields.map(([label, value]) => (
              <Box key={label} label={label} value={value} />
            ))}
          </section>

          <section className="grid gap-3">
            {frontBoxes.map(([label, value]) => (
              <Box key={label} label={label} value={value} />
            ))}
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-bold tracking-[0.08em] text-[var(--accent)]">ステータス</div>

            <div className="grid gap-3">
              {stat5Fields.map(([label, value]) => (
                <div key={label} className="grid gap-2">
                  <div className="text-[12px] font-bold tracking-[0.08em] text-white/70">{label}</div>
                  <Step5 value={value} />
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4">
              {numberBars.map(([label, value]) => (
                <div key={label} className="grid gap-2">
                  <div className="text-[12px] font-bold tracking-[0.08em] text-white/70">{label}</div>
                  <RangeBar value={value} />
                </div>
              ))}
            </div>

            <ToggleSection label="showmore" openByDefault={false}>
              <div className="mt-3 grid gap-3">
                <Box label="physical_power" value={read(character, 'physical_power')} />
                <Box label="arcane_power" value={read(character, 'arcane_power')} />
                <Box label="近距離適正" value={read(character, 'melee_aptitude')} />
                <Box label="近距離武器" value={read(character, 'melee_weapon')} />
                <Box label="近距離役割" value={read(character, 'melee_role')} />
                <Box label="近距離ウルト名" value={read(character, 'melee_ultimate1')} />
                <Box label="近距離ウルト" value={read(character, 'melee_ultimate')} />
                <Box label="中距離適正" value={read(character, 'mid_aptitude')} />
                <Box label="中距離武器" value={read(character, 'mid_weapon')} />
                <Box label="中距離役割" value={read(character, 'mid_role')} />
                <Box label="中距離ウルト名" value={read(character, 'mid_ultimate1')} />
                <Box label="中距離ウルト" value={read(character, 'mid_ultimate')} />
                <Box label="遠距離適正" value={read(character, 'long_aptitude')} />
                <Box label="遠距離武器" value={read(character, 'long_weapon')} />
                <Box label="遠距離役割" value={read(character, 'long_role')} />
                <Box label="遠距離ウルト名" value={read(character, 'long_ultimate1')} />
                <Box label="遠距離ウルト" value={read(character, 'long_ultimate')} />
                <Box label="外野適正" value={read(character, 'support_aptitude')} />
                <Box label="外野武器" value={read(character, 'support_weapon')} />
                <Box label="外野役割" value={read(character, 'support_role')} />
                <Box label="外野ウルト名" value={read(character, 'support_ultimate1')} />
                <Box label="外野ウルト" value={read(character, 'support_ultimate')} />
              </div>
            </ToggleSection>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-bold tracking-[0.08em] text-[var(--accent)]">ギャラリー</div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {galleryClosedCards.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-[18px] border border-white/10 bg-black/15">
                  {src ? (
                    <img src={src} alt={`gallery-${i + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-white/60">{noImage}</div>
                  )}
                </div>
              ))}
            </div>

            <ToggleSection label="showmore" openByDefault={false}>
              <div className="mt-3 columns-2 gap-3 md:columns-3">
                {galleryOpenCards.map((src, i) => (
                  <div key={i} className="mb-3 break-inside-avoid overflow-hidden rounded-[18px] border border-white/10 bg-black/15">
                    <img src={src} alt={`gallery-open-${i + 1}`} className="h-auto w-full object-cover" />
                  </div>
                ))}
              </div>
            </ToggleSection>
          </section>

          <section className="grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-bold tracking-[0.08em] text-[var(--accent)]">tags</div>
            <div className="flex flex-wrap gap-2">
              {pickedTags.length ? (
                pickedTags.map((tag) => (
                  <div key={tag} className="rounded-full border border-white/10 bg-black/15 px-4 py-2 text-xs text-white/80">
                    {tag}
                  </div>
                ))
              ) : (
                <div className="rounded-full border border-white/10 bg-black/15 px-4 py-2 text-xs text-white/60">ー</div>
              )}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              {relationCards.map((item, i) =>
                item.href ? (
                  <Link
                    key={i}
                    href={item.href}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{item.label}</div>
                      {item.subLabel ? <div className="truncate text-xs text-white/60">{item.subLabel}</div> : null}
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-white/70">↗</div>
                  </Link>
                ) : (
                  <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{item.label}</div>
                      {item.subLabel ? <div className="truncate text-xs text-white/60">{item.subLabel}</div> : null}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-bold tracking-[0.08em] text-[var(--accent)]">せりふ</div>
            <DialogueTabs character={character} />
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-bold tracking-[0.08em] text-[var(--accent)]">tap to 小話</div>
            <SmallTalkStub />
          </section>
        </div>
      )}

      {/* --------------------------------------------------
          back 面
          裏設定・死亡情報・背景情報を並べる。
      -------------------------------------------------- */}
      {view === 'back' && (
        <div className="grid gap-4">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-[28px] font-black leading-[1.05] tracking-[0.02em]">{alias}</div>
                <div className="mt-1 text-[12px] text-white/70">{`${surnamePhonetic} ${givenPhonetic}`.trim()}</div>
                <div className="mt-1 text-[12px] text-white/70">{`${surname} ${givenName}`.trim()}</div>
              </div>

              <button
                type="button"
                onClick={() => setView('front')}
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-base font-bold text-[var(--accent)]"
                aria-label="表へ戻る"
              >
                <span className="absolute left-1 top-1 text-[10px]">↘</span>
                <span className="absolute bottom-1 right-1 text-[10px]">↖</span>
                <span>↻</span>
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-3">
                <Box label="性別" value={sex} accent />
                <Box label="種族" value={race} accent />
                <Box label="element_affinity" value={read(character, 'element_affinity')} />
                <Box label="表示/非表示" value={read(character, 'show_hide')} />
                <Box label="享年" value={read(character, 'age_at_death')} />
                <Box label="殺意" value={read(character, 'intent')} />
                <Box label="計画性" value={read(character, 'premeditation')} />
              </div>

              <div className="grid gap-3">
                <ImageFrame src={raceImage || standImage} alt="race image" tall noFrame />
                <ImageFrame src={symbol} alt="symbol" noFrame onClick={() => setView('front')} />
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            {backBoxes.map(([label, value]) => (
              <Box key={label} label={label} value={value} />
            ))}

            <Box label="cause_of_death" value={read(character, 'cause_of_death')} />
            <Box label="reason" value={read(character, 'reason')} />
            <Box label="weapon_used" value={read(character, 'weapon_used')} />
            <Box label="killer" value={read(character, 'killer')} />
            <Box label="motive" value={read(character, 'motive')} tall />
            <Box label="awareness_of_death" value={read(character, 'awareness_of_death')} />
            <Box label="mood" value={read(character, 'mood')} />
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-bold tracking-[0.08em] text-[var(--accent)]">family / background</div>

            <Box label="family" value={read(character, 'family')} />
            <Box label="background" value={read(character, 'background')} />
            <ToggleSection label="showmore" openByDefault={false}>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {familyStages.map(([label, value]) => (
                  <Box key={label} label={label} value={value} />
                ))}
              </div>
            </ToggleSection>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-bold tracking-[0.08em] text-[var(--accent)]">likes / dislikes</div>

            <Box label="likes" value={read(character, 'likes')} />
            <Box label="dislikes" value={read(character, 'dislikes')} />

            <ToggleSection label="showmore" openByDefault={false}>
              <div className="mt-3 grid gap-3">
                {likesBoxes.map(([label, value]) => (
                  <Box key={label} label={label} value={value} />
                ))}
              </div>
            </ToggleSection>
          </section>
        </div>
      )}

      {/* --------------------------------------------------
          private 面
          制作メモや元ネタなど、公開しない情報を出す。
      -------------------------------------------------- */}
      {view === 'private' && (
        <div className="grid gap-4">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-[28px] font-black leading-[1.05] tracking-[0.02em]">{alias}</div>
                <div className="mt-1 text-[12px] text-white/70">{`${surnamePhonetic} ${givenPhonetic}`.trim()}</div>
              </div>

              <button
                type="button"
                onClick={() => setView('front')}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-base font-bold text-[var(--accent)]"
                aria-label="戻る"
              >
                ▲
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-3">
                {privateBoxes.map(([label, value]) => (
                  <Box key={label} label={label} value={value} />
                ))}
              </div>

              <div className="grid gap-3">
                <Box label="モチーフ" value={read(character, 'archetype')} />
                <Box label="同期詳細" value={read(character, 'sync_detail')} />
                <Box label="所属" value={read(character, 'faction1')} />
                <Box label="構成要素" value={read(character, 'core_elements')} />
                <Box label="服装" value={read(character, 'outfit')} />
                <Box label="メモ" value={read(character, 'memo')} tall />
                <ImageFrame src={read(character, 'rough_image') || standImage} alt="rough" noFrame />
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
