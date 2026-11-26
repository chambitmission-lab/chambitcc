import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { visitSceneFor } from '../../utils/themeAssets'
import type { Event } from '../../types/event'
import WeekPostcard from '../Events/components/WeekPostcard'
import { buildWeekCard, mondayOf } from '../Events/utils/weekPostcards'
import '../Events/styles/weekPostcard.css'
import './eventsHeroPreview.css'

/**
 * /#/dev/events-hero — /events 맨 위 히어로(EventHeroCard)를 아래 우편엽서 목록과 같은 언어로.
 *   ?v=now 지금 · h1 초대 봉투 · h2 큰 사진 엽서 · h3 초대장
 * 각 시안 바로 아래에 실제 WeekPostcard 를 붙여 어울림을 본다. 표본 일정만(오늘 = 2026-11-26).
 */

type VKey = 'h1' | 'h2' | 'h3'
const VARIANTS: { key: VKey; label: string; note: string }[] = [
  {
    key: 'h1',
    label: 'H1 초대 봉투',
    note: '다가오는 일정 = 교회가 보낸 봉투 한 통. 왼쪽 위 "참빛교회 드림", 가운데 받는 사람 "참빛 식구들에게" 대신 제목, 오른쪽 위 우표 + 소인 안에 "3일 뒤". 엽서와 같은 아이보리·우체국 빨강·항공우편 띠.',
  },
  {
    key: 'h2',
    label: 'H2 큰 사진 엽서',
    note: '아래 엽서의 사진 면을 크게 키운 앞면. 계절 교회 전경 인화 사진(필름 날짜 도장 = 그 일정 날짜) 위에 "3일 뒤" 소인, 아래 종이 띠에 제목·날짜를 큰 고딕으로. 사진이 주인공.',
  },
  {
    key: 'h3',
    label: 'H3 초대장',
    note: '옛 교회 행사 초대장 — 빨간 이중 테두리, 가운데 정렬, "초 대 합 니 다" 명조 머리. 남은 날은 빨간 둥근 도장. 가장 단정하고 격식 있는 느낌.',
  },
]

const SAMPLE: Event[] = [
  { id: 1, title: '직분자 선거를 위한 특별새벽기도회', category: 'worship', start_datetime: '2026-11-23T00:00:00', end_datetime: '2026-11-23T23:59:00', attendance_count: 0 } as Event,
  { id: 2, title: '직원선출을 위한 공동의회', category: 'meeting', start_datetime: '2026-11-29T13:30:00', end_datetime: '2026-11-29T15:00:00', location: '본당', attendance_count: 0 } as Event,
]
const HERO = SAMPLE[1]
const HERO_LABEL = { date: '11월 29일 주일', time: '오후 1:30', place: '본당', left: '3일 뒤', cat: '모임', imprint: "'26 11 29" }

const Postmark = ({ text }: { text: string }) => (
  <svg viewBox="0 0 120 60" className="wpc-postmark" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="30" cy="30" r="25" />
      <circle cx="30" cy="30" r="19" strokeWidth="0.9" />
      {[18, 26, 34, 42].map((y) => (
        <path key={y} d={`M58 ${y} q7 -4 14 0 t14 0 t14 0 t14 0`} />
      ))}
    </g>
    <text x="30" y="27" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">참빛</text>
    <text x="30" y="39" textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">{text}</text>
  </svg>
)

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const useScene = () => {
  const { theme } = useTheme()
  return visitSceneFor(theme === 'dark' ? 'dark' : 'light', new Date(2026, 10, 29))!.src
}

// ── H1 초대 봉투 ──
const HeroEnvelope = () => {
  const scene = useScene()
  return (
    <article className="wpc ehp-envelope">
      <span className="ehp-flap" aria-hidden="true" />
      <div className="relative px-5 pt-5 pb-5 lg:px-7 lg:pt-6 lg:pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="wpc-serif wpc-post font-extrabold tracking-[0.3em] text-[13px] lg:text-[14px]">가장 가까운 일정</p>
            <p className="wpc-hand wpc-accent text-[22px] lg:text-[25px] leading-none mt-1.5">참빛교회 드림</p>
          </div>
          <div className="relative shrink-0">
            <span className="absolute -left-[74px] top-[16px] w-[112px]"><Postmark text={HERO_LABEL.left} /></span>
            <span className="wpc-stamp w-[52px] h-[62px] lg:w-[60px] lg:h-[72px]">
              <img src={scene} alt="" aria-hidden="true" className="w-full h-full object-cover object-[88%_60%]" />
            </span>
          </div>
        </div>
        <h2 className="wpc-week mt-5 font-extrabold leading-[1.25] tracking-[-0.015em] text-[24px] lg:text-[30px] break-keep">{HERO.title}</h2>
        <p className="wpc-week mt-2 text-[17px] lg:text-[19px]">
          <b className="font-extrabold">{HERO_LABEL.date} · {HERO_LABEL.time}</b>
          <span className="opacity-80"> · {HERO_LABEL.place}</span>
        </p>
        <div className="mt-4 pt-3.5 flex items-center justify-between gap-3 border-t border-[var(--wpc-rule)]">
          <span className="wpc-pill text-[14px]">{HERO_LABEL.cat}</span>
          <span className="wpc-accent inline-flex items-center gap-1 font-extrabold text-[16px] lg:text-[17px]">열어 보기 <Arrow /></span>
        </div>
      </div>
      <span className="ehp-airmail" aria-hidden="true" />
    </article>
  )
}

