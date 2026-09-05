// 성경 인물 가계도 API
import { API_V1 } from '../config/api'
import type {
  BibleFigureDetail,
  BibleFigureSummary,
  GenealogyResponse,
} from '../types/bibleFigure'
import { request } from './utils/request'

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
  const json: GenealogyApiResponse = await request<GenealogyApiResponse>('/bible-figures/genealogy/messianic', { errorMessage: '가계도 데이터를 불러오지 못했습니다' })
  return json.data
}

export const fetchBibleFigureDetail = async (slug: string): Promise<BibleFigureDetail> => {
  const json: DetailResponse = await request<DetailResponse>(`/bible-figures/${encodeURIComponent(slug)}`, { errorMessage: '인물 정보를 불러오지 못했습니다' })
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
  const json: ListResponse = await request<ListResponse>(url, { errorMessage: '인물 목록을 불러오지 못했습니다' })
  return json.data
}
