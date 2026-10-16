import { useQuery } from '@tanstack/react-query'
import { getGardenTheme, type GardenTheme } from '../api/garden'
import { gardenKeys } from './queryKeys'

/** 못 불러왔을 때 쓰는 기본 테마 */
export const DEFAULT_GARDEN_THEME: GardenTheme = {
  theme_type: 'preset',
  preset_name: 'classic',
  moon_image_url: null,
  sun_image_url: null,
}

/** 정원 테마 — 나무 화면과 꾸미기 모달이 같은 캐시를 본다(예전엔 각자 effect 로 두 번 받았다) */
export const useGardenTheme = () =>
  useQuery({
    queryKey: gardenKeys.theme(),
    queryFn: getGardenTheme,
    staleTime: 1000 * 60 * 5,
  })
