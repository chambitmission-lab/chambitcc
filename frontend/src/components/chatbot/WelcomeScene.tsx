import type { CSSProperties, ReactElement } from 'react'
import type { ChatAction, ChatReply } from '../../types/chatbot'
import avatarJoy from './img/joy.webp'
import { useQuery } from '@tanstack/react-query'
import { useDailyVerse } from '../../hooks/useDailyVerse'
import { getCurrentWeeklyPrayer } from '../../api/weeklyPrayer'
import './chatbot.css'

/**
 * 챗봇을 처음 열었을 때의 환영 화면 — 브랜드 블루 안개 배경 위
 * 흰 히어로 카드(인사 + 오늘의 말씀 필 + 참비) → "참비가 도와드릴게요" 3열 카드 → 함께하는 우리 스트립.
 * 추천 질문 칩(RECOMMENDED)은 위젯 입력창 아래에서 그린다.
 * 백엔드 인사(reply.actions)를 그대로 받아 메뉴 카드 그리드로 그린다 —
 * 라벨 키워드로 시각 프리셋을 고르므로 관리자가 메뉴를 늘려도 기본 카드로 안전하게 떨어진다.
 *
 * 아이콘은 목업의 3D 렌더 대신 같은 톤의 인라인 SVG다.
 * 실제 3D 이미지가 준비되면 PRESETS의 icon만 <img src={...} /> 로 바꾸면 된다.
 */

// ── 아이콘 (뷰박스 40×40, 파스텔 단색 조합) ─────────────────────────
const IconChurch = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <rect x="18.9" y="3" width="2.2" height="8" rx="1" fill="#e0a95c" />
    <rect x="16.6" y="5.4" width="6.8" height="2.2" rx="1" fill="#e0a95c" />
    <path d="M20 11 L33 22 H7 Z" fill="#f2c98d" />
    <rect x="9.5" y="21" width="21" height="14" rx="2.5" fill="#fbe4c0" />
    <rect x="16.8" y="25" width="6.4" height="10" rx="3.2" fill="#e0a95c" />
    <circle cx="13.2" cy="27.5" r="2" fill="#f2c98d" />
    <circle cx="26.8" cy="27.5" r="2" fill="#f2c98d" />
  </svg>
)

const IconBook = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <path d="M5 11c5.5-2.6 11-1.8 15 1.4v19C16 28.2 10.5 27.4 5 30Z" fill="#bda9f0" />
    <path d="M35 11c-5.5-2.6-11-1.8-15 1.4v19c4-3.2 9.5-4 15-1.4Z" fill="#ded4fb" />
    <path d="M20 12.4v19" stroke="#9a83e0" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M24 15.5h7M24 19h6" stroke="#a892ea" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M26.5 8v7l2.2-1.8L30.9 15V8Z" fill="#f08fae" />
  </svg>
)

const IconPray = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <path d="M19.3 6.5c-4.4 5.4-7 12.4-6.2 19.6.3 2.6 3 4.4 6.2 4.4Z" fill="#7fcfa8" />
    <path d="M20.7 6.5c4.4 5.4 7 12.4 6.2 19.6-.3 2.6-3 4.4-6.2 4.4Z" fill="#b4e8cd" />
    <rect x="11.5" y="29.5" width="17" height="5.5" rx="2.7" fill="#5cb98d" />
  </svg>
)

const IconSearch = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <path d="M24.5 25.5 33 34" stroke="#7bb6ee" strokeWidth="4.6" strokeLinecap="round" />
    <circle cx="17" cy="17" r="10.5" fill="#dcecfd" />
    <circle cx="17" cy="17" r="10.5" fill="none" stroke="#7bb6ee" strokeWidth="2.6" />
    <path d="M12.5 13.5h9M12.5 17h9M12.5 20.5h6" stroke="#7bb6ee" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

const IconQuiz = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <rect x="9" y="6" width="22" height="28" rx="3" fill="#f7c2d5" />
    <rect x="9" y="6" width="5.5" height="28" rx="2.5" fill="#e995b4" />
    <text
      x="23"
      y="25.5"
      textAnchor="middle"
      fontSize="15"
      fontWeight="800"
      fill="#fff"
      fontFamily="Pretendard, sans-serif"
    >
      ?
    </text>
  </svg>
)

