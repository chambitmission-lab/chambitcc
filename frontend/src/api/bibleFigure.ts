// 성경 인물 가계도 API
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  BibleFigureDetail,
  BibleFigureSummary,
  GenealogyResponse,
} from '../types/bibleFigure'

interface ListResponse {
  success: boolean
  data: {
    items: BibleFigureSummary[]
    total: number
    page: number
    page_size: number
  }
}

interface DetailResponse {
  success: boolean
  data: BibleFigureDetail
}

interface GenealogyApiResponse {
  success: boolean
  data: GenealogyResponse
}

export const fetchMessianicGenealogy = async (): Promise<GenealogyResponse> => {
  const response = await apiFetch(`${API_V1}/bible-figures/genealogy/messianic`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('가계도 데이터를 불러오지 못했습니다')
  }
  const json: GenealogyApiResponse = await response.json()
  return json.data
}

export const fetchBibleFigureDetail = async (slug: string): Promise<BibleFigureDetail> => {
  const response = await apiFetch(`${API_V1}/bible-figures/${encodeURIComponent(slug)}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('인물 정보를 불러오지 못했습니다')
  }
  const json: DetailResponse = await response.json()
  return json.data
}

export const listBibleFigures = async (params?: {
  testament?: 'OLD' | 'NEW' | 'BOTH'
  era?: string
  messianic_only?: boolean
}): Promise<ListResponse['data']> => {
  const search = new URLSearchParams()
  if (params?.testament) search.set('testament', params.testament)
  if (params?.era) search.set('era', params.era)
  if (params?.messianic_only) search.set('messianic_only', 'true')
  const url = `${API_V1}/bible-figures${search.toString() ? `?${search}` : ''}`
  const response = await apiFetch(url, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw new Error('인물 목록을 불러오지 못했습니다')
  }
  const json: ListResponse = await response.json()
  return json.data
}
