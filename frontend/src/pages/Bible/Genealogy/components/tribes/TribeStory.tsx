import type { ReactNode } from 'react'
import {
  CAMP_SIDE_OF,
  MOTHERS,
  TRIBE_BY_ID,
  TRIBE_CENSUS,
  TRIBE_COLOR,
  splitMeaning,
  tribeBadge,
  type CampSideId,
  type Tribe,
  type TribeId,
} from '../../tribes'
import { RefLink } from '../twelveShared'

// 열두 지파 "이야기 카드" — 지파 색 면(히어로) + 번호 붙은 짧은 장(축복·땅·사람들) + 구속사 + 다음 지파.
// 배치도(모바일 아래 미리보기 / PC 오른쪽 패널)와 모바일 시트가 같은 조각을 쓴다.

const MARCH_REF: Record<CampSideId, string> = {
  east: '민수기 2:9',
  south: '민수기 2:16',
  west: '민수기 2:24',
  north: '민수기 2:31',
}

const CENSUS_VALUES = Object.values(TRIBE_CENSUS).map((c) => c!.count)
const CENSUS_MAX = Math.max(...CENSUS_VALUES)
const CENSUS_MIN = Math.min(...CENSUS_VALUES)

/** 받침 있으면 '과', 없으면 '와' */
const withJosa = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return word + (code >= 0 && code % 28 !== 0 ? '과' : '와')
}

const eyebrowOf = (t: Tribe) => {
  const side = CAMP_SIDE_OF.get(t.id)
  const parts: string[] = []
  if (side) parts.push(`${side.label} 진영${side.members[0] === t.id ? ' 기수' : ''}`)
  else if (t.id === 'levi') parts.push('회막을 섬기는 지파')
  else if (t.id === 'joseph') parts.push('두 지파로 나뉜 이름')
  parts.push(tribeBadge(t))
  if (!t.parent) parts.push(MOTHERS.find((m) => m.id === t.mother)!.name)
  return parts.filter(Boolean).join(' · ')
}

/** 이름 뜻 글자 크기 — "찬송"처럼 짧으면 크게, "억울함을 푸심"처럼 길면 한 줄에 들어가게 */
const wordClass = (word: string, big: boolean) => {
  if (word.length <= 2) return big ? 'text-[64px]' : 'text-[42px]'
  if (word.length <= 4) return big ? 'text-[48px]' : 'text-[34px]'
  return big ? 'text-[36px]' : 'text-[26px]'
}

/** 살짝 어긋나 겹쳐 찍힌 인쇄 느낌의 이름 뜻 */
const PrintedWord = ({ word, big }: { word: string; big: boolean }) => (
  <span className={`relative inline-block whitespace-nowrap font-serif-kr font-bold leading-none tracking-[-0.03em] ${wordClass(word, big)}`}>
    <span aria-hidden="true" className="absolute left-[3px] top-[3px] text-white/30 select-none">
      {word}
    </span>
    <span className="relative">{word}</span>
  </span>
)

/** 진영에서의 자리 — 회막을 가운데 둔 작은 십자 배치, 이 지파 쪽만 흰색 */
const CampLocator = ({ side }: { side: CampSideId | null }) => {
  const spot: Record<CampSideId, [number, number, number, number]> = {
    north: [36, 11, 12, 12],
    south: [36, 61, 12, 12],
    east: [61, 36, 12, 12],
    west: [11, 36, 12, 12],
  }
  return (
    <svg width="72" height="72" viewBox="0 0 84 84" className="shrink-0" aria-hidden="true">
      <rect width="84" height="84" rx="18" fill="rgba(255,255,255,0.12)" />
      <rect x="31" y="31" width="22" height="22" rx="4" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" />
      <path d="M35 46 L35 40 L42 36 L49 40 L49 46" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="24" y="11" width="36" height="12" rx="4" fill="rgba(255,255,255,0.26)" />
      <rect x="24" y="61" width="36" height="12" rx="4" fill="rgba(255,255,255,0.26)" />
      <rect x="11" y="24" width="12" height="36" rx="4" fill="rgba(255,255,255,0.26)" />
      <rect x="61" y="24" width="12" height="36" rx="4" fill="rgba(255,255,255,0.26)" />
      {side && <rect x={spot[side][0]} y={spot[side][1]} width={spot[side][2]} height={spot[side][3]} rx="3" fill="#fff" />}
    </svg>
  )
}

interface Stat {
  label: string
  value: string
  unit?: string
  note: string
  ref: string
}

