// 설교 '한 줄 붙잡기' API — /sermon 말씀 편지의 3단계. 본인 것만 읽고 쓴다(로그인 필수).
// 목회자 설교 메모장(/pastor/sermon/notes)과는 별개다.
import { request, requestRaw } from './utils/request'

export interface SermonTakeaway {
  sermon_id: number
  text: string
  /** 목사님께 이름 없이 전했는지 */
  shared: boolean
  sermon_title: string | null
  /** 'YYYY-MM-DD' */
  sermon_date: string | null
  created_at: string
  updated_at: string
}

export const getMySermonTakeaways = async (): Promise<SermonTakeaway[]> => {
  const data = await request<{ data: { items: SermonTakeaway[] } }>('/sermon-takeaways', {
    auth: 'required',
    errorMessage: '말씀 노트를 불러오지 못했습니다',
  })
  return data.data.items
}

export const saveSermonTakeaway = async (
  sermonId: number,
  text: string,
  shared: boolean,
): Promise<SermonTakeaway> => {
  const data = await request<{ data: SermonTakeaway }>(`/sermon-takeaways/${sermonId}`, {
    method: 'PUT',
    auth: 'required',
    json: { text, shared },
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

export interface SermonWeekDevotion {
  day: string
  passage: string | null
  title: string
  body: string
  prayer: string
  /** 본문 앞 몇 절 */
  text: string | null
}

export interface SermonWeekPack {
  summary: string[]
  kids: string
  devotions: SermonWeekDevotion[]
}

export interface SermonExtras {
  /** 목사님이 공개한 소그룹 나눔 질문 — 없으면 null */
  discussion: string[] | null
  /** 목사님이 공개한 한 주 묶음 — 없으면 null */
  week_pack: SermonWeekPack | null
}

/** 나눔 질문 + 한 주 묶음을 한 번에 — 설교 한 편을 열 때 작은 GET 두 개 대신 하나 (로그인 불필요) */
export const getSermonExtras = async (sermonId: number): Promise<SermonExtras> => {
  const data = await request<{ data: SermonExtras }>(`/sermons/${sermonId}/extras`, {
    errorMessage: '이번 주 말씀 자료를 불러오지 못했습니다',
  })
  return { discussion: data.data?.discussion ?? null, week_pack: data.data?.week_pack ?? null }
}
