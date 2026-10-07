// 설교 '한 줄 붙잡기' API — /sermon 말씀 편지의 3단계. 본인 것만 읽고 쓴다(로그인 필수).
// 목회자 설교 메모장(/pastor/sermon/notes)과는 별개다.
import { request, requestRaw, type UntypedJson } from './utils/request'

export interface SermonTakeaway {
  sermon_id: number
  text: string
  created_at: string
  updated_at: string
}

export const getMySermonTakeaways = async (): Promise<SermonTakeaway[]> => {
  const data = await request<UntypedJson>('/sermon-takeaways', {
    auth: 'required',
    errorMessage: '말씀 노트를 불러오지 못했습니다',
  })
  return data.data.items
}

export const saveSermonTakeaway = async (sermonId: number, text: string): Promise<SermonTakeaway> => {
  const data = await request<UntypedJson>(`/sermon-takeaways/${sermonId}`, {
    method: 'PUT',
    auth: 'required',
    json: { text },
    errorMessage: '한 줄을 저장하지 못했습니다',
  })
  return data.data
}

export const deleteSermonTakeaway = async (sermonId: number): Promise<void> => {
  await requestRaw(`/sermon-takeaways/${sermonId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '한 줄을 지우지 못했습니다',
  })
}
