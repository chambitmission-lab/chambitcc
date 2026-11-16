// /ministry(목양칼럼) 전면 개편 시안 — 2차: A(목회서신 매거진) 계열 표지 비교
// /#/dev/ministry-redesign?v=a1|a2|a3|a4  (a0 = 1차 A 원안)
// 표본은 운영 칼럼 최근 14편 스냅샷(ministrySample.json). 백엔드·로그인 없이 본다.
// 공통: 아래 '지난 호' 목차는 1차 A 그대로(사용자 OK). 표지 배경은 /visit 의 계절 교회 사진
//  (scene-{계절}-{day|night}.webp, 2172px) — 편지 날짜의 계절을 따라가고 다크에선 밤 사진.
//  A1 가을 하늘 표지 — 풀블리드 + 단풍잎이 천천히 떨어짐
//  A2 편지 도착 표지 — 하늘 위에 편지지가 놓이고 소인 도장·서명이 한 번 찍힘
//  A3 아치 창 표지 — 세로쓰기 '목회서신' + 교회 창 모양으로 오린 사진
//  A4 주보 1면 — 신문 마스트헤드·사진 캡션·두 단 본문

import { useRef, useState, type RefObject } from 'react'
import { useSearchParams } from 'react-router-dom'
import sample from './ministrySample.json'
import { SERIF, PEN } from '../Ministry/letterFormat'
import LetterSeasonFx from '../Ministry/LetterSeasonFx'
import churchDayTall from '../../assets/hero/church-autumn-day.webp'
import pastorAvatar from '../../assets/andong.webp'
import signature from '../../assets/signature-andongcheol.png'

interface Col {
  id: number
  date: string
  title: string
  excerpt: string
  paras: string[]
  quote: string | null
  minutes: number
  amen: number
  image: string | null
}

const cols = sample.columns as Col[]
const TOTAL = sample.total
const latest = cols[0]
const rest = cols.slice(1)

const SEASON: Record<number, string> = { 39: '추수감사주일', 38: '창립 32주년', 37: '성찬 주일', 33: 'ICRC 대회' }
const issueNo = (i: number) => TOTAL - i

const ymd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}
const longDate = (s: string) => {
  const x = ymd(s)
  return `${x.y}년 ${x.m}월 ${x.d}일 주일`
}
type Season = 'spring' | 'summer' | 'autumn' | 'winter'
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
const seasonOf = (s: string): Season => {
  const m = ymd(s).m
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'
}
const SEASON_KO = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' } as const
const season = seasonOf(latest.date)
const { y: Y, m: M, d: D } = ymd(latest.date)

// 계절 미리보기용 소인 — 실제 적용 땐 편지 날짜·절기에서 그대로 나온다
const SEASON_STAMP: Record<Season, { label: string; date: string }> = {
  spring: { label: '부활주일', date: '2026-04-05' },
  summer: { label: '맥추감사주일', date: '2026-07-05' },
  autumn: { label: SEASON[latest.id] ?? '주일', date: latest.date },
  winter: { label: '성탄주일', date: '2026-12-20' },
}
const SEASON_FX_NAME: Record<Season, string> = {
  spring: '벚꽃잎',
  summer: '초록잎 · 밤엔 반딧불',
  autumn: '단풍잎',
  winter: '함박눈',
}

