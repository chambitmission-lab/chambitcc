// 주보(이미지 주보) React Query 훅 — /news 주보 탭이 raw fetch 로 매 진입마다
// 스켈레톤을 띄우던 것을 전역 캐시 우선 전략(캐시 먼저 그리고 stale 이면 백그라운드
// 재조회)에 태운다. 같은 페이지의 새가족·행사 섹션과 동일한 패턴.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { preload } from 'react-dom'
import { getBulletinDetail, getBulletins } from '../api/bulletin'

export const bulletinKeys = {
  all: ['bulletins'] as const,
  list: () => [...bulletinKeys.all, 'list'] as const,
  detail: (id: number) => [...bulletinKeys.all, 'detail', id] as const,
  /** 목록 히어로의 쪽 미리보기 — 조회수를 올리지 않는 조회라 detail 과 캐시를 나눈다 */
  preview: (id: number) => [...bulletinKeys.all, 'preview', id] as const,
}

/** 공개 주보 목록 (최신순) */
export const useBulletins = (limit = 20) => {
  const qc = useQueryClient()
  return useQuery({
    queryKey: bulletinKeys.list(),
    queryFn: async () => {
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
    },
  })
}

/** 히어로 쪽 미리보기 신선도 — prefetch 와 BulletinShelf 의 useQuery 가 같은 값을 쓴다 */
export const BULLETIN_PREVIEW_STALE = 10 * 60_000