const statsOf = (t: Tribe): Stat[] => {
  const out: Stat[] = []
  const census = TRIBE_CENSUS[t.id]
  if (census) {
    out.push({
      label: '싸움에 나갈 남자',
      value: census.count.toLocaleString('ko-KR'),
      unit: '명',
      note: census.count === CENSUS_MAX ? '열두 지파 중 가장 많아요' : census.count === CENSUS_MIN ? '열두 지파 중 가장 적어요' : '이십 세 이상',
      ref: census.ref,
    })
  } else if (t.id === 'levi') {
    out.push({ label: '일 개월 이상 남자', value: '22,000', unit: '명', note: '싸움 대신 회막을 섬겨요', ref: '민수기 3:39' })
  }
  const side = CAMP_SIDE_OF.get(t.id)
  if (side) {
    const mates = side.members.filter((m) => m !== t.id).map((m) => TRIBE_BY_ID.get(m)!.name)
    out.push({ label: '행진 순서', value: side.marchLabel, note: `${withJosa(mates.join('·'))} 함께`, ref: MARCH_REF[side.id] })
  } else if (t.id === 'levi') {
    out.push({ label: '행진 순서', value: '한가운데', note: '회막을 메고 진영 사이로', ref: '민수기 2:17' })
  }
  return out
}

interface HeroProps {
  tribe: Tribe
  /** peek — 배치도 아래 미리보기(펼치기 버튼), full — 시트·PC 패널 머리 */
  variant: 'peek' | 'full'
  onOpen?: () => void
  onNavigate?: () => void
}

