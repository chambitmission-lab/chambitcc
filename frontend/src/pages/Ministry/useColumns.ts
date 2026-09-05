import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getColumns, toggleColumnAmen } from '../../api/column'
import type { Column } from '../../types/column'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { columnKeys } from '../../hooks/queryKeys'

// 칼럼은 주 1건 수준이라 캐시 우선: 재방문 시 캐시를 즉시 보여주고,
// 30분 지난 경우에만 백그라운드에서 조용히 갱신 (persister로 앱 재시작에도 유지)
const columnsQueryOptions = (q: string) => ({
  queryKey: columnKeys.list(q),
  queryFn: async () => {
    const data = await getColumns(q)
    return data.filter((c) => c.is_active)
  },
  staleTime: 1000 * 60 * 30,
  refetchOnMount: true as const, // 전역 기본(false)을 덮어써야 stale 시 백그라운드 갱신이 됨
  placeholderData: keepPreviousData, // 검색어 타이핑 중 스피너 깜빡임 방지
})

/**
 * 목양칼럼 목록 조회 + 캐시 갱신 규칙.
 * 화면은 "무엇을 보여줄지"만 알고, 캐시를 어떻게 맞출지는 여기서 정한다.
 */
export const useColumns = (appliedQuery: string) => {
  const queryClient = useQueryClient()

  const {
    data: columns = [],
    isPending: loading,
    isError,
  } = useQuery(columnsQueryOptions(appliedQuery))

  // 검색 결과에 흔들리지 않는 전체 편지 목록 (우측 레일 위젯 전용).
  // 검색 중이 아닐 땐 위 쿼리와 키가 같아 요청이 합쳐지고, 검색 중엔 캐시가 그대로 남는다.
  const { data: allColumns = [] } = useQuery(columnsQueryOptions(''))

  useEffect(() => {
    if (isError) showToast('목양컬럼을 불러오는데 실패했습니다', 'error')
  }, [isError])

  // 관리자 변경 사항을 캐시에 즉시 반영하고, 서버 기준으로 재검증
  const syncColumnsCache = (updater: (prev: Column[]) => Column[]) => {
    queryClient.setQueriesData<Column[]>({ queryKey: columnKeys.all }, (prev) => (prev ? updater(prev) : prev))
    queryClient.invalidateQueries({ queryKey: columnKeys.all })
  }

  // 아멘·완독은 캐시만 갱신한다 (invalidate 하면 방금 누른 값이 재조회로 되돌아가 깜빡인다)
  const patchColumnCache = (id: number, patch: Partial<Column>) => {
    queryClient.setQueriesData<Column[]>({ queryKey: columnKeys.all }, (prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, ...patch } : c)) : prev
    )
  }

  return { columns, allColumns, loading, isError, syncColumnsCache, patchColumnCache }
}

/**
 * 아멘 토글 — 낙관적 업데이트 후 서버 확정값으로 동기화.
 * 연타로 토글이 꼬이지 않도록 진행 중인 편지는 무시한다.
 */
export const useColumnAmen = (patchColumnCache: (id: number, patch: Partial<Column>) => void, language: string) => {
  const pendingRef = useRef<Set<number>>(new Set())

  return async (column: Column) => {
    const id = column.id
    if (id == null) return
    if (!isAuthenticated()) {
      showToast(language === 'ko' ? '로그인하면 아멘을 남길 수 있어요' : 'Sign in to leave an Amen', 'error')
      return
    }
    if (pendingRef.current.has(id)) return
    pendingRef.current.add(id)

    const wasAmened = !!column.is_amened
    patchColumnCache(id, {
      is_amened: !wasAmened,
      amen_count: Math.max(0, (column.amen_count ?? 0) + (wasAmened ? -1 : 1)),
    })

    try {
      const res = await toggleColumnAmen(id)
      patchColumnCache(id, { is_amened: res.is_amened, amen_count: res.amen_count })
    } catch {
      // 롤백
      patchColumnCache(id, { is_amened: wasAmened, amen_count: column.amen_count ?? 0 })
      showToast(language === 'ko' ? '잠시 후 다시 시도해 주세요' : 'Please try again later', 'error')
    } finally {
      pendingRef.current.delete(id)
    }
  }
}
