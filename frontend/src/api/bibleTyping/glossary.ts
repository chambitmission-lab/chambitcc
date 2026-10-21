// 알아두면 좋은 말 — 성도들이 남긴 한 줄
import { requestData, requestRaw } from '../utils/request'

export interface GlossaryLine {
  id: number
  name: string
  avatar_url: string | null
  message: string
  mine: boolean
  created_at: string
}

export interface GlossaryLineBucket {
  count: number
  lines: GlossaryLine[]
}

export const getGlossaryLines = (terms: string[]): Promise<Record<string, GlossaryLineBucket>> =>
  requestData(`/bible-typing/glossary-lines?terms=${encodeURIComponent(terms.join(','))}`, {
    auth: 'required',
    errorMessage: '한 줄을 불러오지 못했어요',
  })

export const saveGlossaryLine = (input: {
  term: string
  message: string
  book_number?: number
  chapter?: number
  verse_id?: number
}): Promise<{ id: number; term: string; message: string }> =>
  requestData('/bible-typing/glossary-lines', {
    method: 'PUT',
    auth: 'required',
    json: input,
    errorMessage: '한 줄을 남기지 못했어요',
  })

export const deleteGlossaryLine = async (id: number): Promise<void> => {
  await requestRaw(`/bible-typing/glossary-lines/${id}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '한 줄을 지우지 못했어요',
  })
}
