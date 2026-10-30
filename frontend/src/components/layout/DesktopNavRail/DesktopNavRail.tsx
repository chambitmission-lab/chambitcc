import { useEffect, useState } from 'react'
// 내비 글리프도 같은 Phosphor 세트 — 비활성은 굵은 선(bold), 활성은 면이 차오르는 duotone
import {
  BookOpenText,
  House,
  ImageSquare,
  Path,
  Timer,
  UserCircle,
  UsersThree,
} from '../../icons/phosphor'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../contexts/ThemeContext'
import { prewarmThemeToggle, pairSrc, RAIL_BOTTOM } from '../../../utils/themeAssets'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { useLanguage } from '../../../contexts/LanguageContext'
import { preloadRoute, isRoutePreloaded } from '../../../utils/routePreload'
import SharePostcards from '../../share/SharePostcards'
import SharePostcardButton from '../../share/SharePostcardButton'
import { prewarmPostcardFont, type PostcardKey } from '../../share/sharePostcardsShared'

// PC 전용 좌측 내비 레일 (lg+) — 모바일 하단 도크(BottomNavigation)의 데스크톱 대응물.
// 홈 전용 컴포넌트였다가 전역 레이아웃으로 승격: 모든 페이지에서 App.tsx가 렌더링한다.
// lg에선 아이콘만, xl부터 라벨이 함께 보인다 (인스타그램 데스크톱 문법).
// 자주 가는 핵심 목적지만 담고, 예배·설교·일정 등 안내 페이지는 헤더 인라인 메뉴(DesktopNav)가 담당한다.

// 레일 표시 여부 훅은 ./useDesktopRailVisible 로 분리 — 이 파일은 PC 에서만 lazy 로 받는다.
import { useDesktopRailVisible } from './useDesktopRailVisible'
import './DesktopNavRail.css'

/** 라벨이 보이는 폭(xl)인가 — 하단 삽화는 이 폭에서만 쓰므로, 좁은 화면 사용자에게는
    파일 자체를 물리지 않는다. 창을 넓히면 그때 받는다(리사이즈에 반응해야 하는 이유). */
