import type { CSSProperties, ReactElement } from 'react'
import type { ChatAction, ChatReply } from '../../types/chatbot'
import avatarJoy from './img/joy.webp'
import { useDailyVerse } from '../../hooks/useDailyVerse'
import './chatbot.css'

/**
 * 챗봇을 처음 열었을 때의 환영 화면 — 연보라 안개 배경 위 헤드라인 인사 + 참비 + 오늘의 말씀 필 + 3열 메뉴 카드.
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
    match: /말씀|묵상/,
    icon: IconBook,
    desc: '하루를 비추는 말씀과 묵상을 전해드려요',
    bg: '#f6f2ff', bd: '#e3dafb', fg: '#7355d8',
    bgDark: 'rgba(150, 120, 240, 0.12)', fgDark: '#b9a5f5',
  },
  {
    match: /기도|위로/,
    icon: IconPray,
    desc: '기도 제목을 남기면 함께 기도해요',
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

/** 참비가 먼저 건네는 질문 예시 — 백엔드 메뉴와 별개로 대화를 열어주는 미끼 */
const RECOMMENDED = ['오늘의 말씀 알려줘', '용서에 대한 성경 구절', '예배는 언제인가요?']

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

const WelcomeScene = ({ reply, onAction, onAsk }: Props) => {
  const g = splitGreeting(reply.text ?? '')
  const { data: verse } = useDailyVerse()
  const verseAction = reply.actions.find((a) => /말씀|묵상/.test(a.label))

  return (
    <div className="cb-welcome">
      {/* 히어로 — 인사 헤드라인 + 참비 */}
      <div className="cb-hero">
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
          <p className="cb-note m-0">
            필요한 걸
            <br />
            골라보세요!
          </p>
          <svg className="cb-squiggle" viewBox="0 0 24 34" width="18" height="26" fill="none" aria-hidden>
            <path d="M18 2c-9 6 6 10-3 16-8 5-8 11-3 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="11" cy="31.5" r="1.7" fill="currentColor" />
          </svg>
          <span className="cb-orb" aria-hidden />
          <img src={avatarJoy} alt="" className="cb-chambi" draggable={false} />
        </div>
      </div>

      {/* 오늘의 말씀 필 */}
      {verse && (
        <button
          type="button"
          className="cb-verse-pill"
          onClick={() => (verseAction ? onAction(verseAction) : onAsk('오늘의 말씀 알려줘'))}
        >
          <span className="cb-verse-pill-icon">{IconGift}</span>
          <span className="cb-verse-pill-label">오늘의 말씀</span>
          <span className="cb-verse-pill-sep" aria-hidden />
          <span className="cb-verse-pill-ref">{verse.verse_reference}</span>
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden className="ml-auto shrink-0">
            <path d="m2 1.5 4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* 메뉴 카드 */}
      <div className="cb-grid">
        {reply.actions.map((a) => {
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
                <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M3 1.5 5.5 4 3 6.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          )
        })}
      </div>

      {/* 추천 질문 */}
      <div className="cb-chips">
        <span className="cb-chips-label">추천 질문</span>
        {RECOMMENDED.map((q) => (
          <button key={q} type="button" className="cb-chip" onClick={() => onAsk(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

export default WelcomeScene
