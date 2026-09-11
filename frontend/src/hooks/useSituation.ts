import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { SituationCategory } from '../types/situation'
import {
  getSituationCategories,
  getSituationVerses,
  getAllSituationCategories,
  createSituationCategory,
  updateSituationCategory,
  deleteSituationCategory,
  addSituationVerse,
  removeSituationVerse,
  updateSituationVerseMessage,
  seedSituations,
} from '../api/situation'

export const situationKeys = {
  all: ['situations'] as const,
  categories: () => [...situationKeys.all, 'categories'] as const,
  adminCategories: () => [...situationKeys.all, 'admin'] as const,
  verses: (id: number) => [...situationKeys.all, 'verses', id] as const,
}

// 어드민이 가끔만 손대는 큐레이션 데이터 — 홈 우측 레일에서도 쓰므로 길게 잡아
// 재방문·탭 전환 시 재호출을 줄인다 (어드민 수정 시엔 situationKeys.all 무효화로 즉시 갱신)
const CATEGORIES_STALE_MS = 1000 * 60 * 30
const VERSES_STALE_MS = 1000 * 60 * 10

export const useSituationCategories = () =>
  useQuery({
    queryKey: situationKeys.categories(),
    queryFn: getSituationCategories,
    staleTime: CATEGORIES_STALE_MS,
  })

export const useSituationVerses = (categoryId: number, enabled = true) =>
  useQuery({
    queryKey: situationKeys.verses(categoryId),
    queryFn: () => getSituationVerses(categoryId),
    enabled: enabled && categoryId > 0,
    staleTime: VERSES_STALE_MS,
  })

// ── 오늘의 위로 말씀 히어로 ───────────────────────────────────────────
// 화면(SituationBible)과 선요청(prefetchSituation)이 같은 카테고리를 고르도록 로직을 공유한다.
// 날짜 시드라 하루 동안은 같은 상황이 뜨고, 새로고침 버튼(nonce)으로만 바뀐다.

export const situationHeroDateSeed = (): number => {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export const pickSituationHero = (
  categories: SituationCategory[],
  nonce = 0,
  seed = situationHeroDateSeed(),
): SituationCategory | null => {
  const pool = categories.filter((c) => c.verse_count > 0)
  return pool.length ? pool[(seed + nonce) % pool.length] : null
}

/**
 * /bible/situation 첫 화면 데이터 선요청 — 두 시점에서 불린다.
 *   1. 청크 프리로드(routePreload.routeDataPrefetchers): /bible 허브 유휴·호버
 *   2. 라우트 진입(components/common/RouteDataPrefetch): Suspense 바깥이라 청크와 나란히
 * 예전엔 청크 → 카테고리 → 히어로 구절이 3단 직렬이라 그만큼 스피너였다.
 * 키·staleTime 은 훅과 같아 진입 시 캐시를 그대로 이어받고, 이미 신선하면 요청하지 않는다.
 */
export const prefetchSituation = (qc: QueryClient): void => {
  void qc
    .fetchQuery({
      queryKey: situationKeys.categories(),
      queryFn: getSituationCategories,
      staleTime: CATEGORIES_STALE_MS,
    })
    .then((categories) => {
      const hero = pickSituationHero(categories)
      if (!hero) return
      return qc.prefetchQuery({
        queryKey: situationKeys.verses(hero.id),
        queryFn: () => getSituationVerses(hero.id),
        staleTime: VERSES_STALE_MS,
      })
    })
    .catch(() => {
      /* 오프라인 등 — 진입 시 훅이 다시 시도한다 */
    })
}

// ── Admin ─────────────────────────────────────────────────────────────

export const useAdminSituationCategories = () =>
  useQuery({
    queryKey: situationKeys.adminCategories(),
    queryFn: getAllSituationCategories,
    staleTime: 0,
  })

export const useCreateSituationCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSituationCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}

export const useUpdateSituationCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateSituationCategory>[1] }) =>
      updateSituationCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}

export const useDeleteSituationCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSituationCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}

export const useAddSituationVerse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: Parameters<typeof addSituationVerse>[1] }) =>
      addSituationVerse(categoryId, data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: situationKeys.verses(vars.categoryId) }),
  })
}

export const useRemoveSituationVerse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ situationVerseId }: { situationVerseId: number; categoryId: number }) =>
      removeSituationVerse(situationVerseId),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: situationKeys.verses(vars.categoryId) }),
  })
}

export const useUpdateSituationVerseMessage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ situationVerseId, message }: { situationVerseId: number; message: string | null; categoryId: number }) =>
      updateSituationVerseMessage(situationVerseId, message),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: situationKeys.verses(vars.categoryId) }),
  })
}

export const useSeedSituations = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: seedSituations,
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}
