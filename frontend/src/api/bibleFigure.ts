// 성경 인물 가계도 API

import type { BibleFigureDetail, GenealogyResponse } from '../types/bibleFigure'
import { requestData } from './utils/request'

export const fetchMessianicGenealogy = (): Promise<GenealogyResponse> =>
  requestData('/bible-figures/genealogy/messianic', { errorMessage: '가계도 데이터를 불러오지 못했습니다' })

export const fetchBibleFigureDetail = (slug: string): Promise<BibleFigureDetail> =>
  requestData(`/bible-figures/${encodeURIComponent(slug)}`, { errorMessage: '인물 정보를 불러오지 못했습니다' })