const IconSprout = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <path d="M20 23V13" stroke="#63b87c" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M19.3 18c-.6-4.4-3.1-7.4-6.6-7.4-.6 3.4 1.4 7 6.6 7.4Z" fill="#8ed7a1" />
    <path d="M20.7 15.5c.6-4.4 3.1-7.4 6.6-7.4.6 3.4-1.4 7-6.6 7.4Z" fill="#b6e8c2" />
    <rect x="10" y="21.5" width="20" height="4.4" rx="2.2" fill="#dcbb95" />
    <path d="M11.8 26h16.4l-1.9 8.4a2 2 0 0 1-2 1.6h-8.6a2 2 0 0 1-2-1.6Z" fill="#eccfae" />
  </svg>
)

const IconPin = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <ellipse cx="20" cy="33" rx="7" ry="2.2" fill="#f3c9b0" />
    <path d="M20 5c-6 0-10.5 4.6-10.5 10.4C9.5 23 20 32 20 32s10.5-9 10.5-16.6C30.5 9.6 26 5 20 5Z" fill="#f4a27d" />
    <circle cx="20" cy="15.5" r="4.3" fill="#fff1e8" />
  </svg>
)

const IconGrad = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <path d="M20 8 35 15.5 20 23 5 15.5Z" fill="#8fb5f2" />
    <path d="M11.5 18.8v7.2c0 2.6 3.8 4.7 8.5 4.7s8.5-2.1 8.5-4.7v-7.2L20 23Z" fill="#c9dcfa" />
    <path d="M32.5 16.5v9" stroke="#5f93e6" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="32.5" cy="27" r="1.7" fill="#5f93e6" />
  </svg>
)

const IconPerson = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <circle cx="20" cy="14" r="6.5" fill="#f0c9a2" />
    <path d="M8.5 33c1-6.6 5.8-10.2 11.5-10.2S30.5 26.4 31.5 33Z" fill="#d9c3ee" />
    <path d="M17.5 23.4 20 30l2.5-6.6" fill="#fff" />
  </svg>
)

const IconChat = (
  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
    <path d="M7 12a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H18l-7 5v-5a4 4 0 0 1-4-4Z" fill="#cfe1fb" />
    <rect x="18.9" y="12" width="2.2" height="11" rx="1" fill="#7bb6ee" />
    <rect x="15.5" y="15.4" width="9" height="2.2" rx="1" fill="#7bb6ee" />
  </svg>
)

// ── 카드 시각 프리셋 ────────────────────────────────────────────────
type Preset = {
  match: RegExp
  icon: ReactElement
  desc: string
  bg: string
  bd: string
  fg: string
  bgDark: string
  fgDark: string
}

