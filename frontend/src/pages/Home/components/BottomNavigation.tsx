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

        {/* Focus — FAB 오른쪽 '기도' 자리. 빛이 나는 십자가.
            라틴 십자가 본체(currentColor, hover 시 보라) 뒤에 보라 글로우(feGaussianBlur)를 깔아
            "빛나는 십자가"를 표현. 글로우 색은 브랜드 액센트(purple) 고정 — 집중 기도 모드를 은은히 강조 */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도 모드"
          className={navItemClass}
        >
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24">
            <defs>
              <filter id="crossGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="1.1" />
              </filter>
            </defs>
            {/* 발광(글로우) — 십자가 뒤에 깔리는 보라 빛 */}
            <g
              filter="url(#crossGlow)"
              style={{ stroke: "var(--brand)" }}
              strokeWidth={3.4}
              strokeLinecap="round"
              fill="none"
            >
              <path d="M12 4.2V19.8" />
              <path d="M8 9H16" />
            </g>
            {/* 십자가 본체 */}
            <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" fill="none">
              <path d="M12 4.2V19.8" />
              <path d="M8 9H16" />
            </g>
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