// ── H2 큰 사진 엽서 ──
const HeroPhoto = () => {
  const scene = useScene()
  return (
    <article className="wpc">
      <div className="px-3 pt-3 lg:px-3.5 lg:pt-3.5">
        <figure className="wpc-film ehp-film-straight">
          <div className="relative overflow-hidden h-[180px] lg:h-[230px]">
            <img src={scene} alt="" aria-hidden="true" className="wpc-film-img absolute inset-0 w-full h-full object-cover object-[96%_65%]" />
            <span className="wpc-film-wash" aria-hidden="true" />
            <span className="wpc-imprint-shade" aria-hidden="true" />
            <span className="wpc-imprint text-[16px] lg:text-[18px]">{HERO_LABEL.imprint}</span>
            <span className="absolute left-3 top-3 lg:left-4 lg:top-4 wpc-hand text-white ehp-shadow text-[26px] lg:text-[32px] leading-none">가장 가까운 일정</span>
          </div>
        </figure>
      </div>
      <div className="relative px-4 pt-4 pb-4 lg:px-6 lg:pt-5 lg:pb-5">
        <span className="wpc-pill text-[14px] lg:text-[15px]">{HERO_LABEL.left}</span>
        <h2 className="wpc-week mt-2 font-extrabold leading-[1.25] tracking-[-0.015em] text-[23px] lg:text-[29px] break-keep">{HERO.title}</h2>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="wpc-week text-[16.5px] lg:text-[19px]">
            <b className="font-extrabold">{HERO_LABEL.date} · {HERO_LABEL.time}</b>
            <span className="opacity-80"> · {HERO_LABEL.place}</span>
          </p>
          <span className="wpc-accent shrink-0 inline-flex items-center gap-1 font-extrabold text-[16px] lg:text-[17px]">자세히 <Arrow /></span>
        </div>
      </div>
    </article>
  )
}

// ── H3 초대장 ──
const HeroInvite = () => (
  <article className="wpc ehp-invite">
    <div className="ehp-invite-frame px-5 py-6 lg:px-8 lg:py-7 text-center">
      <span className="ehp-seal" aria-hidden="true">
        <span className="text-[11px] font-bold opacity-80">남은 날</span>
        <span className="text-[19px] font-extrabold leading-none">{HERO_LABEL.left}</span>
      </span>
      <p className="wpc-serif wpc-post font-extrabold tracking-[0.6em] text-[14px] lg:text-[16px] pl-[0.6em]">초대합니다</p>
      <h2 className="wpc-week mt-3 font-extrabold leading-[1.25] tracking-[-0.015em] text-[24px] lg:text-[31px] break-keep">{HERO.title}</h2>
      <div className="mx-auto mt-3 h-px w-16 bg-[var(--wpc-red)] opacity-50" />
      <p className="wpc-week mt-3 font-extrabold text-[18px] lg:text-[21px]">{HERO_LABEL.date} · {HERO_LABEL.time}</p>
      <p className="wpc-week mt-0.5 opacity-80 text-[16px] lg:text-[18px]">{HERO_LABEL.place}</p>
      <p className="wpc-hand wpc-accent mt-3 text-[23px] lg:text-[26px] leading-none">— 참빛교회 드림</p>
    </div>
  </article>
)

const Hero = ({ v }: { v: VKey }) => (v === 'h1' ? <HeroEnvelope /> : v === 'h2' ? <HeroPhoto /> : <HeroInvite />)

const Column = ({ v }: { v: VKey }) => {
  const week = buildWeekCard(mondayOf(new Date(2026, 10, 26)), SAMPLE, mondayOf(new Date(2026, 10, 26)))
  return (
    <div className="flex flex-col gap-6">
      <Hero v={v} />
      <WeekPostcard week={week} />
    </div>
  )
}

export default function EventsHeroPreview() {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[0]
  useEffect(() => {
    void ensureFontFamily('nanumPen')
  }, [])
  const pill = (on: boolean) =>
    `text-[13px] px-3.5 py-1.5 rounded-full border ${on ? 'bg-[var(--brand)] text-white border-transparent font-bold' : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'}`
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="mx-auto max-w-[1240px] px-5 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">/events 히어로 — 우편엽서와 맞추기</h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {VARIANTS.map((x) => (
            <button key={x.key} onClick={() => setParams({ v: x.key }, { replace: true })} className={pill(x.key === meta.key)}>
              {x.label}
            </button>
          ))}
          <button onClick={toggleTheme} className="ml-2 text-[13px] underline text-gray-500 dark:text-white/55">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-[1.6] text-gray-500 dark:text-white/55 break-keep max-w-[860px]">{meta.note}</p>
        <div className="mt-6 flex flex-wrap items-start gap-6">
          <figure className="flex-1 min-w-[560px] max-w-[660px]">
            <figcaption className="mb-2 text-[12px] text-gray-400">PC 본문 칸</figcaption>
            <div className="rounded-3xl border border-border-light dark:border-border-dark bg-[var(--app-canvas)] p-6">
              <Column v={meta.key} />
            </div>
          </figure>
          <figure className="w-[375px] shrink-0">
            <figcaption className="mb-2 text-[12px] text-gray-400">모바일 (375)</figcaption>
            <div className="rounded-[28px] border border-border-light dark:border-border-dark bg-[var(--app-canvas)] p-4">
              <Column v={meta.key} />
            </div>
          </figure>
        </div>
      </div>
    </div>
  )
}
