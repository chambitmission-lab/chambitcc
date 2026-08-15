// 주보(이미지 주보) React Query 훅 — /news 주보 탭이 raw fetch 로 매 진입마다
// 스켈레톤을 띄우던 것을 전역 캐시 우선 전략(캐시 먼저 그리고 stale 이면 백그라운드
// 재조회)에 태운다. 같은 페이지의 새가족·행사 섹션과 동일한 패턴.
import { useQuery } from '@tanstack/react-query'
import { getBulletins } from '../api/bulletin'

export const bulletinKeys = {
  all: ['bulletins'] as const,
  list: () => [...bulletinKeys.all, 'list'] as const,
  detail: (id: number) => [...bulletinKeys.all, 'detail', id] as const,
}

/** 공개 주보 목록 (최신순) */
export const useBulletins = (limit = 20) =>
  useQuery({
    queryKey: bulletinKeys.list(),
    queryFn: () => getBulletins(0, limit),
  })
