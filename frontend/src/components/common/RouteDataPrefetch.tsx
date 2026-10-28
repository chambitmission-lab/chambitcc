import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchBibleChapter, prefetchBibleSearch } from '../../hooks/useBible'
import { prefetchBibleHub } from '../../pages/Bible/prefetch'
import { prefetchProfile } from '../../pages/Profile/prefetch'
import { prefetchGrowth } from '../../hooks/useGrowth'
import { prefetchTitles } from '../../hooks/useTitles'
import { prefetchWeeklyStory } from '../../hooks/useWeeklyStory'
import { prefetchAboutContent } from '../../hooks/useAboutContent'
import { prefetchSituation } from '../../hooks/useSituation'
import { prefetchQuest } from '../../hooks/useBluemarble'
import { tokenStore } from '../../utils/tokenStore'
import { isPastor } from '../../utils/access'
import { warmRouteThemeAssets } from '../../utils/themeAssets'

/* 라우트가 바뀌는 순간 그 화면의 첫 데이터를 lazy 청크와 나란히 요청한다.
   Routes 를 감싼 Suspense 안에 두면 청크가 도착할 때까지 effect 가 미뤄지므로
   반드시 Suspense 바깥(ScrollRestoration 옆)에 마운트한다.
   훅과 같은 queryKey·queryFn 으로 prefetch 하므로 화면이 뜨면 캐시를 그대로 이어받는다. */

const BIBLE_CHAPTER = /^\/bible\/(\d+)\/(\d+)$/
// /handwriting 또는 /handwriting/:id (쓰기·말씀카드 화면은 제외)
const CONTEST_ROUTE = /^\/handwriting(?:\/(\d+))?$/

