interface BottomNavigationProps {
  onProfileClick: () => void
  onComposeClick: () => void
  onScrollToTop: () => void
  onFocusModeClick: () => void
  onBibleClick: () => void
}

const BottomNavigation = ({
  onProfileClick,
  onComposeClick,
  onScrollToTop,
  onFocusModeClick,
  onBibleClick,
}: BottomNavigationProps) => {
  // 모바일엔 hover가 없어 탭 피드백이 전혀 없었음 — active로 즉각 반응을 준다
  const navItemClass =
    'relative z-10 flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)] active:text-brand active:bg-[var(--brand-soft)] active:scale-90 transition-[color,background-color,transform] duration-150'

  return (
    <div className="relative px-3 pb-3 pt-2">
      {/* Glass dock — 카드 시스템과 동일한 #1c1c26/80 + 상단 1px 빛줄 + soft purple shadow */}
      <nav
        className="relative backdrop-blur-xl bg-white/80 dark:bg-[#201f1f]/90 border border-black/[0.04] dark:border-white/[0.08] rounded-2xl px-5 py-2 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_24px_var(--brand-soft)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
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
          className={navItemClass}
        >
          <span className="material-icons-outlined text-[26px]">menu_book</span>
        </button>

        {/* Compose — dock 행 안에 앉힌 단색 채움 원. 채움 자체가 유일한 강조라 halo·glow·애니메이션은 두지 않는다 */}
        <button
          onClick={onComposeClick}
          aria-label="기도 작성"
          className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand)] text-white active:scale-90 transition-transform duration-150"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            viewBox="0 0 24 24"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Focus — 집중 기도 모드. 십자가는 중앙 '기도 등록'(+)과 의미가 겹쳐 촛불로 교체,
            다른 아이콘과 같은 조용한 스트로크로 통일해 dock의 강조는 중앙 채움 원 하나만 남긴다 */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도 모드"
          className={navItemClass}
        >
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24">
            <defs>
              <radialGradient id="candleGlow">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#fbbf24" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* 불꽃이 주변을 비추는 빛 무리 */}
            <circle cx="12" cy="6.6" r="7" fill="url(#candleGlow)" />
            {/* 불꽃 — 앰버 겉불꽃 + 노랑 속불꽃. hover 색 변화와 무관하게 항상 따뜻한 색 유지 */}
            <path
              d="M12 2.4c-1.8 2.1-2.7 3.5-2.7 4.8a2.7 2.7 0 0 0 5.4 0c0-1.3-.9-2.7-2.7-4.8Z"
              fill="#f59e0b"
            />
            <path
              d="M12 5.1c-.9 1.1-1.3 1.9-1.3 2.5a1.3 1.3 0 0 0 2.6 0c0-.6-.4-1.4-1.3-2.5Z"
              fill="#fde047"
            />
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* 심지 */}
              <path d="M12 10.1v1.4" />
              {/* 몸통 — 윗면이 녹아 내려앉은 물결 림 */}
              <path d="M8.8 12.6c1.1.8 2.1-.6 3.2-.3 1.1.3 2.1.9 3.2.3V19.2a1.6 1.6 0 0 1-1.6 1.6h-3.2A1.6 1.6 0 0 1 8.8 19.2Z" />
            </g>
            {/* 흘러내린 촛농 — 림에서 가늘게 흘러 끝에 방울로 맺힘 */}
            <path
              d="M10.7 13.2v2.4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.3}
              strokeLinecap="round"
            />
            <circle cx="10.7" cy="16.4" r="1" fill="currentColor" />
          </svg>
        </button>

        {/* Profile — saturated 원형 금지, outline으로 평탄화 */}
        <button
          onClick={onProfileClick}
          aria-label="프로필"
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
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
          </svg>
        </button>
      </nav>
    </div>
  )
}

export default BottomNavigation
