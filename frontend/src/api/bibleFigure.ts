// 성경 인물 가계도 API

import type { BibleFigureDetail, GenealogyResponse } from '../types/bibleFigure'
import { request } from './utils/request'

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
