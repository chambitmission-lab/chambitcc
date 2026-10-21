// 설교의 메아리 (성도가 붙잡은 한 줄 · 소그룹 나눔 질문)
import { pastorGet, pastorSend } from './_http'

export interface SermonEchoSermon {
  id: number
  title: string
  pastor: string
  bible_verse: string | null
  date: string | null
}

export interface SermonDiscussion {
  questions: string[]
  is_published: boolean
  updated_at: string | null
}

export interface SermonEchoData {
  sermon: SermonEchoSermon | null
  /** 한 줄을 남긴 성도 수(전하지 않은 것 포함 — 숫자만) */
  writers?: number
  /** 목사님께 이름 없이 전한 수 */
  shared?: number
  /** 전한 한 줄 — min_shared 명 미만이면 빈 배열 */
  lines?: string[]
  min_shared: number
  discussion?: SermonDiscussion | null
  recent: (SermonEchoSermon & { writers: number })[]
}

export const fetchSermonEcho = (sermonId: number | null): Promise<SermonEchoData> =>
  pastorGet(
    sermonId ? `/pastor/sermon-echo?sermon_id=${sermonId}` : '/pastor/sermon-echo',
    '설교의 메아리를 불러오지 못했습니다',
  )

export const draftDiscussionQuestions = (sermonId: number): Promise<{ questions: string[] }> =>
  pastorSend(`/pastor/sermon-echo/${sermonId}/questions/draft`, 'POST', {}, '나눔 질문을 만들지 못했습니다')

export const saveSermonDiscussion = (
  sermonId: number,
  data: { questions: string[]; is_published: boolean },
): Promise<SermonDiscussion> =>
  pastorSend(`/pastor/sermon-echo/${sermonId}/discussion`, 'PUT', data, '나눔 질문을 저장하지 못했습니다')
