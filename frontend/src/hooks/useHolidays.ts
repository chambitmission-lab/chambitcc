// 공휴일 조회 훅 — 보이는 달력에 필요한 연도들을 받아 'YYYY-MM-DD' → 이름 맵으로 합친다.
// 공휴일은 거의 바뀌지 않아 길게 캐시한다. 실패해도 달력은 그대로(공휴일 표시만 빠짐).
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchHolidays } from '../api/holiday'

export const holidayKeys = {
  year: (year: number) => ['holidays', year] as const,
}

const HOLIDAY_STALE_MS = 1000 * 60 * 60 * 12

/** 달력 칸(앞뒤 달 패딩 포함)에 걸치는 연도 — 1월은 작년 12월, 12월은 내년 1월이 보인다 */
export const yearsForMonthView = (date: Date): number[] => {
  const y = date.getFullYear()
  const m = date.getMonth()
  if (m === 0) return [y - 1, y]
  if (m === 11) return [y, y + 1]
  return [y]
}

export const useHolidayMap = (years: number[]): Map<string, string> => {
  const results = useQueries({
    queries: years.map(year => ({
      queryKey: holidayKeys.year(year),
      queryFn: () => fetchHolidays(year),
      staleTime: HOLIDAY_STALE_MS,
      retry: 1,
    })),
  })

  const signature = results.map(r => r.dataUpdatedAt).join(',')
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const r of results) for (const h of r.data ?? []) map.set(h.date, h.name)
    return map
    // results 배열은 렌더마다 새로 만들어진다 — 실제 데이터 갱신 시각으로만 다시 합친다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])
}