const useIsXl = (): boolean => {
  const [isXl, setIsXl] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const sync = () => setIsXl(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return isXl
}

// 하단 삽화를 끄는 화면 — 배경 그림이 화면 전체를 덮는 페이지에서는 레일의 언덕과
// 그 그림이 레일 경계에서 맞닿아 서로를 깎아 먹는다(/bible/atlas 의 성지 수채화).
// 그림이 둘이면 하나는 져야 하고, 그 화면에서는 본문이 주인공이다.
const ART_FREE_PATHS = ['/bible/atlas']

// 활성 항목 좌측 바 — 컴포넌트 안에서 선언하면 렌더마다 새 타입이라 리마운트된다. 모듈 최상위에 고정
const ActiveBar = () => (
  <span
    className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-brand"
    aria-hidden
  />
)

const RailSpinner = () => (
  <span className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
)

/** 내비 글리프 공통 크기 — 활성만 duotone 으로 면이 차오른다.
    노안 대응으로 24 → 26(레일 글씨 크기 배율은 DesktopNavRail.css `--rl`) */
const GLYPH = 26


// 아이콘만 보이는 폭(lg~xl 미만)에서 "이게 무슨 메뉴인지"를 알려주는 호버 툴팁.
// 색은 반전 토큰(--text-strong 배경 / --surface-container 글자)이라 라이트·다크 모두 대응.
//   right: 내비 항목 — 라벨이 나오는 xl부터는 숨긴다
//   top  : 라벨이 아예 없는 유틸 버튼 — 모든 폭에서 보인다
const RailTip = ({
  label,
  placement = 'right',
  hideAtXl = false,
}: {
  label: string
  placement?: 'right' | 'top'
  /** xl에서 버튼에 라벨이 직접 붙는 경우(테마 토글) 툴팁은 중복이라 감춘다 */
  hideAtXl?: boolean
}) => (
  <span
    role="tooltip"
    className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[var(--text-strong)] px-3 py-2 text-[length:calc(14px*var(--rl,1))] font-semibold text-[var(--surface-container)] shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
      placement === 'right'
        ? 'left-[calc(100%_+_10px)] top-1/2 -translate-y-1/2 xl:hidden'
        : `bottom-[calc(100%_+_8px)] left-1/2 -translate-x-1/2${hideAtXl ? ' xl:hidden' : ''}`
    }`}
  >
    {label}
  </span>
)

const DesktopNavRail = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { requireAuth, requireAuthWithRedirect, isLoggedIn } = useAuth()
  // lazy 청크를 받는 중인 목적지 경로 — 해당 아이콘 자리에 스피너
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  // 나누기 스피드 다이얼 — 모바일 홈 FAB과 같은 3액션(기도·감사·말씀 카드)을 팝오버로
  const [dialOpen, setDialOpen] = useState(false)
  const visible = useDesktopRailVisible()
  const { theme, toggleTheme } = useTheme()
  // 레일 하단 삽화 — 테마 쌍을 등록해 두면 토글 직전 선요청이 반대 테마를 챙긴다
  const showRailArt = useIsXl() && !ART_FREE_PATHS.some((p) => pathname.startsWith(p))
  const railArtReady = useThemeArt(RAIL_BOTTOM, showRailArt)
  const { t } = useLanguage()

  // 청크가 아직 안 왔으면 다운로드를 기다렸다가 이동한다 (startTransition 중엔
  // Suspense fallback이 뜨지 않아 "안 눌린 것처럼" 보이는 문제 방지).
  const goLazy = async (path: string) => {
    if (pathname === path) return
    if (isRoutePreloaded(path)) {
      navigate(path)
      return
    }
    setPendingPath(path)
    try {
      await preloadRoute(path)
    } finally {
      setPendingPath(null)
    }
    navigate(path)
  }

  if (!visible) return null

  const handleHomeClick = () => {
    if (pathname !== '/') {
      navigate('/')
      return
    }
    // 이미 홈이면 최상단으로 (루트 오버플로우 구조상 가능한 스크롤 요소 모두)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const root = document.getElementById('root')
    if (root) root.scrollTop = 0
  }

  const handleProfileClick = () => {
    // 비로그인이면 기존 경로 그대로 (토스트 후 /login)
    if (!isLoggedIn()) {
      requireAuthWithRedirect('/profile')
      return
    }
    void goLazy('/profile')
  }

  // 나눔 액션은 홈의 컴포저가 담당 — 어느 페이지에서든 홈으로 이동하며 state로 열어달라고 전달
  const handleComposeClick = () => {
    requireAuth(() =>
      navigate('/', { state: { openComposer: true }, replace: pathname === '/' }),
    )
  }
  const handleThanksClick = () => {
    requireAuth(() =>
      navigate('/', { state: { openThanks: true }, replace: pathname === '/' }),
    )
  }

  // 엽서가 날아간 뒤 — 다이얼을 닫고 작성 창을 연다
  const sendPostcard = (key: PostcardKey) => {
    setDialOpen(false)
    if (key === 'prayer') handleComposeClick()
    else if (key === 'thanks') handleThanksClick()
    else void goLazy('/bible/photo-verse')
  }

  const isHomeActive = pathname === '/'
  const isVerseCardActive = pathname === '/bible/photo-verse'
  const isBibleActive = pathname.startsWith('/bible') && !isVerseCardActive
  const isGroupsActive = pathname.startsWith('/groups')
  const isGrowthActive = pathname === '/growth'
  const isProfileActive = pathname === '/profile'

  // 하단 도크와 같은 가벼운 아이콘 언어 유지. 활성은 브랜드 연한 배경 + 좌측 바 인디케이터만
  const itemClass = (active: boolean) =>
    `group relative flex items-center justify-center xl:justify-start gap-3.5 h-[52px] rounded-xl px-0 xl:px-3 active:scale-[0.97] transition-[color,background-color,transform] duration-150 ${
      active
        ? 'text-brand bg-[var(--brand-soft)]'
        : 'text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)]'
    }`
  const labelClass = (active: boolean) =>
    `hidden xl:inline text-[length:calc(17px*var(--rl,1))] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`

  return (
    <aside
      // 레일은 배경과 한 몸 — 크롬(헤더 + 레일)을 캔버스와 같은 톤(--desktop-chrome)으로 깐다.
      // 세로 헤어라인도, 흰 레일 vs 회색 캔버스의 세로 이음새도 없다(둘 다 어색하다는 피드백).
      // 화면의 층은 오직 "바닥(캔버스) / 떠 있는 흰 카드" 둘뿐이다.
      // chrome-type: 헤더와 함께 G마켓 산스로 그리는 "앱의 틀" (styles/gmarket-sans.css, lg+ 에서만)
      // 헤더 '가' 배율은 <html data-text-scale> 에서 CSS 로 상속(DesktopNavRail.css --rl)
      className="desktop-rail chrome-type hidden lg:flex fixed left-0 top-14 bottom-0 z-40 w-[76px] xl:w-[248px] flex-col bg-[var(--desktop-chrome)] px-3 xl:px-4 pt-6 pb-5"
      aria-label={t('railAria')}
    >
      <nav className="flex flex-col gap-1">
        {/* 홈 — 홈에서 다시 누르면 최상단 스크롤 */}
        <button
          onClick={handleHomeClick}
          aria-label={t('home')}
          aria-current={isHomeActive ? 'page' : undefined}
          className={itemClass(isHomeActive)}
        >
          {isHomeActive && <ActiveBar />}
          <House size={GLYPH} weight={isHomeActive ? 'duotone' : 'bold'} className="shrink-0" />
          <span className={labelClass(isHomeActive)}>{t('home')}</span>
          <RailTip label={t('home')} />
        </button>

        {/* 성경 */}
        <button
          onClick={() => void goLazy('/bible')}
          onMouseEnter={() => void preloadRoute('/bible')}
          aria-label={t('bible')}
          aria-current={isBibleActive ? 'page' : undefined}
          aria-busy={pendingPath === '/bible'}
          className={itemClass(isBibleActive)}
        >
          {isBibleActive && <ActiveBar />}
          {pendingPath === '/bible' ? (
            <RailSpinner />
          ) : (
            <BookOpenText
              size={GLYPH}
              weight={isBibleActive ? 'duotone' : 'bold'}
              className="shrink-0"
            />
          )}
          <span className={labelClass(isBibleActive)}>{t('bible')}</span>
          <RailTip label={t('bible')} />
        </button>

        {/* 집중 기도 — 하단 도크와 동일한 스톱워치 아이콘 */}
        <button
          onClick={() => void goLazy('/prayer-focus')}
          onMouseEnter={() => void preloadRoute('/prayer-focus')}
          aria-label={t('railPrayerFocus')}
          aria-busy={pendingPath === '/prayer-focus'}
          className={itemClass(false)}
        >
          {pendingPath === '/prayer-focus' ? (
            <RailSpinner />
          ) : (
            <Timer size={GLYPH} weight="bold" className="shrink-0" />
          )}
          <span className={labelClass(false)}>{t('railPrayerFocus')}</span>
          <RailTip label={t('railPrayerFocus')} />
        </button>

        {/* 말씀 사진 카드 만들기 */}
        <button
          onClick={() => void goLazy('/bible/photo-verse')}
          onMouseEnter={() => void preloadRoute('/bible/photo-verse')}
          aria-label={t('railShareVerseCard')}
          aria-current={isVerseCardActive ? 'page' : undefined}
          aria-busy={pendingPath === '/bible/photo-verse'}
          className={itemClass(isVerseCardActive)}
        >
          {isVerseCardActive && <ActiveBar />}
          {pendingPath === '/bible/photo-verse' ? (
            <RailSpinner />
          ) : (
            <ImageSquare
              size={GLYPH}
              weight={isVerseCardActive ? 'duotone' : 'bold'}
              className="shrink-0"
            />
          )}
          <span className={labelClass(isVerseCardActive)}>{t('railVerseCard')}</span>
          <RailTip label={t('railVerseCard')} />
        </button>

        {/* 모임 — 소그룹 체크인·릴레이·기도 나눔 */}
        <button
          onClick={() => void goLazy('/groups')}
          onMouseEnter={() => void preloadRoute('/groups')}
          aria-label={t('railGroups')}
          aria-current={isGroupsActive ? 'page' : undefined}
          aria-busy={pendingPath === '/groups'}
          className={itemClass(isGroupsActive)}
        >
          {isGroupsActive && <ActiveBar />}
          {pendingPath === '/groups' ? (
            <RailSpinner />
          ) : (
            <UsersThree
              size={GLYPH}
              weight={isGroupsActive ? 'duotone' : 'bold'}
              className="shrink-0"
            />
          )}
          <span className={labelClass(isGroupsActive)}>{t('railGroups')}</span>
          <RailTip label={t('railGroups')} />
        </button>

        {/* 신앙 여정 — 스트릭·타임라인·통계 (성장 페이지) */}
        <button
          onClick={() => void goLazy('/growth')}
          onMouseEnter={() => void preloadRoute('/growth')}
          aria-label={t('railGrowth')}
          aria-current={isGrowthActive ? 'page' : undefined}
          aria-busy={pendingPath === '/growth'}
          className={itemClass(isGrowthActive)}
        >
          {isGrowthActive && <ActiveBar />}
          {pendingPath === '/growth' ? (
            <RailSpinner />
          ) : (
            <Path size={GLYPH} weight={isGrowthActive ? 'duotone' : 'bold'} className="shrink-0" />
          )}
          <span className={labelClass(isGrowthActive)}>{t('railGrowth')}</span>
          <RailTip label={t('railGrowth')} />
        </button>

        {/* 프로필 */}
        <button
          onClick={handleProfileClick}
          onMouseEnter={() => void preloadRoute('/profile')}
          aria-label={t('profile')}
          aria-current={isProfileActive ? 'page' : undefined}
          aria-busy={pendingPath === '/profile'}
          className={itemClass(isProfileActive)}
        >
          {isProfileActive && <ActiveBar />}
          {pendingPath === '/profile' ? (
            <RailSpinner />
          ) : (
            <UserCircle
              size={GLYPH}
              weight={isProfileActive ? 'duotone' : 'bold'}
              className="shrink-0"
            />
          )}
          <span className={labelClass(isProfileActive)}>{t('profile')}</span>
          <RailTip label={t('profile')} />
        </button>
      </nav>

      {/* 나눔 액션 — X/인스타 데스크톱 문법의 단일 주 CTA. 누르면 모바일 홈 FAB과
          같은 3액션 스피드 다이얼(기도·감사·말씀 카드)이 팝오버로 열린다.
          두 버튼을 세로로 쌓던 이전 형태보다 위계가 분명하고 확장에도 유리하다.
          ★ 폭은 내용만큼(알약형) — 레일 폭을 꽉 채우던 풀폭은 좌측 정렬 메뉴와 따로 놀아
            위 메뉴 아이콘 열에 맞춰 왼쪽으로 붙인다(items-start). 좁은 바에서는 원형 */}
      <div className="mt-6 relative flex flex-col items-center xl:items-start">
        {dialOpen && (
          <>
            {/* 엽서가 레일 메뉴 위에 겹치므로 뒤를 바탕색으로 살짝 덮어 물러서게 한다 */}
            <div
              className="fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--surface)_62%,transparent)]"
              style={{ animation: 'share-post-scrim 0.18s ease-out both' }}
              onClick={() => setDialOpen(false)}
              aria-hidden
            />
            {/* 하늘 우체국 — 메뉴 세 줄 대신 우표 붙은 엽서 세 장이 부채처럼 손에 쥐어진다.
                FAB 아이콘(하늘에 보내는 편지)의 이야기를 팝오버 전체로 넓힌 것. 고른 엽서는
                하늘로 날아간 뒤 작성 창이 열린다. 움직임은 열 때·고를 때만(유휴 반복 없음). */}
            <SharePostcards
              variant="rail"
              className="absolute z-50 bottom-[calc(100%_+_14px)] left-0"
              onSend={sendPostcard}
              onVerseCardIntent={() => void preloadRoute('/bible/photo-verse')}
            />
          </>
        )}

        {/* 엽서 묶음 버튼 — 누르면 깔린 엽서가 빠져나가 위의 엽서 부채가 된다 */}
        <SharePostcardButton
          variant="rail"
          open={dialOpen}
          label={t('railShare')}
          onClick={() => setDialOpen((open) => !open)}
          onMouseEnter={prewarmPostcardFont}
          aria-label={t('railShare')}
          aria-haspopup="menu"
          aria-expanded={dialOpen}
          className="group z-50"
        >
          {!dialOpen && <RailTip label={t('railShare')} />}
        </SharePostcardButton>
      </div>

      {/* 레일 하단 삽화 — 남는 세로를 다 가져가고 그림은 바닥에 붙는다.
          보이는 조건(xl 폭 · 높이 티어 tall)과 네 변 페이드는 DesktopNavRail.css 가 쥔다.
          장식이므로 aria-hidden — 스크린리더의 메뉴 읽기 흐름에 끼어들지 않는다 */}
      {showRailArt && (
        <div
          className={`rail-bottom-art${railArtReady ? ' is-loaded' : ''}`}
          style={{ backgroundImage: `url(${pairSrc(RAIL_BOTTOM, theme)})` }}
          aria-hidden
        />
      )}

      {/* 하단 유틸리티 — 사이트 설정 성격의 액션(테마·전체 메뉴)만 남긴다.
          "내 것"인 알림과 계정은 헤더 우상단 클러스터(HeaderAccountCluster)가 담당한다.
          메뉴 패널은 NewHeader가 소유하므로 커스텀 이벤트로 열기만 요청한다 */}
      <div className="mt-auto pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col xl:flex-row items-center xl:justify-between gap-1 xl:gap-1">
        {/* 테마 토글 — 달 아이콘만으로는 "야간 모드"인지 모르시는 분이 많아
            라벨이 들어갈 자리가 있는 xl 폭에서는 글자를 함께 보여준다 */}
        <button
          onClick={toggleTheme}
          onPointerEnter={prewarmThemeToggle}
          onFocus={prewarmThemeToggle}
          aria-label={t('themeToggleAria')}
          className="group relative w-12 h-12 xl:w-auto xl:px-3 xl:gap-2 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-[26px] leading-none inline-flex items-center justify-center w-[26px] h-[26px] overflow-hidden shrink-0">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="hidden xl:inline text-[length:calc(15px*var(--rl,1))] font-semibold whitespace-nowrap">
            {theme === 'dark' ? t('railThemeDay') : t('railThemeNight')}
          </span>
          <RailTip
            label={theme === 'dark' ? t('railThemeToLight') : t('railThemeToDark')}
            placement="top"
            hideAtXl
          />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('chambit:open-menu'))}
          aria-label={t('allMenu')}
          className="group relative w-12 h-12 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-[26px] leading-none inline-flex items-center justify-center w-[26px] h-[26px] overflow-hidden">
            more_vert
          </span>
          <RailTip label={t('allMenu')} placement="top" />
        </button>
      </div>
    </aside>
  )
}

export default DesktopNavRail
