// 설교 개요 보드
import type { SermonNote } from './notes'
import { pastorDelete, pastorGet, pastorSend } from './_http'

export interface OutlineSection {
  id: string
  label: string
  /** 개요 — 이 칸에서 전할 요지 */
  text: string
  /** 원고 — 실제로 말할 글. 강단 보기는 빈 줄로 나눠 한 장씩 넘긴다(예전 개요엔 없을 수 있다) */
  manuscript?: string
  note_ids: number[]
  /** 설교 준비실 — 원고에 넣은 AI 문단 초안 중 아직 고치지 않은 것(원고에 그대로 남은 동안만 서버가 둔다) */
  ai_drafts?: string[]
}

/** 저장 요청용 — manuscript 를 null 로 보내면 서버가 저장된 원고를 그대로 둔다(1초마다 전체 원고를 다시 보내지 않게) */
export type OutlineSectionPatch = Omit<OutlineSection, 'manuscript'> & { manuscript?: string | null }

export interface OutlineSummary {
  id: number
  title: string
  passage: string | null
  preach_on: string | null
  status: 'draft' | 'done'
  sermon_id: number | null
  note_count: number
  updated_at: string | null
}

export interface SermonOutline extends OutlineSummary {
  sections: OutlineSection[]
  notes: SermonNote[]
}

export const fetchOutlines = (): Promise<OutlineSummary[]> =>
  pastorGet('/pastor/outlines', '설교 개요를 불러오는데 실패했습니다')

export const fetchOutline = (id: number): Promise<SermonOutline> =>
  pastorGet(`/pastor/outlines/${id}`, '설교 개요를 불러오는데 실패했습니다')

export const createOutline = (data: {
  title: string
  passage?: string | null
  preach_on?: string | null
  note_ids?: number[]
  /** 뼈대를 함께 보내면(대지 후보·설교 계획) 기본 칸 대신 이 칸들로 — 만들고 또 고치는 왕복을 없앤다 */
  sections?: OutlineSectionPatch[]
}): Promise<SermonOutline> => pastorSend('/pastor/outlines', 'POST', data, '개요를 만들지 못했습니다')

export const updateOutline = (
  id: number,
  data: Partial<{ title: string; passage: string | null; preach_on: string | null; sections: OutlineSectionPatch[] }>,
): Promise<SermonOutline> => pastorSend(`/pastor/outlines/${id}`, 'PATCH', data, '개요 저장에 실패했습니다')

export const deleteOutline = (id: number): Promise<void> =>
  pastorDelete(`/pastor/outlines/${id}`, '개요 삭제에 실패했습니다')

export const finishOutline = (
  id: number,
  data: { sermon_id?: number | null; preached_on?: string | null },
): Promise<SermonOutline> => pastorSend(`/pastor/outlines/${id}/finish`, 'POST', data, '설교 마침을 기록하지 못했습니다')