const PRESETS: Preset[] = [
  {
    match: /예배|주일/,
    icon: IconChurch,
    desc: '예배 시간과 교회 소식을 확인해요',
    bg: '#fff8ec', bd: '#f4e3c6', fg: '#c08029',
    bgDark: 'rgba(240, 180, 90, 0.10)', fgDark: '#f0c07a',
  },
  {
    match: /오시는|주차|위치|주소/,
    icon: IconPin,
    desc: '주소·교통·주차를 안내해드려요',
    bg: '#fff3ec', bd: '#f8d9c6', fg: '#d2652f',
    bgDark: 'rgba(244, 162, 125, 0.12)', fgDark: '#f3b48f',
  },
  {
    match: /교육|부서|훈련/,
    icon: IconGrad,
    desc: '교육 프로그램과 부서를 알려드려요',
    bg: '#eef4ff', bd: '#d5e2fb', fg: '#3b6fd0',
    bgDark: 'rgba(120, 165, 240, 0.12)', fgDark: '#a3c2f5',
  },
  {
    match: /목사|담임|목회/,
    icon: IconPerson,
    desc: '담임목사님 소개와 인사말을 전해드려요',
    bg: '#f7f2fc', bd: '#e6d9f5', fg: '#7d4fb8',
    bgDark: 'rgba(170, 130, 220, 0.12)', fgDark: '#c9aef0',
  },
  {
    match: /말씀|묵상/,
    icon: IconBook,
    desc: '하루를 비추는 말씀과 묵상을 전해드려요',
    bg: '#f6f2ff', bd: '#e3dafb', fg: '#7355d8',
    bgDark: 'rgba(150, 120, 240, 0.12)', fgDark: '#b9a5f5',
  },
  {
    match: /기도|위로/,
    icon: IconPray,
    desc: '지친 마음에 위로가 되는 말씀을 전해드려요',
    bg: '#eefaf3', bd: '#cfeddc', fg: '#2c9463',
    bgDark: 'rgba(80, 200, 150, 0.11)', fgDark: '#7fd8ac',
  },
  {
    match: /구절|찾/,
    icon: IconSearch,
    desc: '성경 구절을 쉽고 빠르게 찾아드려요',
    bg: '#eff6ff', bd: '#d7e8fb', fg: '#2c78cf',
    bgDark: 'rgba(90, 160, 250, 0.12)', fgDark: '#8ec0f7',
  },
  {
    match: /퀴즈/,
    icon: IconQuiz,
    desc: '재미있는 퀴즈로 말씀을 기억해요',
    bg: '#fff1f6', bd: '#fbdae5', fg: '#cc5286',
    bgDark: 'rgba(240, 130, 180, 0.12)', fgDark: '#f0a2c4',
  },
  {
    match: /새가족|처음|환영/,
    icon: IconSprout,
    desc: '처음 오신 분들을 환영하고 안내해요',
    bg: '#f1fbf1', bd: '#d5edd5', fg: '#419a4a',
    bgDark: 'rgba(110, 200, 120, 0.11)', fgDark: '#94dc9e',
  },
]

const FALLBACK: Preset = {
  match: /$^/,
  icon: IconChat,
  desc: '참비에게 물어보세요',
  bg: '#f2f6fd', bd: '#dde7f7', fg: '#3182f6',
  bgDark: 'rgba(90, 160, 250, 0.10)', fgDark: '#8ec0f7',
}

const presetFor = (label: string) => PRESETS.find((p) => p.match.test(label)) ?? FALLBACK

/** 라벨 앞의 이모지·기호를 떼어 카드 제목으로 쓴다 */
const cleanLabel = (label: string) => label.replace(/^[^\p{L}\p{N}]+/u, '').trim() || label


/**
 * 백엔드 인사 첫 줄("편안한 저녁이에요 🌙 저는 참비예요.")을 헤드라인 두 줄로 쪼갠다.
 * 형식이 다르면 첫 줄 전체를 헤드라인으로, 나머지 줄은 보조 문구로 쓴다.
 */
const splitGreeting = (text: string) => {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const first = lines[0] ?? '안녕하세요 😊 저는 참비예요.'
  const m = first.match(/^(.*?)\s*저는\s*참비예요[.!]?$/)
  return {
    hello: m ? m[1] : first,
    intro: m ? true : false,
    rest: lines.slice(1),
  }
}

