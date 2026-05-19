interface BottomNavigationProps {
  onProfileClick: () => void
  onComposeClick: () => void
  onScrollToTop: () => void
  onFocusModeClick: () => void
}

const BottomNavigation = ({
  onProfileClick,
  onComposeClick,
  onScrollToTop,
  onFocusModeClick,
}: BottomNavigationProps) => {
  return (
    <div className="relative px-3 pb-3 pt-6">
      {/* 중앙 Compose FAB — dock 위로 살짝 들어올린 유일한 saturated 액센트.
          FAB 윗쪽은 페이지 배경(#0b0b12) 위, 아랫쪽은 dock 카드(#1c1c26) 위에 걸쳐 있어 단일 색 ring으로는 한쪽이 항상 도넛처럼 보임 → ring 제거하고 보라 halo + 부드러운 그림자로만 부유감 표현. */}
      <button
        onClick={onComposeClick}
        aria-label="기도 작성"
        className="absolute left-1/2 -translate-x-1/2 top-0 z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_0_6px_rgba(168,85,247,0.10),0_10px_28px_rgba(168,85,247,0.55),0_4px_12px_rgba(236,72,153,0.30)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <span className="absolute inset-0 rounded-full bg-purple-500/40 animate-ping opacity-40 pointer-events-none" />
        <svg
          className="w-7 h-7 relative z-10"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          viewBox="0 0 24 24"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Glass dock — 카드 시스템과 동일한 #1c1c26/80 + 상단 1px 빛줄 + soft purple shadow */}
      <nav
        className="relative backdrop-blur-xl bg-white/80 dark:bg-[#1c1c26]/85 border border-black/[0.04] dark:border-white/[0.08] rounded-2xl px-5 py-2 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_24px_rgba(168,85,247,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),0_12px_28px_rgba(168,85,247,0.20),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        {/* 다크모드 카드 표면 그라데이션 — 카드 시스템과 동일 */}
        <div className="hidden dark:block absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        {/* Home */}
        <button
          onClick={onScrollToTop}
          aria-label="홈"
          className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
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

        {/* Focus — 흡수된 집중 기도 모드. outline 톤으로 다른 nav와 동일 가중치 */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도 모드"
          className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
        >
          <span className="material-icons-outlined text-[26px]">auto_stories</span>
        </button>

        {/* Compose 슬롯 — FAB이 위로 들어올려져 시각적 빈자리. 폭만 확보 */}
        <div className="w-14 h-12" aria-hidden="true" />

        {/* Profile — saturated 원형 금지, outline으로 평탄화 */}
        <button
          onClick={onProfileClick}
          aria-label="프로필"
          className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
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
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
          </svg>
        </button>
      </nav>
    </div>
  )
}

export default BottomNavigation
