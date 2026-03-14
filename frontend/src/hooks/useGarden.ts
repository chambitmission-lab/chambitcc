// 정원 데이터 관리 훅

import { useMemo } from 'react'
import { convertVersesToFlowers, groupFlowersByMonth } from '../utils/gardenCalculator'
import type { GardenFlower, MonthlyGarden } from '../types/garden'
import type { ReadVerse } from '../api/bibleReading'

interface ReadVersesData {
  read_verses: ReadVerse[]
}

export const useGarden = () => {
  // TODO: 백엔드 API 구현 후 활성화
  // import { useReadVerses } from './useBibleReading'
  // const { data: readVersesData, isLoading, error } = useReadVerses({
  //   page_size: 1000,
  // })
  
  // 임시: 빈 데이터 반환 (백엔드 API 준비될 때까지)
  const readVersesData = null as ReadVersesData | null

  // 구절을 꽃으로 변환
  const flowers = useMemo<GardenFlower[]>(() => {
    if (!readVersesData) return []
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
    isLoading: false,
    error: null,
  }
}
