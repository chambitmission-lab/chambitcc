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
  useModalBackButton(() => setDialOpen(false), dialOpen)

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
          {DIAL_ACTIONS.map((action, i) => (
            <button
              key={action.key}
              type="button"
              onClick={() => runAction(action.key)}
              className="dial-item flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full bg-white dark:bg-[#26262e] shadow-[0_8px_24px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.05] dark:ring-white/10 active:scale-95 transition-transform"
              // 아래(기도)부터 위로 순서대로 등장
              style={{ animationDelay: `${(DIAL_ACTIONS.length - 1 - i) * 45}ms` }}
            >
              <span
                className={`w-9 h-9 rounded-full ${action.tint} flex items-center justify-center text-[17px]`}
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
        @media (prefers-reduced-motion: reduce) {
          .dial-item, .dial-fade { animation: none; }
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

      {/* Compose FAB — 노치 위에 떠 있는 원형 + 버튼. 바(mask)와 분리된 형제 요소라 잘리지 않는다.
          원 중심이 바 상단 모서리에 오도록 배치해 절반은 위로 솟고 절반은 노치에 안긴다.
          탭하면 기도·감사·말씀카드 스피드 다이얼이 열리고 +가 ×로 회전한다 */}
      <button
        onClick={() => setDialOpen((v) => !v)}
        aria-label={dialOpen ? '나눔 메뉴 닫기' : '나눔 메뉴 열기'}
        aria-expanded={dialOpen}
        className="absolute left-1/2 -translate-x-1/2 top-0 z-30 flex items-center justify-center w-14 h-14 rounded-full text-white bg-gradient-to-br from-[#69a8ff] via-[var(--brand)] to-[#3f5efb] shadow-[0_6px_16px_-2px_var(--brand-glow)] ring-1 ring-white/20 dark:ring-white/15 active:scale-90 transition-transform duration-150"
      >
        {/* 위쪽 절반 유리 광택 — 평면 채움이 아니라 살짝 부푼 버튼처럼 보이게 */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />
        <svg
          className={`relative w-7 h-7 transition-transform duration-200 ${dialOpen ? 'rotate-45' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

export default BottomNavigation
