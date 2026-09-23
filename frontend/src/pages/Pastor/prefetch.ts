// 목회자 영역(/pastor) 선요청 — pages/Profile/prefetch.ts 와 같은 규약.
//
// 예전엔 섹션 칩을 누르면 ① 그 화면 청크 → ② 청크가 뜬 뒤에야 API 가 출발하는 직렬이었다.
// 라우터가 전환을 startTransition 으로 감싸 청크를 받는 동안엔 이전 화면이 그대로 멈춰 있고
// (눌러도 반응이 없는 듯한 구간), 청크가 오면 다시 스피너 — 두 번 기다리는 셈이었다.
//   1. 라우트 진입(components/common/RouteDataPrefetch): 청크와 나란히 그 화면 데이터를 띄운다
//   2. 목회자 영역에 들어오면 유휴 시간에 나머지 섹션 청크·데이터를 미리 받아 둔다
// 키·queryFn 은 각 화면의 useQuery 와 같아 진입 시 캐시를 그대로 이어받는다.
// 목회자 쿼리는 persist 되지 않으므로(main.tsx) 세션 메모리에만 남는다.
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '../../config/queryClient'
import {
  fetchAgenda,
  fetchMemberDetail,
  fetchMyVisits,
  fetchPastorHome,
  fetchRoster,
  fetchSermonPrep,
  fetchSuggestions,
  fetchWeeklyReport,
} from '../../api/pastor'
import { fetchPastorCareRadar } from '../../api/admin'
import { isPastor } from '../../utils/access'
import { preloadBudget, scheduleAfterFirstScreen } from '../../utils/idlePreload'

// 각 화면의 기본 필터값 — 화면 useState 초기값과 맞춰야 캐시가 이어진다
const CARE_QUIET_DAYS = 21 // CareRadar
const SERMON_YEARS = 3 // PastorSermon
const REPORT_WEEK = 0 // PastorReport

interface SectionPrefetch {
  /** App.tsx 의 lazy import 와 같은 모듈 — 번들러가 같은 청크로 합친다 */
  chunk: () => Promise<unknown>
  data: (qc: QueryClient) => Promise<void>
}

const SECTIONS: Record<string, SectionPrefetch> = {
  '/pastor': {
    chunk: () => import('./PastorHome'),
    data: qc => qc.prefetchQuery({ queryKey: ['pastor-home'], queryFn: fetchPastorHome }),
  },
  '/pastor/care': {
    chunk: () => import('../Admin/CareRadar'),
    data: qc =>
      qc.prefetchQuery({
        queryKey: ['pastor-care-radar', CARE_QUIET_DAYS],
        queryFn: () => fetchPastorCareRadar(CARE_QUIET_DAYS),
      }),
  },
  '/pastor/members': {
    chunk: () => import('./PastorMembers'),
    data: qc => qc.prefetchQuery({ queryKey: ['pastor-roster'], queryFn: fetchRoster }),
  },
  '/pastor/visits': {
    chunk: () => import('./PastorVisits'),
    data: qc => qc.prefetchQuery({ queryKey: ['pastor-visits'], queryFn: fetchMyVisits }),
  },
  '/pastor/schedule': {
    chunk: () => import('./PastorSchedule'),
    data: qc => qc.prefetchQuery({ queryKey: ['pastor-agenda'], queryFn: fetchAgenda }),
  },
  '/pastor/sermon': {
    chunk: () => import('./PastorSermon'),
    data: qc =>
      qc.prefetchQuery({
        queryKey: ['pastor-sermon-prep', SERMON_YEARS],
        queryFn: () => fetchSermonPrep(SERMON_YEARS),
      }),
  },
  '/pastor/report': {
    chunk: () => import('./PastorReport'),
    data: qc =>
      qc.prefetchQuery({
        queryKey: ['pastor-report', REPORT_WEEK],
        queryFn: () => fetchWeeklyReport(REPORT_WEEK),
      }),
  },
  '/pastor/assistant': {
    chunk: () => import('./PastorAssistant'),
    data: qc => qc.prefetchQuery({ queryKey: ['pastor-suggestions'], queryFn: fetchSuggestions }),
  },
}

const MEMBER_DETAIL = /^\/pastor\/members\/(\d+)$/

/** 라우트 진입 시 — 청크 다운로드와 나란히 그 화면 데이터를 띄운다. 신선하면(staleTime) 요청하지 않는다 */
export const prefetchPastorRoute = (pathname: string, qc: QueryClient = queryClient): void => {
  if (!isPastor()) return
  const member = MEMBER_DETAIL.exec(pathname)
  if (member) {
    const id = Number(member[1])
    void qc.prefetchQuery({ queryKey: ['pastor-member', id], queryFn: () => fetchMemberDetail(id) })
    return
  }
  void SECTIONS[pathname]?.data(qc)
}

let warmed = false

/**
 * 목회자 영역에 처음 들어온 뒤 유휴 시간에 — 나머지 섹션 청크를 받고, 데이터는 하나씩 차례로.
 * 한꺼번에 쏘면 서버 집계(돌봄 레이더·대시보드)가 동시에 몰리므로 직렬로 흘린다.
 * 세션당 한 번. 이후 5분(staleTime)이 지난 섹션은 진입 시 캐시를 먼저 그리고 뒤에서 갱신된다.
 */
export const warmPastorSections = (qc: QueryClient = queryClient): (() => void) => {
  if (warmed || !isPastor()) return () => undefined
  const budget = preloadBudget()
  if (budget === 'none') return () => undefined

  return scheduleAfterFirstScreen(
    () => {
      if (warmed) return
      warmed = true
      const sections = Object.values(SECTIONS)
      for (const s of sections) void s.chunk().catch(() => undefined)
      // 3G 이하에선 청크만 — 데이터는 들어갈 때 받는다
      if (budget !== 'full') return
      void (async () => {
        for (const s of sections) {
          if (!isPastor()) return
          await s.data(qc).catch(() => undefined)
        }
      })()
    },
    { settleMs: 600, idleTimeoutMs: 3000 },
  )
}
