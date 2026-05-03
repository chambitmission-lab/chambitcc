import { useQuery } from '@tanstack/react-query'
import {
  fetchBibleFigureDetail,
  fetchMessianicGenealogy,
} from '../api/bibleFigure'

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

export const useBibleFigureDetail = (slug: string | null) => {
  return useQuery({
    queryKey: bibleFigureKeys.detail(slug || ''),
    queryFn: () => fetchBibleFigureDetail(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
  })
}
