import { useState } from 'react'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface BottomNavigationProps {
  onProfileClick: () => void
  onComposeClick: () => void
  /** 감사 한 줄 작성 (스피드 다이얼) */
  onThanksClick: () => void
  /** 말씀 사진 카드 만들기 (스피드 다이얼) */
  onVerseCardClick: () => void
  onScrollToTop: () => void
  onFocusModeClick: () => void
  onBibleClick: () => void
  /** lazy 청크를 받는 중인 목적지 경로 — 해당 아이콘 자리에 스피너를 띄운다 */
  pendingPath?: string | null
}

// 청크 대기 중 표시 — 아이콘과 같은 크기라 눌린 자리가 흔들리지 않는다
const NavSpinner = () => (
  <span className="w-[22px] h-[22px] rounded-full border-2 border-current border-t-transparent animate-spin" />
)

// 스피드 다이얼 액션 — 위에서부터 렌더되고, 엄지에 가까운 아래쪽이 주 액션(기도)
const DIAL_ACTIONS = [
  {
    key: 'verse-card',
    emoji: '💌',
    label: '말씀 카드 만들기',
    tint: 'bg-[rgba(234,179,8,0.14)]',
  },
  {
    key: 'thanks',
    emoji: '🌼',
    label: '감사 한 줄 남기기',
    tint: 'bg-[rgba(236,95,143,0.12)]',
  },
  {
    key: 'prayer',
    emoji: '🙏',
    label: '기도제목 나누기',
    tint: 'bg-[var(--brand-soft-strong)]',
  },
] as const

// 다이얼을 열 때마다 하나씩 — 화려함 대신 "써볼까" 하게 만드는 다정한 질문
const GREETINGS = [
  '오늘은 어떤 마음을 나눌까요?',
  '나누고 싶은 은혜가 있나요?',
  '작은 것도 좋아요, 함께 나눠요',
  '오늘 하루, 어떠셨어요?',
]

// 열리는 순간 FAB에서 퍼지는 반짝 파편 — "발견" 손맛 (위쪽 반원으로만)
const FAB_SPARKS = [
  { x: -30, y: -36, s: 1, d: 0 },
  { x: 27, y: -40, s: 0.8, d: 40 },
  { x: -46, y: -12, s: 0.7, d: 80 },
  { x: 45, y: -15, s: 0.9, d: 60 },
  { x: -12, y: -50, s: 0.7, d: 100 },
  { x: 13, y: -52, s: 0.85, d: 20 },
] as const