/* ─────────────────────────── 움직임(CSS) ─────────────────────────── */
// 반복 움직임은 단풍잎 하나뿐(작고 느리게, 표지 안에서만). 나머지는 들어올 때 한 번.
// 동작 줄이기 설정이면 전부 멈춘다.
const MOTION_CSS = `
@keyframes mr-fall { 0% { transform: translate3d(0,-40px,0) rotate(0deg); opacity:0 }
  10% { opacity:.95 } 50% { transform: translate3d(-60px,calc(var(--mr-h,560px) / 2),0) rotate(160deg) }
  90% { opacity:.9 } 100% { transform: translate3d(-140px,var(--mr-h,560px),0) rotate(320deg); opacity:0 } }
@keyframes mr-sway { 0%,100% { margin-left:0 } 50% { margin-left:26px } }
@keyframes mr-rise { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform:none } }
@keyframes mr-stamp { 0% { opacity:0; transform: scale(1.8) rotate(-24deg) } 60% { opacity:1; transform: scale(.94) rotate(-10deg) } 100% { opacity:1; transform: scale(1) rotate(-12deg) } }
@keyframes mr-sign { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes mr-sun { from { opacity:0 } to { opacity:1 } }
@keyframes mr-letter { from { opacity:0; transform: translateY(60px) rotate(-1.5deg) } to { opacity:1; transform: rotate(-1deg) } }
.mr-leaf { position:absolute; top:0; animation: mr-fall var(--mr-dur) linear var(--mr-delay) infinite both; will-change: transform }
.mr-leaf > i { display:block; animation: mr-sway 3.6s ease-in-out infinite }
.mr-rise { animation: mr-rise .9s cubic-bezier(.2,.7,.2,1) both }
.mr-stamp { animation: mr-stamp .7s cubic-bezier(.3,1.4,.5,1) 1.1s both }
.mr-sign { animation: mr-sign 1.6s ease-out 1.6s both }
.mr-sun { animation: mr-sun 2.4s ease-out .2s both }
.mr-letter { animation: mr-letter 1s cubic-bezier(.2,.7,.2,1) .35s both }
@media (min-width: 1024px) { .mr-letter-tilt { transform: rotate(-1deg) } }
@media (prefers-reduced-motion: reduce) {
  .mr-leaf { display:none } .mr-rise,.mr-stamp,.mr-sign,.mr-sun,.mr-letter { animation:none }
}
`

const LEAF_COLORS = ['#e2672a', '#d9481f', '#f0a12b', '#c8361b', '#e8892c']
// 오른쪽 위 단풍나무 근처에서 떨어지게 — 위치·속도는 고정 표본(무작위면 새로고침마다 달라 비교가 어렵다)
const LEAVES = [
  { x: 88, s: 16, dur: 13, delay: 0 },
  { x: 95, s: 12, dur: 16, delay: 3 },
  { x: 80, s: 14, dur: 14, delay: 6.5 },
  { x: 92, s: 18, dur: 18, delay: 9 },
  { x: 72, s: 11, dur: 15, delay: 11.5 },
  { x: 98, s: 13, dur: 17, delay: 4.5 },
  { x: 64, s: 10, dur: 19, delay: 13.5 },
]

const Leaves = ({ height = 560, spread = 1 }: { height?: number; spread?: number }) => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ ['--mr-h' as string]: `${height}px` }}>
    {LEAVES.map((l, i) => (
      <span
        key={i}
        className="mr-leaf"
        style={{
          left: `${Math.max(4, 100 - (100 - l.x) * spread)}%`,
          ['--mr-dur' as string]: `${l.dur}s`,
          ['--mr-delay' as string]: `${l.delay}s`,
        }}
      >
        <i>
          <svg width={l.s} height={l.s} viewBox="0 0 24 24">
            <path
              d="M12 1c1 3 3 4 5 4-1 2-1 3 1 5-2 0-3 1-3 3-2-1-3-1-3 1v9h-.4v-9c0-2-1-2-3-1 0-2-1-3-3-3 2-2 2-3 1-5 2 0 4-1 5.4-4z"
              fill={LEAF_COLORS[i % LEAF_COLORS.length]}
              opacity=".92"
            />
          </svg>
        </i>
      </span>
    ))}
  </div>
)

/** 계절 교회 사진 — 라이트 낮 / 다크 밤 */
const Scene = ({ pos = '78% 50%', s = season }: { pos?: string; s?: Season }) => (
  <>
    <img src={`/images/visit/scene-${s}-day.webp`} alt="" className="absolute inset-0 w-full h-full object-cover dark:hidden" style={{ objectPosition: pos }} />
    <img src={`/images/visit/scene-${s}-night.webp`} alt="" className="absolute inset-0 w-full h-full object-cover hidden dark:block" style={{ objectPosition: pos }} />
  </>
)