const RouteDataPrefetch = () => {
  const { pathname, search } = useLocation()
  const queryClient = useQueryClient()

  useEffect(() => {
    const chapter = BIBLE_CHAPTER.exec(pathname)
    if (chapter) {
      prefetchBibleChapter(queryClient, Number(chapter[1]), Number(chapter[2]))
    }
    // /bible 허브(책 목록·진행률·이어읽기) — 예전엔 장 화면만 선요청해 허브는 청크 뒤에 API 가 왔다
    if (pathname === '/bible') prefetchBibleHub(queryClient)
    // 프로필 — detail·블루마블 통계와 그 아래 카드 데이터(여정·칭호)를 청크와 나란히 한 번에 띄운다
    if (pathname === '/profile') prefetchProfile(queryClient)
    // 목회자 영역 — 섹션 칩을 누르면 청크 → API 직렬이라 두 번 기다렸다. 청크와 나란히 띄운다
    // (목회자만 쓰는 API 모듈이 메인 번들에 섞이지 않게 동적 import — 작은 청크라 페이지 청크와 나란히 온다)
    if (pathname.startsWith('/pastor') && isPastor()) {
      void import('../../pages/Pastor/prefetch')
        .then(m => m.prefetchPastorRoute(pathname, queryClient))
        .catch(() => undefined)
    }
    // 신앙 여정 — 요약·타임라인·인사이트를 청크와 나란히 (예전엔 청크 뒤에 요약, 요약 뒤에 인사이트가 출발)
    if (pathname === '/growth' && tokenStore.getAccess()) prefetchGrowth(queryClient)
    // 칭호 도감·주간 스토리 — 청크와 나란히
    if (pathname === '/garden' && tokenStore.getAccess()) prefetchTitles(queryClient)
    if (pathname === '/weekly-story' && tokenStore.getAccess()) prefetchWeeklyStory(queryClient)
    // 바이블 퀘스트 — 딥링크·새로고침 진입도 청크와 나란히 상태·칸·토끼를 띄운다
    // (useBluemarble 은 프로필 선요청이 이미 메인 번들에 넣고 있어 정적 import 로 충분하다)
    if (pathname === '/bluemarble' && tokenStore.getAccess()) prefetchQuest(queryClient)
    // 상황별 성구 — 청크 → 카테고리 → 히어로 구절 3단 직렬을 청크와 나란히 한 번에 띄운다
    if (pathname === '/bible/situation') prefetchSituation(queryClient)
    // 말씀 필사 허브 — 묶음(통계·달력·오늘의 한 절·교회 성경·릴레이)을 청크와 나란히. 예전엔 허브가
    // 마운트된 뒤에야 출발해 청크 왕복 + API 왕복이 직렬이었다 (훅 모듈이 메인 번들에 섞이지 않게 동적 import)
    if (pathname === '/bible/typing' && tokenStore.getAccess()) {
      void import('../../hooks/useBibleTyping')
        .then((m) => m.prefetchTypingHome(queryClient))
        .catch(() => undefined)
    }
    // 읽기 플랜 — 목록·오늘의 읽기 묶음을 청크와 나란히. 예전엔 화면이 마운트된 뒤에야 둘이 출발해
    // 청크 왕복 + API 왕복이 직렬이었다 (플랜 훅이 메인 번들에 섞이지 않게 동적 import)
    if (pathname === '/bible/plans') {
      void import('../../hooks/useBiblePlan')
        .then((m) => m.prefetchPlanOverview(queryClient))
        .catch(() => undefined)
    }
    // 손글씨 필사대회 — 목록·대회 상세를 청크와 나란히 (딥링크 /handwriting/:id 는 그 상세를 바로).
    // 예전엔 청크 → 목록 → 상세 → 갤러리 네 왕복이 직렬이었다 (훅 모듈은 메인 번들에 섞이지 않게 동적 import)
    const contest = CONTEST_ROUTE.exec(pathname)
    if (contest) {
      const contestId = contest[1] ? Number(contest[1]) : undefined
      void import('../../hooks/useHandwritingContest')
        .then((m) => m.prefetchContestPage(queryClient, false, contestId && contestId > 0 ? contestId : undefined))
        .catch(() => undefined)
    }
    // 설교 — 목록 첫 페이지 + 최신 설교 인용절을 청크와 나란히 (딥링크·새로고침 진입용.
    // 설교 유틸이 메인 번들에 섞이지 않게 동적 import — 페이지 청크와 나란히 온다)
    if (pathname === '/sermon' || pathname === '/sermon/new') {
      void import('../../pages/Sermon/prefetch')
        .then((m) => m.prefetchSermonPage(queryClient))
        .catch(() => undefined)
    }
    // 비로그인 랜딩 — 히어로 사진 URL 이 /about-content 응답에 있어 청크 뒤에 API, 그 뒤에
    // 이미지가 오는 3단 체인이었다. API 를 청크와 같은 시점에 띄운다.
    if ((pathname === '/' || pathname.startsWith('/welcome')) && !tokenStore.getAccess()) {
      prefetchAboutContent(queryClient)
    }
    // 테마별 히어로 삽화(CSS 배경)는 엘리먼트가 렌더된 뒤에야 요청이 나간다 — 청크와 나란히
    // 현재 테마 파일을 띄우고, 반대 테마는 유휴 시간에 받아 둬 토글 순간 빈 배경이 끼지 않게 한다
    void warmRouteThemeAssets(pathname).catch(() => undefined)
  }, [pathname, queryClient])

  // 소식 — 주보 탭·공유 링크(?tab=bulletin&b=28)는 쿼리를 보고 가르므로 search 에도 반응한다.
  // 공유 링크는 목록과 그 주보 상세를 청크와 나란히 동시에 띄운다 (예전엔 청크 → 목록 → 상세 → 쪽 그림 직렬).
  // 뉴스 유틸이 메인 번들에 섞이지 않게 동적 import — 작은 청크라 페이지 청크와 나란히 온다
  useEffect(() => {
    if (pathname !== '/news') return
    void import('../../pages/News/prefetch')
      .then((m) => m.prefetchNewsRoute(search, queryClient))
      .catch(() => undefined)
  }, [pathname, search, queryClient])

  // 성경 찾기 딥링크·뒤로가기(/bible?tab=search&q=사랑[&scope=NEW&book=43]) — 검색 첫 페이지와
  // 검색 탭 청크를 라우트 청크와 나란히 띄운다. 예전엔 BibleStudy 청크 → BibleSearch 청크 → 검색 요청
  // 세 왕복이 직렬이었다. 청크 import 는 BibleStudy 의 lazyModal 과 같은 모듈이라 한 청크로 묶인다.
  useEffect(() => {
    if (pathname !== '/bible') return
    const params = new URLSearchParams(search)
    if (params.get('tab') !== 'search') return
    void import('../../pages/Bible/components/BibleSearch').catch(() => undefined)
    const q = params.get('q')?.trim() ?? ''
    if (q.length < 2) return
    const scope = params.get('scope')
    const book = Number(params.get('book'))
    prefetchBibleSearch(
      queryClient,
      q,
      scope === 'OLD' || scope === 'NEW' ? scope : undefined,
      book >= 1 && book <= 66 ? book : undefined,
    )
  }, [pathname, search, queryClient])

  return null
}

export default RouteDataPrefetch