export const TribeStoryHero = ({ tribe, variant, onOpen, onNavigate }: HeroProps) => {
  const color = TRIBE_COLOR[tribe.id]
  const { word, phrase } = splitMeaning(tribe.meaning)
  const full = variant === 'full'
  const stats = full ? statsOf(tribe) : []
  return (
    <div
      className={`relative overflow-hidden text-white transition-colors duration-300 ${full ? 'px-5 pt-5 pb-5' : 'rounded-[26px] px-[18px] py-4'}`}
      style={{ backgroundColor: color }}
    >
      <div aria-hidden="true" className="absolute -right-16 -top-10 w-60 h-60 rounded-full border-[1.5px] border-white/15" />
      <div aria-hidden="true" className="absolute -right-6 top-0 w-40 h-40 rounded-full border-[1.5px] border-white/10" />

      <p className="relative text-[11.5px] font-bold tracking-[0.08em] text-white/85">{eyebrowOf(tribe)}</p>

      <div className={`relative flex items-start gap-3 ${full ? 'mt-2' : 'mt-1'}`}>
        <div className="min-w-0 flex-1">
          <h3 className={`font-black tracking-[-0.04em] leading-[1.05] ${full ? 'text-[40px]' : 'text-[30px]'}`}>
            {tribe.name}
            <span className="sr-only"> 지파 — 이름의 뜻 {word}</span>
          </h3>
          <div className={full ? 'mt-3' : 'mt-2'} aria-hidden="true">
            <PrintedWord word={word} big={full} />
          </div>
        </div>
        {full && <CampLocator side={CAMP_SIDE_OF.get(tribe.id)?.id ?? null} />}
      </div>

      {full && phrase && (
        <p className="relative mt-3 font-serif-kr text-[15.5px] leading-[1.65] text-white/95 break-keep">
          {phrase} <RefLink refText={tribe.meaningRef} onNavigate={onNavigate} tone="onColor" className="ml-0.5 align-middle" />
        </p>
      )}

      {full ? (
        <p className="relative mt-1.5 text-[15px] font-extrabold break-keep">{tribe.tagline}</p>
      ) : (
        <div className="relative mt-3 flex items-end gap-3">
          <p className="flex-1 min-w-0 text-[14px] leading-[1.45] font-bold break-keep">{tribe.tagline}</p>
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 h-11 px-4 rounded-full bg-white text-[13.5px] font-extrabold inline-flex items-center gap-1 active:scale-[0.97] transition-transform"
            style={{ color }}
          >
            이야기 펼치기
            <span className="material-icons-round" style={{ fontSize: 18 }}>expand_less</span>
          </button>
        </div>
      )}

      {stats.length > 0 && (
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/[0.14] px-3.5 py-3 min-w-0">
              <span className="block text-[11.5px] font-bold text-white/80">{s.label}</span>
              <span className="block mt-0.5 text-[22px] font-black tracking-[-0.02em] leading-tight">
                {s.value}
                {s.unit && <span className="text-[13px] font-bold">{s.unit}</span>}
              </span>
              <span className="block mt-0.5 text-[11px] text-white/80 break-keep">{s.note}</span>
              <RefLink refText={s.ref} onNavigate={onNavigate} tone="onColor" className="mt-0.5" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Chapter = ({ num, title, color, children }: { num: number; title: string; color: string; children: ReactNode }) => (
  <section className="flex gap-3.5">
    <span className="shrink-0 w-[22px] pt-px text-[13px] font-black dark:brightness-[1.9]" style={{ color }}>
      {String(num).padStart(2, '0')}
    </span>
    <div className="min-w-0 flex-1 border-l border-gray-200 dark:border-white/[0.1] pl-3.5">
      <h4 className="text-[12px] font-extrabold tracking-[0.06em] text-gray-500 dark:text-white/50">{title}</h4>
      <div className="mt-1.5">{children}</div>
    </div>
  </section>
)

interface BodyProps {
  tribe: Tribe
  /** 다음에 읽을 지파 — 같은 진영의 다음, 아니면 지금 목록의 다음 */
  next: { tribe: Tribe; label: string } | null
  onSelect: (id: TribeId) => void
  onNavigate?: () => void
}

export const TribeStoryBody = ({ tribe, next, onSelect, onNavigate }: BodyProps) => {
  const color = TRIBE_COLOR[tribe.id]
  const sons = tribe.id === 'joseph' ? (['ephraim', 'manasseh'] as TribeId[]) : null
  const chapters: { title: string; body: ReactNode }[] = []

  const hasBlessing = tribe.jacob || tribe.moses || tribe.id === 'simeon'
  if (hasBlessing) {
    chapters.push({
      title: '축복',
      body: (
        <div className="flex flex-col gap-3.5">
          {tribe.jacob && (
            <div>
              <p className="text-[12px] font-bold text-gray-500 dark:text-white/50">{tribe.parent ? '야곱의 축복 (손자로서)' : '야곱의 축복'}</p>
              <p className="mt-1 font-serif-kr text-[16.5px] leading-[1.65] font-bold text-ink-strong break-keep">{tribe.jacob.summary}</p>
              <RefLink refText={tribe.jacob.ref} onNavigate={onNavigate} />
            </div>
          )}
          {tribe.moses ? (
            <div>
              <p className="text-[12px] font-bold text-gray-500 dark:text-white/50">모세의 축복</p>
              <p className="mt-1 text-[14px] leading-[1.7] text-ink break-keep">{tribe.moses.summary}</p>
              <RefLink refText={tribe.moses.ref} onNavigate={onNavigate} />
            </div>
          ) : (
            tribe.id === 'simeon' && (
              <div>
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/50">모세의 축복</p>
                <p className="mt-1 text-[14px] leading-[1.7] text-gray-500 dark:text-white/55">신명기 33장 모세의 축복에는 시므온의 이름이 나오지 않아요.</p>
              </div>
            )
          )}
        </div>
      ),
    })
  }

  chapters.push({
    title: '받은 땅',
    body: (
      <>
        <p className="text-[14px] leading-[1.7] text-ink break-keep">{tribe.land.summary}</p>
        <RefLink refText={tribe.land.ref} onNavigate={onNavigate} />
        {sons && (
          <div className="mt-2.5 flex gap-2">
            {sons.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="flex-1 h-11 rounded-xl text-white text-[13.5px] font-bold inline-flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
                style={{ backgroundColor: TRIBE_COLOR[id] }}
              >
                {TRIBE_BY_ID.get(id)!.name} 보기
                <span className="material-icons-round" style={{ fontSize: 16 }}>chevron_right</span>
              </button>
            ))}
          </div>
        )}
      </>
    ),
  })

  if (tribe.people.length > 0) {
    chapters.push({
      title: '이 지파에서 난 사람들',
      body: (
        <ul className="flex flex-col gap-2.5">
          {tribe.people.map((p) => (
            <li key={p.name} className="text-[14px] leading-[1.6] break-keep">
              <b className="text-[15.5px] font-black text-ink-strong">{p.name}</b>{' '}
              <span className="text-gray-600 dark:text-white/60">{p.note}</span>
              <RefLink refText={p.ref} onNavigate={onNavigate} className="ml-1 align-middle" />
            </li>
          ))}
        </ul>
      ),
    })
  }

  return (
    <div className="pb-5">
      <div className="px-5 pt-6 flex flex-col gap-6">
        {chapters.map((c, i) => (
          <Chapter key={c.title} num={i + 1} title={c.title} color={color}>
            {c.body}
          </Chapter>
        ))}
      </div>

      {tribe.redemptive && (
        <div className="mx-4 mt-7 rounded-[24px] bg-[#1d1b1c] dark:bg-white/[0.05] dark:border dark:border-white/[0.08] px-5 py-5 text-white">
          <p className="text-[12px] font-extrabold tracking-[0.12em] brightness-[1.9]" style={{ color }}>
            {String(chapters.length + 1).padStart(2, '0')} · 구속사의 흐름에서
          </p>
          <p className="mt-2 font-serif-kr text-[17px] leading-[1.7] font-bold text-white/95 break-keep">{tribe.redemptive.summary}</p>
          <RefLink refText={tribe.redemptive.ref} onNavigate={onNavigate} tone="onColor" className="mt-1.5" />
        </div>
      )}

      {next && (
        <button
          type="button"
          onClick={() => onSelect(next.tribe.id)}
          className="mx-4 mt-3 w-[calc(100%-2rem)] h-[76px] rounded-[22px] text-white text-left flex items-center gap-3 px-5 active:scale-[0.99] transition-transform"
          style={{ backgroundColor: TRIBE_COLOR[next.tribe.id] }}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-bold text-white/80">{next.label}</span>
            <span className="block mt-0.5 text-[18px] font-black truncate">
              {next.tribe.name}{' '}
              <span className="font-serif-kr font-bold text-[15px] text-white/80">{splitMeaning(next.tribe.meaning).word}</span>
            </span>
          </span>
          <span className="material-icons-round" style={{ fontSize: 22 }}>chevron_right</span>
        </button>
      )}
    </div>
  )
}