// 계절 입자는 실제 화면과 같은 컴포넌트를 쓴다
const SeasonFx = ({ s, boxRef, targetRef }: { s: Season; boxRef: RefObject<HTMLElement | null>; targetRef: RefObject<HTMLElement | null> }) => (
  <LetterSeasonFx season={s} boxRef={boxRef} targetRef={targetRef} />
)

const Byline = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-3">
    <img src={pastorAvatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/80" />
    <div className="leading-tight">
      <div className={`text-[16px] font-semibold ${light ? 'text-white' : 'text-gray-900 dark:text-white'}`}>안동철 담임목사</div>
      <div className={`text-[13.5px] mt-0.5 ${light ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>참빛교회 성도님께</div>
    </div>
  </div>
)

/** 소인 도장 — 둥근 테두리 글자 + 가운데 날짜 */
const Postmark = ({ className = '', s = season }: { className?: string; s?: Season }) => {
  const stamp = SEASON_STAMP[s]
  const { y: Y, m: M, d: D } = ymd(stamp.date)
  return (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <defs>
      <path id="mr-ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
    </defs>
    <circle cx="60" cy="60" r="57" fill="rgba(255,255,255,0.0)" />
    <g fill="none" stroke="currentColor">
      <circle cx="60" cy="60" r="56" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="34" strokeWidth="1.5" />
    </g>
    <text fontSize="10.5" fontWeight="700" letterSpacing="2" fill="currentColor">
      <textPath href="#mr-ring">참빛교회 · CHAMBIT · {stamp.label} ·</textPath>
    </text>
    <text x="60" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
      {Y}
    </text>
    <text x="60" y="74" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor">
      {M}.{String(D).padStart(2, '0')}
    </text>
  </svg>
  )
}

const ReadButton = ({ variant = 'white' }: { variant?: 'white' | 'brand' }) => (
  <button
    className={`h-[54px] px-7 rounded-full text-[17px] font-bold whitespace-nowrap ${
      variant === 'white' ? 'bg-white text-gray-900 hover:bg-sky-50' : 'bg-[var(--brand)] text-white hover:brightness-110'
    }`}
  >
    편지 읽기 · {latest.minutes}분
  </button>
)

/* ─────────────── 공통: 지난 호 목차 (1차 A 그대로) ─────────────── */

const PastIssues = () => (
  <section className="mt-14">
    <div className="flex items-end justify-between border-b-2 border-gray-900 dark:border-white pb-3">
      <h2 className="text-[26px] font-bold text-gray-900 dark:text-white" style={{ fontFamily: SERIF }}>
        지난 호
      </h2>
      <span className="text-[15px] text-gray-500 dark:text-gray-400">모두 {TOTAL}통 · 검색</span>
    </div>
    <div className="grid lg:grid-cols-2 lg:gap-x-12">
      {rest.map((c, i) => (
        <button key={c.id} className="group grid grid-cols-[72px_1fr] gap-4 py-6 border-b border-gray-200 dark:border-white/10 text-left">
          <div className="text-[30px] leading-none font-semibold text-gray-300 dark:text-white/25 group-hover:text-[var(--brand)]" style={{ fontFamily: SERIF }}>
            {String(issueNo(i + 1)).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-gray-500 dark:text-gray-400 mb-1.5">
              {longDate(c.date)}
              {SEASON[c.id] && <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">{SEASON[c.id]}</span>}
            </div>
            <h3 className="text-[20px] lg:text-[22px] font-semibold text-gray-900 dark:text-white leading-[1.4] group-hover:text-[var(--brand)]" style={{ fontFamily: SERIF }}>
              {c.title}
            </h3>
            <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-[1.7] mt-2 line-clamp-2">{c.excerpt}</p>
          </div>
        </button>
      ))}
    </div>
  </section>
)

/** 이번 호의 한 문장 (1차 A 그대로) */
const IssueQuote = () => (
  <section className="grid lg:grid-cols-[1fr_320px] gap-6 mt-10 items-end">
    <blockquote className="text-[24px] lg:text-[32px] leading-[1.6] text-gray-900 dark:text-white" style={{ fontFamily: SERIF }}>
      <span className="text-[var(--brand)]">“</span>
      {latest.quote}
      <span className="text-[var(--brand)]">”</span>
    </blockquote>
    <div className="text-[15px] text-gray-500 dark:text-gray-400 lg:text-right">
      이번 호에서 밑줄 그은 문장
      <div className="mt-1 text-gray-900 dark:text-gray-200 font-semibold">{longDate(latest.date)}</div>
    </div>
  </section>
)

/* ─────────────────── A1. 가을 하늘 표지 ─────────────────── */

const CoverA1 = () => (
  <section className="relative overflow-hidden rounded-[32px] mt-4 h-[600px] lg:h-[580px] bg-sky-400 dark:bg-[#0b1838]">
    <Scene pos="80% 50%" />
    {/* 왼쪽 하늘 쪽을 깊은 블루로 눌러 흰 글씨를 받친다 — 교회는 오른쪽에 그대로 */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#0a3a8f]/70 via-[#0a3a8f]/20 to-transparent dark:from-[#050d24]/85 dark:via-[#050d24]/30" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#06214f]/80 via-transparent to-transparent lg:from-[#06214f]/40" />
    {/* 왼쪽 위 아침 햇살 — 들어올 때 한 번 번진다 */}
    <div className="mr-sun absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,236,190,0.55),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(255,214,140,0.16),transparent_65%)]" />
    <Leaves height={600} />

    <div className="relative h-full flex flex-col px-6 lg:px-12 py-7 lg:py-10">
      <div className="flex items-center gap-3 text-white">
        <span className="text-[20px] lg:text-[22px] font-semibold" style={{ fontFamily: SERIF }}>
          참빛 목회서신
        </span>
        <span className="h-4 w-px bg-white/50" />
        <span className="text-[14px] text-white/85">
          No.{TOTAL} · {Y} {SEASON_KO[season]}호
        </span>
      </div>

      <div className="mt-auto max-w-[620px]">
        <div className="mr-rise flex flex-wrap items-center gap-2 mb-5" style={{ animationDelay: '.1s' }}>
          <span className="px-3.5 py-1.5 rounded-full bg-amber-300 text-gray-900 text-[14px] font-bold">이번 주 편지</span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-[14px] font-semibold">
            {longDate(latest.date)} · {SEASON[latest.id]}
          </span>
        </div>
        <h1
          className="mr-rise text-white text-[40px] lg:text-[64px] leading-[1.15] font-semibold tracking-[-0.02em] [text-shadow:0_2px_24px_rgba(0,30,80,0.35)]"
          style={{ fontFamily: SERIF, animationDelay: '.25s' }}
        >
          {latest.title}
        </h1>
        <p className="mr-rise text-white/90 text-[18px] lg:text-[20px] leading-[1.7] mt-4 line-clamp-2" style={{ fontFamily: SERIF, animationDelay: '.4s' }}>
          “{latest.quote}”
        </p>
        <div className="mr-rise flex flex-wrap items-center gap-x-6 gap-y-4 mt-7" style={{ animationDelay: '.55s' }}>
          <Byline light />
          <ReadButton />
        </div>
      </div>
    </div>
  </section>
)

/* ─────────────────── A2. 편지 도착 표지 ─────────────────── */

const CoverA2 = ({ s = season }: { s?: Season }) => {
  const boxRef = useRef<HTMLElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)
  return (
  <section ref={boxRef} className="relative overflow-hidden rounded-[32px] mt-4 lg:h-[620px] bg-sky-400 dark:bg-[#0b1838]">
    <div className="absolute inset-0">
      <Scene pos="85% 50%" s={s} />
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent dark:from-black/30" />
    </div>
    <SeasonFx key={s} s={s} boxRef={boxRef} targetRef={letterRef} />

    <div className="relative px-5 lg:px-12 pt-6 lg:pt-9 pb-6 lg:pb-0 flex flex-col h-full">
      <div className="flex items-center gap-3 text-white [text-shadow:0_1px_10px_rgba(0,40,100,0.4)]">
        <span className="text-[20px] lg:text-[22px] font-semibold" style={{ fontFamily: SERIF }}>
          참빛 목회서신
        </span>
        <span className="text-[14px] text-white/90">No.{TOTAL}</span>
      </div>
      {/* 모바일은 교회 사진이 보이도록 빈 하늘을 남긴다 */}
      <div className="h-[220px] lg:hidden" />

      {/* 편지지 — 하늘 위에 살짝 기울어 놓임 */}
      <div ref={letterRef} className="lg:absolute lg:left-12 lg:bottom-12 w-full lg:w-[600px]">
        <article className="mr-letter mr-letter-tilt relative rounded-[22px] bg-white dark:bg-[#141c2e] px-6 lg:px-10 pt-8 pb-7 shadow-[0_30px_70px_-20px_rgba(10,40,100,0.55)] dark:ring-1 dark:ring-white/10">
          <Postmark key={s} s={s} className="mr-stamp absolute -top-10 right-4 w-[108px] h-[108px] text-[#c2410c]/85 dark:text-amber-300/85" />
          <div className="text-[13.5px] font-bold text-[var(--brand)]">이번 주 편지가 도착했어요</div>
          <div className="text-[28px] text-gray-600 dark:text-gray-300 mt-3" style={{ fontFamily: PEN }}>
            사랑하는 참빛 성도님께,
          </div>
          <h1 className="text-[32px] lg:text-[42px] font-semibold leading-[1.25] text-gray-900 dark:text-white mt-1 tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
            {latest.title}
          </h1>
          <p className="text-[17px] lg:text-[18px] leading-[1.85] text-gray-600 dark:text-gray-300 mt-4 line-clamp-3" style={{ fontFamily: SERIF }}>
            {latest.paras[0]}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-dashed border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <img src={pastorAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
              <img src={signature} alt="안동철" className="mr-sign h-9 dark:invert" />
            </div>
            <ReadButton variant="brand" />
          </div>
        </article>
      </div>
    </div>
  </section>
  )
}

/* ─────────────────── A3. 아치 창 표지 ─────────────────── */

const CoverA3 = () => (
  <section className="relative overflow-hidden rounded-[32px] mt-4 bg-[#f7f3ec] dark:bg-[#0e1526] ring-1 ring-[#ece4d6] dark:ring-white/10">
    <div className="grid lg:grid-cols-[1fr_440px]">
      <div className="relative order-2 lg:order-1 px-6 lg:px-12 py-8 lg:py-12 flex gap-6 lg:gap-10">
        {/* 세로쓰기 — /about 족자와 같은 결 */}
        <div
          className="hidden sm:block shrink-0 text-[44px] lg:text-[56px] leading-none font-semibold text-[var(--brand)] tracking-[0.12em]"
          style={{ fontFamily: SERIF, writingMode: 'vertical-rl' }}
        >
          목회서신
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-[64px] lg:text-[84px] leading-none font-semibold text-gray-900 dark:text-white tabular-nums" style={{ fontFamily: SERIF }}>
              {TOTAL}
            </span>
            <span className="text-[15px] text-gray-500 dark:text-gray-400 leading-snug">
              번째 편지
              <br />
              {longDate(latest.date)}
            </span>
          </div>
          <span className="mt-5 self-start px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300 text-[14px] font-bold">
            {SEASON[latest.id]}
          </span>
          <h1 className="mr-rise text-[36px] lg:text-[52px] leading-[1.2] font-semibold tracking-[-0.02em] text-gray-900 dark:text-white mt-4" style={{ fontFamily: SERIF }}>
            {latest.title}
          </h1>
          <p className="mr-rise text-[18px] lg:text-[20px] leading-[1.75] text-gray-700 dark:text-gray-300 mt-4" style={{ fontFamily: SERIF, animationDelay: '.15s' }}>
            <span className="bg-[linear-gradient(transparent_60%,rgba(251,191,36,0.35)_60%)]">{latest.quote}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-auto pt-8">
            <Byline />
            <ReadButton variant="brand" />
          </div>
        </div>
      </div>

      {/* 교회 창 모양(위가 둥근 아치)으로 오린 사진 */}
      <div className="relative order-1 lg:order-2 px-6 pt-6 lg:p-8 lg:pl-0">
        <div className="relative h-[340px] lg:h-full lg:min-h-[520px] rounded-t-[220px] rounded-b-[28px] overflow-hidden ring-[6px] ring-white dark:ring-white/10 shadow-[0_20px_50px_-25px_rgba(60,40,10,0.45)]">
          <Scene pos="88% 50%" />
          <div className="mr-sun absolute inset-0 bg-[linear-gradient(200deg,rgba(255,240,200,0.5),transparent_45%)] dark:bg-[linear-gradient(200deg,rgba(255,200,120,0.16),transparent_45%)]" />
          <Leaves height={520} spread={2.2} />
        </div>
      </div>
    </div>
  </section>
)

/* ─────────────────── A4. 주보 1면 ─────────────────── */

const CoverA4 = () => (
  <section className="mt-4 rounded-[28px] bg-[#fffdf8] dark:bg-[#10172a] ring-1 ring-[#efe7d8] dark:ring-white/10 px-5 lg:px-12 pt-7 lg:pt-9 pb-8 lg:pb-10">
    {/* 마스트헤드 */}
    <div className="text-center">
      <div className="text-[12.5px] tracking-[0.3em] text-gray-500 dark:text-gray-400 font-semibold">CHAMBIT PASTORAL LETTER</div>
      <h2 className="text-[42px] lg:text-[72px] leading-[1.1] font-semibold text-gray-900 dark:text-white tracking-[-0.02em] mt-1" style={{ fontFamily: SERIF }}>
        참빛 목회서신
      </h2>
    </div>
    <div className="mt-4 border-y-[3px] border-double border-gray-900 dark:border-white/70 py-2 flex flex-wrap justify-center lg:justify-between gap-x-6 gap-y-1 text-[13.5px] text-gray-700 dark:text-gray-300 font-semibold">
      <span>제{TOTAL}호</span>
      <span>{longDate(latest.date)}</span>
      <span className="text-amber-700 dark:text-amber-300">{SEASON[latest.id]}</span>
      <span className="hidden lg:inline">대한예수교장로회(고신) 참빛교회</span>
    </div>

    <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-10 mt-7">
      {/* 사진 + 캡션 */}
      <figure>
        <div className="relative overflow-hidden rounded-[18px] aspect-[16/9] lg:aspect-[4/3]">
          <Scene pos="82% 50%" />
          <Leaves height={460} spread={1.4} />
        </div>
        <figcaption className="text-[13.5px] text-gray-500 dark:text-gray-400 mt-2.5">
          {SEASON_KO[season]} 하늘 아래 참빛교회 — {M}월 {D}일 주일 아침
        </figcaption>
      </figure>

      {/* 기사 */}
      <article className="flex flex-col">
        <span className="text-[14px] font-bold text-[var(--brand)]">이번 주 편지</span>
        <h1 className="text-[34px] lg:text-[44px] leading-[1.2] font-semibold tracking-[-0.02em] text-gray-900 dark:text-white mt-2" style={{ fontFamily: SERIF }}>
          {latest.title}
        </h1>
        <p className="text-[19px] leading-[1.65] text-gray-700 dark:text-gray-200 mt-4 pl-4 border-l-[3px] border-amber-400" style={{ fontFamily: SERIF }}>
          {latest.quote}
        </p>
        <p
          className="text-[16.5px] leading-[1.85] text-gray-700 dark:text-gray-300 mt-5 line-clamp-5 first-letter:float-left first-letter:text-[54px] first-letter:leading-[0.9] first-letter:mr-2 first-letter:mt-1 first-letter:font-semibold first-letter:text-[var(--brand)]"
          style={{ fontFamily: SERIF }}
        >
          {latest.paras[0]}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-6">
          <div className="flex items-center gap-3">
            <img src={pastorAvatar} alt="" className="w-11 h-11 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="text-[13px] text-gray-500 dark:text-gray-400">글</div>
              <img src={signature} alt="안동철" className="mr-sign h-8 dark:invert" />
            </div>
          </div>
          <ReadButton variant="brand" />
        </div>
      </article>
    </div>
  </section>
)

/* ─────────────────── A0. 1차 원안(비교용) ─────────────────── */

const CoverA0 = () => (
  <section className="relative overflow-hidden rounded-[28px] mt-4 h-[520px] lg:h-[560px] bg-gray-900">
    <img src={churchDayTall} alt="" className="absolute inset-0 w-full h-full object-cover object-[50%_30%]" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
    <div className="absolute bottom-0 inset-x-0 px-6 lg:px-10 pb-8 lg:pb-10">
      <h1 className="text-white text-[36px] lg:text-[60px] leading-[1.15] font-semibold" style={{ fontFamily: SERIF }}>
        {latest.title}
      </h1>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <Byline light />
        <ReadButton />
      </div>
    </div>
  </section>
)

/* ─────────────────────────── 셸 ─────────────────────────── */

const VARIANTS = [
  { key: 'a2', name: 'A2 편지 도착', note: '편지지 · 소인 도장 · 서명', Cover: CoverA2, quote: true },
  { key: 'a1', name: 'A1 가을 하늘', note: '풀블리드 하늘 · 단풍잎', Cover: CoverA1, quote: true },
  { key: 'a3', name: 'A3 아치 창', note: '세로쓰기 · 교회 창 사진', Cover: CoverA3, quote: false },
  { key: 'a4', name: 'A4 주보 1면', note: '신문 마스트헤드 · 두 단', Cover: CoverA4, quote: false },
  { key: 'a0', name: '1차 A', note: '비교용 원안', Cover: CoverA0, quote: true },
] as const

const MinistryRedesignPreview = () => {
  const [params, setParams] = useSearchParams()
  const current = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[0]
  const { Cover } = current
  const pickedSeason = (SEASONS as string[]).includes(params.get('season') ?? '') ? (params.get('season') as Season) : season
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggleDark = () => {
    document.documentElement.classList.toggle('dark', !dark)
    setDark(!dark)
  }
  const setSeason = (s: Season) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('season', s)
      if (!next.get('v')) next.set('v', 'a2')
      return next
    })

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark">
      <style>{MOTION_CSS}</style>
      {/* key 로 다시 그려 들어오는 움직임을 시안마다 처음부터 */}
      <div key={current.key} className="max-w-[1180px] mx-auto px-4 lg:px-6 pt-20 pb-28">
        {current.key === 'a2' ? <CoverA2 s={pickedSeason} /> : <Cover />}
        {current.quote && <IssueQuote />}
        <PastIssues />
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-24px)] rounded-full bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur shadow-2xl ring-1 ring-gray-200 dark:ring-white/10">
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
          {current.key === 'a2' ? (
            <>
              <span className="text-[13px] font-bold text-gray-500 mr-1 whitespace-nowrap">A2 계절</span>
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={`h-9 px-4 rounded-full text-[14px] font-semibold whitespace-nowrap ${
                    s === pickedSeason ? 'bg-[var(--brand)] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {SEASON_KO[s]}
                </button>
              ))}
              <span className="hidden lg:inline text-[13px] text-gray-500 dark:text-gray-400 px-2 whitespace-nowrap">{SEASON_FX_NAME[pickedSeason]}</span>
              <button
                onClick={toggleDark}
                className="h-9 px-4 rounded-full text-[14px] font-semibold whitespace-nowrap ring-1 ring-gray-200 dark:ring-white/15 text-gray-700 dark:text-gray-200"
              >
                {dark ? '낮으로' : '밤으로'}
              </button>
              <span className="w-px h-5 bg-gray-200 dark:bg-white/15 mx-1" />
            </>
          ) : (
            <span className="text-[13px] font-bold text-gray-500 mr-1 whitespace-nowrap">목양칼럼 시안</span>
          )}
          {VARIANTS.map((x) => (
            <button
              key={x.key}
              onClick={() => setParams({ v: x.key })}
              className={`h-9 rounded-full font-semibold whitespace-nowrap ${
                current.key === 'a2' ? 'px-3 text-[12.5px]' : 'px-4 text-[14px]'
              } ${x.key === current.key ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'}`}
            >
              {current.key === 'a2' ? x.name.split(' ')[0] : x.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MinistryRedesignPreview
