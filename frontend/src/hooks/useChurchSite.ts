import { useAboutContent } from './useAboutContent'
import { parseCoords } from '../pages/Visit/geo'

/** 우리 교회 자리 — /visit 과 같은 출처(소개 콘텐츠 DB → i18n 기본값) */
export interface ChurchSite {
  name: string
  address: string
  postcode: string
  mapQuery: string
  coords: { lat: number; lng: number } | null
}

export const useChurchSite = (): ChurchSite => {
  const { tx } = useAboutContent()
  const address = tx('visitAddress').trim()
  return {
    name: tx('visitMapPinLabel').trim() || '참빛교회',
    address,
    postcode: tx('visitPostcode').trim(),
    mapQuery: tx('visitMapQuery').trim() || address,
    coords: parseCoords(tx('visitCoords').trim()),
  }
}