const BottomNavigation = ({
  onProfileClick,
  onComposeClick,
  onThanksClick,
  onVerseCardClick,
  onScrollToTop,
  onFocusModeClick,
  onBibleClick,
  pendingPath = null,
}: BottomNavigationProps) => {
  // 모바일엔 hover가 없어 탭 피드백이 전혀 없었음 — active로 즉각 반응을 준다
  const navItemClass =
    'relative z-10 flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)] active:text-brand active:bg-[var(--brand-soft)] active:scale-90 transition-[color,background-color,transform] duration-150'

  // FAB 스피드 다이얼 — 기도·감사·말씀카드 세 가지 "나눔"의 허브
  const [dialOpen, setDialOpen] = useState(false)
  // 열 때마다 바뀌는 인사 — "작성해볼까" 하는 마음을 여는 한 줄
  const [greeting, setGreeting] = useState(GREETINGS[0])
  useModalBackButton(() => setDialOpen(false), dialOpen)

  const toggleDial = () => {
    if (!dialOpen) {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
      // 지원 기기(안드로이드)에서만 아주 짧은 햅틱 — 눌린 손맛
      navigator.vibrate?.(8)
    }
    setDialOpen((v) => !v)
  }

  const runAction = (key: (typeof DIAL_ACTIONS)[number]['key']) => {
    setDialOpen(false)
    if (key === 'prayer') onComposeClick()
    else if (key === 'thanks') onThanksClick()
    else onVerseCardClick()
  }

  return (
    <div className="relative px-3 pb-3 pt-7">
      {/* 다이얼 열림 — 배경을 살짝 눌러 시선을 모은다 */}
      {dialOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px] dial-fade"
          onClick={() => setDialOpen(false)}
          aria-hidden
        />
      )}

      {/* 스피드 다이얼 액션 — FAB 위로 순서대로 튀어오른다 */}
      {dialOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[-14px] -translate-y-full z-30 flex flex-col items-center gap-2.5">
          {/* 인사 한 줄 — 알약들이 자리잡은 뒤 마지막에 스르륵 */}
          <p
            className="dial-item text-[13px] font-medium text-white/85 mb-1 select-none"
            style={{ animationDelay: `${DIAL_ACTIONS.length * 45 + 60}ms` }}
          >
            <span aria-hidden className="mr-1 text-[11px] opacity-70">✦</span>
            {greeting}
          </p>
          {DIAL_ACTIONS.map((action, i) => (
            <button
              key={action.key}
              type="button"
              onClick={() => runAction(action.key)}
              // 도크와 같은 유리 질감 — 바에서 떠올라온 조각처럼 보이게 키를 맞춘다
              className="dial-item flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full backdrop-blur-xl bg-white/95 dark:bg-[#201f1f]/95 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.05] dark:ring-white/[0.08] active:scale-95 transition-transform"
              // 아래(기도)부터 위로 순서대로 등장
              style={{ animationDelay: `${(DIAL_ACTIONS.length - 1 - i) * 45}ms` }}
            >
              <span
                className={`dial-emoji w-9 h-9 rounded-full ${action.tint} flex items-center justify-center text-[17px]`}
                // 알약이 자리잡은 직후 이모지가 통통 튀며 착지
                style={{ animationDelay: `${(DIAL_ACTIONS.length - 1 - i) * 45 + 90}ms` }}
                aria-hidden
              >
                {action.emoji}
              </span>
              <span className="text-[13.5px] font-bold text-ink-strong whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dial-pop {
          from { opacity: 0; transform: translateY(14px) scale(0.9); }
          to { opacity: 1; transform: none; }
        }
        .dial-item {
          animation: dial-pop 0.22s cubic-bezier(0.2, 0.9, 0.35, 1.2) both;
        }
        @keyframes dial-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dial-fade { animation: dial-fade-in 0.18s ease both; }

        /* 젤리 팝 — 누르는 순간 눌렸다가 통통 튀며 제자리로 (transform엔 센터링 translate 포함) */
        @keyframes fab-pop {
          0% { transform: translateX(-50%) scale(0.82); }
          45% { transform: translateX(-50%) scale(1.1); }
          70% { transform: translateX(-50%) scale(0.96); }
          100% { transform: translateX(-50%) scale(1); }
        }
        /* fill 없음 — 끝나면 transform 잠금을 풀어 ×를 다시 누를 때의 active:scale이 살아있게 */
        .fab-pop { animation: fab-pop 0.4s cubic-bezier(0.3, 1.4, 0.5, 1); }

        /* 얼굴 전환 — 스파클이 접혀 들어가고 ×가 스프링 회전으로 나온다 */
        .fab-face {
          transition: transform 0.32s cubic-bezier(0.34, 1.6, 0.5, 1), opacity 0.18s ease;
          transform-box: fill-box;
          transform-origin: center;
        }
        .fab-face-hidden { opacity: 0; transform: rotate(-90deg) scale(0.3); }

        /* 잔잔한 윙크 — 작은 스파클이 이따금 반짝이며 "눌러볼래?" */
        @keyframes fab-wink {
          0%, 74%, 100% { opacity: 1; transform: scale(1); }
          80% { opacity: 0.15; transform: scale(0.5); }
          87% { opacity: 1; transform: scale(1.3); }
          93% { transform: scale(1); }
        }
        .fab-wink {
          animation: fab-wink 3.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        /* 숨쉬는 후광 — 도크에 안긴 채 조용히 살아있다는 신호 */
        @keyframes fab-breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.12); }
        }
        .fab-halo { animation: fab-breathe 3.2s ease-in-out infinite; }

        /* 열림 — 한 번 퍼지는 링 */
        @keyframes fab-ring {
          from { opacity: 0.5; transform: scale(0.72); }
          to { opacity: 0; transform: scale(1.8); }
        }
        .fab-ring { animation: fab-ring 0.5s ease-out forwards; }

        /* 열림 — 반짝 파편이 위로 흩어진다 */
        @keyframes fab-spark {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4) rotate(0deg); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(var(--ss)) rotate(120deg); }
        }
        .fab-spark { animation: fab-spark 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) forwards; }

        /* 알약 이모지 착지 — 자리를 잡은 뒤 통통 */
        @keyframes dial-emoji-pop {
          0% { transform: scale(0.3) rotate(-14deg); }
          60% { transform: scale(1.18) rotate(6deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .dial-emoji { animation: dial-emoji-pop 0.34s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .dial-item, .dial-fade, .fab-pop, .fab-wink, .fab-halo, .fab-ring, .fab-spark, .dial-emoji {
            animation: none;
          }
          .fab-spark { display: none; }
        }
      `}</style>
      {/* Glass dock — 카드 시스템과 동일한 #1c1c26/80 + 상단 1px 빛줄 + soft purple shadow.
          상단 중앙은 dock-notch 마스크(S-커브 SVG)로 부드럽게 깎아내려 FAB가 안기게 한다 */}
      <nav
        className="dock-notch relative backdrop-blur-xl bg-white/80 dark:bg-[#201f1f]/90 border border-black/[0.04] dark:border-white/[0.08] rounded-2xl px-5 py-2 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_24px_var(--brand-soft)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        {/* 다크모드 카드 표면 그라데이션 — 카드 시스템과 동일 */}
        <div className="hidden dark:block absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        {/* Home */}
        <button
          onClick={onScrollToTop}
          aria-label="홈"
          className={navItemClass}
        >
          <svg
            className="w-[26px] h-[26px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 11.5 12 3l9 8.5" />
            <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
          </svg>
        </button>

        {/* Bible — FAB 왼쪽 '말씀' 자리. 책 아이콘은 성경 전용으로 두고 집중기도는 기도 아이콘으로 분리 */}
        <button
          onClick={onBibleClick}
          aria-label="성경"
          aria-busy={pendingPath === '/bible'}
          className={navItemClass}
        >
          {pendingPath === '/bible' ? (
            <NavSpinner />
          ) : (
            <span className="material-icons-outlined text-[26px]">menu_book</span>
          )}
        </button>

        {/* 중앙 자리 비움 — 떠 있는 FAB(아래 형제 요소)가 이 위에 얹힌다 */}
        <div aria-hidden className="w-12 h-12" />

        {/* Focus — 집중 기도 모드. 촛불·두 손 같은 구상적 은유는 유치하다는 피드백으로,
            '정해진 시간 동안 집중'을 그대로 말하는 스톱워치로 확정.
            상단 버튼 + 바늘 하나뿐인 최소 형태(Lucide timer 계열) */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도 모드"
          aria-busy={pendingPath === '/prayer-focus'}
          className={navItemClass}
        >
          {pendingPath === '/prayer-focus' ? (
            <NavSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* 상단 누름 버튼 */}
              <path d="M10 2.5h4" />
              {/* 몸통 다이얼 */}
              <circle cx="12" cy="14" r="7.5" />
              {/* 바늘 — 1~2시 방향 한 개만 */}
              <path d="M12 14l2.7-2.7" />
            </svg>
          )}
        </button>

        {/* Profile — saturated 원형 금지, outline으로 평탄화 */}
        <button
          onClick={onProfileClick}
          aria-label="프로필"
          aria-busy={pendingPath === '/profile'}
          className={navItemClass}
        >
          {pendingPath === '/profile' ? (
            <NavSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          )}
        </button>
      </nav>

      {/* Compose FAB — 노치 위에 떠 있는 원형 버튼. 바(mask)와 분리된 형제 요소라 잘리지 않는다.
          원 중심이 바 상단 모서리에 오도록 배치해 절반은 위로 솟고 절반은 노치에 안긴다.
          얼굴은 +가 아니라 반짝임(✦) — 평소엔 작은 스파클이 이따금 윙크하며 숨 쉬고,
          누르는 순간 반짝 파편이 퍼지며 스파클이 접히고 ×가 스프링 회전으로 나온다.
          "반짝이는 걸 발견해서 눌렀더니 나눌 거리가 쏟아진다"는 손맛 */}
      <button
        onClick={toggleDial}
        aria-label={dialOpen ? '나눔 메뉴 닫기' : '나눔 메뉴 열기'}
        aria-expanded={dialOpen}
        className={`absolute left-1/2 -translate-x-1/2 top-0 z-30 flex items-center justify-center w-14 h-14 rounded-full text-white bg-gradient-to-br from-[#69a8ff] via-[var(--brand)] to-[#3f5efb] shadow-[0_6px_16px_-2px_var(--brand-glow)] ring-1 ring-white/20 dark:ring-white/15 active:scale-[0.82] transition-transform duration-150${dialOpen ? ' fab-pop' : ''}`}
      >
        {/* 숨쉬는 후광 — 도크 뒤에서 은은하게 (버튼 첫 자식이라 광택·아이콘 뒤에 깔린다) */}
        <span
          aria-hidden
          className="fab-halo absolute -inset-1 rounded-full bg-[var(--brand-glow)] blur-md pointer-events-none"
        />
        {/* 위쪽 절반 유리 광택 — 평면 채움이 아니라 살짝 부푼 버튼처럼 보이게 */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />

        {/* 열림 — 퍼지는 링 + 반짝 파편 (열 때마다 새로 마운트되어 재생) */}
        {dialOpen && (
          <>
            <span
              aria-hidden
              className="fab-ring absolute inset-0 rounded-full ring-2 ring-white/50 pointer-events-none"
            />
            {FAB_SPARKS.map((spark, i) => (
              <span
                key={i}
                aria-hidden
                className="fab-spark absolute left-1/2 top-1/2 -ml-[5px] -mt-[6px] text-[11px] leading-none text-white pointer-events-none"
                style={
                  {
                    '--sx': `${spark.x}px`,
                    '--sy': `${spark.y}px`,
                    '--ss': `${spark.s}`,
                    animationDelay: `${spark.d}ms`,
                  } as React.CSSProperties
                }
              >
                ✦
              </span>
            ))}
          </>
        )}

        {/* 얼굴 — 스파클(닫힘) ↔ ×(열림) 크로스페이드, 두 얼굴을 겹쳐두고 회전·스케일로 교대 */}
        <svg className="relative w-7 h-7" viewBox="0 0 24 24" aria-hidden>
          {/* 스파클 얼굴 — 큰 별 + 윙크하는 작은 별 */}
          <g className={`fab-face${dialOpen ? ' fab-face-hidden' : ''}`} fill="currentColor">
            <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
            <path
              className="fab-wink"
              d="M17.8 4.6 C18.08 6.06 18.94 6.92 20.4 7.2 C18.94 7.48 18.08 8.34 17.8 9.8 C17.52 8.34 16.66 7.48 15.2 7.2 C16.66 6.92 17.52 6.06 17.8 4.6 Z"
            />
          </g>
          {/* × 얼굴 */}
          <g
            className={`fab-face${dialOpen ? '' : ' fab-face-hidden'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
          </g>
        </svg>
      </button>
    </div>
  )
}

export default BottomNavigation
