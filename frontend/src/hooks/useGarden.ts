// 정원 데이터 관리 훅

import { useMemo } from 'react'
import { useReadVerses } from './useBibleReading'
import { convertVersesToFlowers, groupFlowersByMonth } from '../utils/gardenCalculator'
import type { GardenFlower, MonthlyGarden } from '../types/garden'

export const useGarden = () => {
  // 읽은 구절 데이터 가져오기
  const { data: readVersesData, isLoading, error } = useReadVerses({
    page_size: 1000, // 충분히 큰 값
  })

  // 구절을 꽃으로 변환
  const flowers = useMemo<GardenFlower[]>(() => {
    if (!readVersesData?.read_verses) return []
    return convertVersesToFlowers(readVersesData.read_verses)
  }, [readVersesData])

  // 월별로 그룹화
  const monthlyGardens = useMemo<MonthlyGarden[]>(() => {
    return groupFlowersByMonth(flowers)
  }, [flowers])

  // 현재 월 정원
  const currentMonthGarden = useMemo<MonthlyGarden | null>(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    return (
      monthlyGardens.find(
        (garden) => garden.year === currentYear && garden.month === currentMonth
      ) || null
    )
  }, [monthlyGardens])

  return {
    flowers,
    monthlyGardens,
    currentMonthGarden,
    isLoading,
    error,
  }
}
