import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  fetchBibleFigureDetail,
  fetchMessianicGenealogy,
} from '../api/bibleFigure'
import type { BibleFigureDetail, BibleFigureSummary } from '../types/bibleFigure'

export const bibleFigureKeys = {
  all: ['bibleFigures'] as const,
  genealogyMessianic: () => [...bibleFigureKeys.all, 'genealogy', 'messianic'] as const,
  detail: (slug: string) => [...bibleFigureKeys.all, 'detail', slug] as const,
}

export const useMessianicGenealogy = () => {
  return useQuery({
    queryKey: bibleFigureKeys.genealogyMessianic(),
    queryFn: fetchMessianicGenealogy,
    staleTime: 1000 * 60 * 30, // 가계도는 잘 안 변하니 30분
    gcTime: 1000 * 60 * 60 * 24, // 1일
  })
}

const DETAIL_STALE = 1000 * 60 * 10
const DETAIL_GC = 1000 * 60 * 60 * 24

/** 가계도 요약 → 상세 placeholder. 헤더·한 줄 소개를 즉시 그리고 본문만 기다린다. */
const placeholderFromSummary = (s: BibleFigureSummary): BibleFigureDetail => ({
  ...s,
  name_hebrew: null,
  description_long: null,
  birth_year_estimate: null,
  death_year_estimate: null,
  key_verses: [],
  parents: [],
  children: [],
  spouses: [],
  reading_progress: null,
})

export const useBibleFigureDetail = (slug: string | null, summary?: BibleFigureSummary | null) => {
  return useQuery({
    queryKey: bibleFigureKeys.detail(slug || ''),
    queryFn: () => fetchBibleFigureDetail(slug as string),
    enabled: !!slug,
    staleTime: DETAIL_STALE,
    gcTime: DETAIL_GC,
    placeholderData: summary && summary.slug === slug ? placeholderFromSummary(summary) : undefined,
  })
}

/** 별 호버·인접 인물 등 "곧 볼 것 같은" 상세를 미리 받아둔다 (캐시에 있으면 no-op). */
export const usePrefetchBibleFigure = () => {
  const qc = useQueryClient()
  return useCallback(
    (slug: string) => {
      if (!slug) return
      void qc.prefetchQuery({
        queryKey: bibleFigureKeys.detail(slug),
        queryFn: () => fetchBibleFigureDetail(slug),
        staleTime: DETAIL_STALE,
        gcTime: DETAIL_GC,
      })
    },
    [qc],
  )
}
