// 주보(이미지 주보) React Query 훅 — /news 주보 탭이 raw fetch 로 매 진입마다
// 스켈레톤을 띄우던 것을 전역 캐시 우선 전략(캐시 먼저 그리고 stale 이면 백그라운드
// 재조회)에 태운다. 같은 페이지의 새가족·행사 섹션과 동일한 패턴.
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { preload } from 'react-dom'
import { getBulletinDetail, getBulletins, getBulletinYears, getBulletinsByYear } from '../api/bulletin'
import { currentEditionYear } from '../pages/News/components/bulletinIssue'

export const bulletinKeys = {
  all: ['bulletins'] as const,
  list: () => [...bulletinKeys.all, 'list'] as const,
  detail: (id: number) => [...bulletinKeys.all, 'detail', id] as const,
  /** 목록 히어로의 쪽 미리보기 — 조회수를 올리지 않는 조회라 detail 과 캐시를 나눈다 */
  preview: (id: number) => [...bulletinKeys.all, 'preview', id] as const,
  /** 주보가 있는 판 연도 목록 */
  years: () => [...bulletinKeys.all, 'years'] as const,
  /** 판 연도(3월~이듬해 2월) 한 해치 — 앞 두 칸으로 모든 연도 캐시를 한 번에 훑을 수 있다 */
  year: (year: number) => [...bulletinKeys.all, 'year', year] as const,
}

/** 목록 queryFn — 훅과 선요청(pages/News/prefetch.ts)이 같은 함수를 써서 캐시를 공유한다 */
const fetchBulletinList = async (qc: QueryClient, limit: number) => {
  const list = await getBulletins(0, limit)
  // 히어로가 그려지기를 기다리지 않고 바로 — 앞장 그림과 쪽 미리보기(뒷장·쪽 띠)를 함께 출발시킨다
  const latest = list[0]
  if (latest) {
    if (latest.thumbnail_url) preload(latest.thumbnail_url, { as: 'image', fetchPriority: 'high' })
    void qc.prefetchQuery({
      queryKey: bulletinKeys.preview(latest.id),
      queryFn: () => getBulletinDetail(latest.id, false),
      staleTime: BULLETIN_PREVIEW_STALE,
    })
  }
  return list
}

/** 공개 주보 목록 (최신순) */
export const useBulletins = (limit = 20) => {
  const qc = useQueryClient()
  return useQuery({
    queryKey: bulletinKeys.list(),
    queryFn: () => fetchBulletinList(qc, limit),
  })
}

/** 목록 선요청 — 신선한 캐시(persist 복원 포함)가 있으면 요청 없이 끝난다 */
export const prefetchBulletinList = (qc: QueryClient, limit = 20) =>
  qc.prefetchQuery({ queryKey: bulletinKeys.list(), queryFn: () => fetchBulletinList(qc, limit) })

/** 히어로 쪽 미리보기 신선도 — prefetch 와 BulletinShelf 의 useQuery 가 같은 값을 쓴다 */
export const BULLETIN_PREVIEW_STALE = 10 * 60_000

const BULLETIN_YEARS_STALE = 10 * 60_000

/** 주보가 있는 판 연도(최신 먼저) — 지난 주보 연도 넘기기 */
export const useBulletinYears = () =>
  useQuery({ queryKey: bulletinKeys.years(), queryFn: getBulletinYears, staleTime: BULLETIN_YEARS_STALE })

/** 연도 목록 선요청 — /news 주보 탭 진입 때 목록과 나란히 띄운다(작은 응답) */
export const prefetchBulletinYears = (qc: QueryClient) =>
  qc.prefetchQuery({ queryKey: bulletinKeys.years(), queryFn: getBulletinYears, staleTime: BULLETIN_YEARS_STALE })

/** 판 연도 한 해치 주보 — null 이면 받지 않는다(최근 목록이 그 해를 다 덮을 때).
 *  올해 판은 주마다 늘어나니 5분, 지난 해는 바뀔 일이 거의 없어 하루 */
export const useBulletinsByYear = (year: number | null) =>
  useQuery({
    queryKey: bulletinKeys.year(year ?? 0),
    queryFn: () => getBulletinsByYear(year as number),
    enabled: year != null,
    staleTime: year != null && year < currentEditionYear() ? 24 * 3600_000 : 5 * 60_000,
  })