const IconGift = (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
    <rect x="2.5" y="7" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2.5 10.5h15M10 7v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10 7c-2.6 0-4.2-1.2-4.2-2.6S7.5 2.2 10 7c2.5-4.8 4.2-3.6 4.2-2.2S12.6 7 10 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

type Props = {
  reply: ChatReply
  onAction: (a: ChatAction) => void
  onAsk: (text: string) => void
}

/** 웰컴 그리드에 올릴 카드 수 — 3열 × 2줄. 나머지는 대화 중 도움말 칩으로 계속 노출된다 */
const GRID_MAX = 6

const IconSparkSmall = (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
    <path d="M10 2.5 11.8 8.2 17.5 10l-5.7 1.8L10 17.5l-1.8-5.7L2.5 10l5.7-1.8Z" fill="currentColor" />
    <path d="M16 2.2l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z" fill="currentColor" opacity="0.7" />
  </svg>
)

const IconPeople = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
    <circle cx="9" cy="8.5" r="3.4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M2.8 19c.6-3.6 3.2-5.6 6.2-5.6s5.6 2 6.2 5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.4 13.6c2.1.5 3.5 2.2 3.8 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

const WelcomeScene = ({ reply, onAction, onAsk }: Props) => {
  const g = splitGreeting(reply.text ?? '')
  const { data: verse } = useDailyVerse()
  const verseAction = reply.actions.find((a) => /말씀|묵상/.test(a.label))
  // 오늘의 말씀은 히어로 필이 맡으니 카드 그리드에선 뺀다
  const cards = reply.actions.filter((a) => a !== verseAction).slice(0, GRID_MAX)

  // 함께하는 우리 — 이번 주 공동 기도에 함께한 실제 인원 (홈 배너와 같은 캐시)
  const { data: weekly } = useQuery({
    queryKey: ['weeklyPrayer', 'current', 'homeBanner'],
    queryFn: getCurrentWeeklyPrayer,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const prayedCount = weekly?.prayed_user_count ?? 0

  return (
    <div className="cb-welcome">
      {/* 히어로 카드 — 인사 + 오늘의 말씀 필 + 참비 */}
      <section className="cb-hero">
        <div className="cb-hero-copy">
          <h2 className="cb-headline m-0">
            {g.hello}
            {g.intro && (
              <>
                <br />
                저는 <em>참비</em>예요!
              </>
            )}
          </h2>
          <p className="cb-sub m-0">
            {g.rest.length > 0 ? g.rest.join('\n') : '예배, 말씀, 위로가 필요할 때\n참비가 함께할게요.'}
          </p>
        </div>

        <div className="cb-hero-art">
          <span className="cb-bubble">
            필요한 걸
            <br />
            물어보세요!
          </span>
          <span className="cb-orb" aria-hidden />
          <img src={avatarJoy} alt="" className="cb-chambi" draggable={false} />
        </div>

        {/* 오늘의 말씀 필 — 카드 아래 줄, 참비 원판 앞에서 끝난다 */}
        {verse && (
          <button
            type="button"
            className="cb-verse-pill"
            onClick={() => (verseAction ? onAction(verseAction) : onAsk('오늘의 말씀 알려줘'))}
          >
            <span className="cb-verse-pill-icon">{IconGift}</span>
            <span className="cb-verse-pill-label">오늘의 말씀</span>
            <span className="cb-verse-pill-ref">{verse.verse_reference}</span>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden className="ml-auto shrink-0">
              <path d="m2 1.5 4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </section>

      {/* 메뉴 카드 */}
      <h3 className="cb-section-title m-0">
        <span className="cb-section-spark">{IconSparkSmall}</span>
        참비가 도와드릴게요
      </h3>
      <div className="cb-grid">
        {cards.map((a) => {
          const p = presetFor(a.label)
          return (
            <button
              key={a.label}
              type="button"
              onClick={() => onAction(a)}
              className="cb-card"
              style={
                {
                  '--cb-bg': p.bg,
                  '--cb-bd': p.bd,
                  '--cb-fg': p.fg,
                  '--cb-bg-d': p.bgDark,
                  '--cb-fg-d': p.fgDark,
                } as CSSProperties
              }
            >
              <span className="cb-card-icon">{p.icon}</span>
              <span className="cb-card-title">{cleanLabel(a.label)}</span>
              <p className="cb-card-desc m-0">{p.desc}</p>
              <span className="cb-chev" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M3 1.5 5.5 4 3 6.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          )
        })}
      </div>

      {/* 함께하는 우리 — 이번 주 함께 기도한 인원 (0명이면 숨긴다) */}
      {prayedCount > 0 && (
        <button type="button" className="cb-together" onClick={() => onAsk('이번 주 기도제목')}>
          <span className="cb-together-icon">{IconPeople}</span>
          <span className="cb-together-copy">
            <span className="cb-together-title">함께하는 우리</span>
            <span className="cb-together-sub">이번 주 {prayedCount}명이 참비와 함께 기도하고 있어요</span>
          </span>
          <span className="cb-together-stack" aria-hidden>
            <span className="cb-together-dot" />
            <span className="cb-together-dot" />
            <span className="cb-together-dot" />
            <span className="cb-together-count">+{prayedCount}</span>
          </span>
        </button>
      )}
    </div>
  )
}

export default WelcomeScene
