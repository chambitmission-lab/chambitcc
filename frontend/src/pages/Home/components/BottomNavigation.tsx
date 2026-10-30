import { useState } from 'react'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import SharePostcards from '../../../components/share/SharePostcards'
import SharePostcardButton from '../../../components/share/SharePostcardButton'
import { prewarmPostcardFont, type PostcardKey } from '../../../components/share/sharePostcardsShared'

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
  // 아이콘 + 라벨 세로 탭. 모바일엔 hover 가 없어 누르는 순간(active)만 반응한다
  const navItemClass =
    'dock-tab relative z-10 flex flex-col items-center gap-[3px] py-1 active:scale-[0.92] transition-transform duration-150'

  // FAB 스피드 다이얼 — 기도·감사·말씀카드 세 가지 "나눔"의 허브
  const [dialOpen, setDialOpen] = useState(false)
  useModalBackButton(() => setDialOpen(false), dialOpen)

  const toggleDial = () => {
    if (!dialOpen) {
      // 지원 기기(안드로이드)에서만 아주 짧은 햅틱 — 눌린 손맛
      navigator.vibrate?.(8)
    }
    setDialOpen((v) => !v)
  }

  // 엽서가 날아간 뒤 — 다이얼을 닫고 작성 창을 연다
  const runAction = (key: PostcardKey) => {
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

      {/* 하늘 우체국 엽서 — PC 레일 다이얼과 같은 엽서를, 좁은 폭에 맞춰 가로 엽서 더미로.
          엄지에 가까운 맨 아래가 주 액션(기도). 고른 엽서는 하늘로 날아간 뒤 작성 창이 열린다. */}
      {dialOpen && (
        <SharePostcards
          variant="dock"
          className="absolute left-1/2 -translate-x-1/2 top-[-14px] -translate-y-full z-30"
          onSend={runAction}
        />
      )}

      <style>{`
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

        /* 탭 — 아이콘 알약(지금 여기는 연한 브랜드 면) + 작은 라벨 */
        .dock-pill {
          display: grid; place-items: center; width: 52px; height: 30px; border-radius: 9999px;
          color: var(--text-muted); transition: background-color .15s, color .15s;
        }
        .dock-pill.is-active { background: var(--brand-soft); color: var(--brand); }
        .dock-tab:active .dock-pill:not(.is-active) { background: var(--surface-inset); color: var(--text-body); }
        .dock-label {
          font-size: 11px; line-height: 1; font-weight: 600; letter-spacing: -0.02em;
          color: var(--text-muted); white-space: nowrap;
        }
        .dock-label.is-active { color: var(--brand); font-weight: 700; }
        .dock-label--hand {
          font-family: 'Gaegu', var(--font-sans, system-ui), cursive;
          font-size: 13.5px; font-weight: 700; letter-spacing: -0.04em; color: var(--brand);
        }
        /* 엽서 밑 잔잔한 빛 — 흰 바 위 미색 엽서가 묻히지 않게 바닥에 파란 빛을 깐다.
           가만히 있는 빛이다(유휴 반복 애니메이션 금지) */
        .dock-card-glow {
          position: absolute; left: 50%; top: 50%; width: 120px; height: 96px; margin: -48px 0 0 -60px;
          border-radius: 9999px; pointer-events: none;
          background: radial-gradient(closest-side, var(--dock-glow) 0%, color-mix(in srgb, var(--dock-glow) 45%, transparent) 55%, transparent 100%);
          filter: blur(6px);
        }
        /* 엽서 자체도 파란 빛을 두른다 — 둘레 후광 + 바닥 쪽 번짐 */
        .dock-fab .share-pcb__face {
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--brand) var(--dock-ring), transparent),
            0 0 16px 2px var(--dock-glow),
            0 10px 22px -8px var(--dock-glow),
            var(--card-shadow);
        }

        @media (prefers-reduced-motion: reduce) {
          .dial-fade, .fab-pop {
            animation: none;
          }
        }
      `}</style>
      {/* 도크 — 흰 크롬 바 + 선화 아이콘 4개(라벨 동반) + 가운데 우체통 투입구.
          ★ 예전엔 바 상단을 둥근 FAB 모양으로 깎았는데(dock-notch), 나누기 버튼이 기운 엽서가 된 뒤로
            둥근 홈과 네모 엽서가 따로 놀아 깎지 않는다. 엽서 아래 '우체통 투입구'도 그려 봤지만
            깔린 엽서에 반쯤 가려 얼룩처럼 보여 뺐다 — 대신 엽서 밑에 잔잔한 파란 빛을 깐다(2026-10-30).
          ★ 아이콘은 같은 선 굵기(1.8) 선화로 통일 — 성경만 Material 면 아이콘이라 혼자 무거웠다.
          ★ 라벨은 노안 성도도 알아보게. 이 도크는 홈에만 있으므로 홈 탭이 늘 '지금 여기'. */}
      <nav className="relative rounded-[22px] bg-[color-mix(in_srgb,var(--surface-container)_92%,transparent)] backdrop-blur-xl border border-[var(--card-border)] shadow-[0_6px_24px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.6)] px-2 pt-1.5 pb-1.5 grid grid-cols-5 items-end">
        {/* Home — 지금 여기 */}
        <button
          onClick={onScrollToTop}
          aria-label="홈"
          aria-current="page"
          className={navItemClass}
        >
          <span className="dock-pill is-active">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 11.5 12 3l9 8.5" />
              <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
            </svg>
          </span>
          <span className="dock-label is-active">홈</span>
        </button>

        {/* Bible — 펼친 책 선화. 책 아이콘은 성경 전용, 집중기도는 스톱워치로 분리 */}
        <button
          onClick={onBibleClick}
          aria-label="성경"
          aria-busy={pendingPath === '/bible'}
          className={navItemClass}
        >
          <span className="dock-pill">
            {pendingPath === '/bible' ? (
              <NavSpinner />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 6.5C10.2 5.1 7.6 4.5 3.5 4.6v13.6c4.1-.1 6.7.5 8.5 1.9 1.8-1.4 4.4-2 8.5-1.9V4.6c-4.1-.1-6.7.5-8.5 1.9z" />
                <path d="M12 6.5v13.6" />
              </svg>
            )}
          </span>
          <span className="dock-label">성경</span>
        </button>

        {/* 가운데 — 엽서(FAB, 아래 형제 요소) 자리 + 손글씨 라벨 */}
        <div aria-hidden className="flex flex-col items-center justify-end pb-[3px]">
          <span className="dock-label dock-label--hand">나누기</span>
        </div>

        {/* Focus — 집중 기도 모드. 촛불·두 손 같은 구상적 은유는 유치하다는 피드백으로,
            '정해진 시간 동안 집중'을 그대로 말하는 스톱워치로 확정 */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도 모드"
          aria-busy={pendingPath === '/prayer-focus'}
          className={navItemClass}
        >
          <span className="dock-pill">
            {pendingPath === '/prayer-focus' ? (
              <NavSpinner />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2.5h4" />
                <circle cx="12" cy="14" r="7.5" />
                <path d="M12 14l2.7-2.7" />
              </svg>
            )}
          </span>
          <span className="dock-label">집중 기도</span>
        </button>

        {/* Profile */}
        <button
          onClick={onProfileClick}
          aria-label="프로필"
          aria-busy={pendingPath === '/profile'}
          className={navItemClass}
        >
          <span className="dock-pill">
            {pendingPath === '/profile' ? (
              <NavSpinner />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
              </svg>
            )}
          </span>
          <span className="dock-label">프로필</span>
        </button>
      </nav>

      {/* 나누기 FAB — 노치 위에 떠 있는 엽서 묶음(SharePostcardButton). 바(mask)와 분리된 형제 요소라
          잘리지 않는다. 누르면 젤리 팝 + 깔린 엽서가 빠져나가 위의 가로 엽서 더미가 되고 소인 자리에 × 가 온다.
          (종이비행기 원형 FAB·숨쉬는 후광·별 윙크는 2026-10-30 엽서 문법으로 교체 — 유휴 반복 없음) */}
      <div
        // 빛 세기 — 흰 바탕에선 같은 빛이 옅게 흩어져 라이트만 진하게(다크는 브랜드 빛 그대로가 딱 맞음)
        className={`absolute left-1/2 -translate-x-1/2 top-2 z-30 [--dock-glow:rgba(49,130,246,0.5)] [--dock-ring:34%] dark:[--dock-glow:var(--brand-glow)] dark:[--dock-ring:22%]${dialOpen ? ' fab-pop' : ''}`}
      >
        <span aria-hidden className="dock-card-glow" />
        <SharePostcardButton
          variant="dock"
          open={dialOpen}
          onClick={toggleDial}
          // 손가락이 닿는 순간 손글씨 서체를 미리 — 열린 뒤 받으면 엽서 글씨가 툭 바뀐다
          onPointerDown={prewarmPostcardFont}
          aria-label={dialOpen ? '나눔 메뉴 닫기' : '나눔 메뉴 열기'}
          aria-expanded={dialOpen}
          className="dock-fab"
        />
      </div>
    </div>
  )
}

export default BottomNavigation
