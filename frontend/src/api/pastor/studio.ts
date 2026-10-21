// 설교 준비실 (담임목사 전용) — AI 동역자 문답 · 문단 초안
import type { ReviewFinding } from './ai'
import { pastorGet, pastorSend } from './_http'

export type StudioStep = 'passage' | 'study' | 'outline' | 'manuscript' | 'review' | 'pulpit'

/** 준비실에 들어올 수 있는지 — 목회자 권한 + 직분 '담임목사' (서버가 판단) */
export const fetchStudioAccess = (): Promise<{ allowed: boolean }> =>
  pastorGet('/pastor/studio', '설교 준비실 권한을 확인하지 못했습니다')

export interface StudioVerse {
  label: string
  /** 서버가 찾아 붙인 개역개정 본문 */
  text: string
}

export interface StudioAnswer {
  answer: string
  verses: StudioVerse[]
  follow_ups: string[]
  /** 답 속 말씀 인용이 개역개정과 다른 곳 */
  scripture: ReviewFinding[]
  /** 1 — 이단 표지가 있어 답 전체를 버렸다 */
  filtered: number
}

export interface StudioTurn {
  role: 'me' | 'ai'
  text: string
}

export const askStudio = (
  outlineId: number,
  data: { question: string; step: StudioStep; section_id?: string | null; history: StudioTurn[] },
): Promise<StudioAnswer> =>
  pastorSend(`/pastor/studio/outlines/${outlineId}/ask`, 'POST', data, 'AI 동역자가 답하지 못했습니다')

export interface StudioDraft {
  section_id: string
  label: string
  paragraphs: string[]
  notes: string[]
  scripture: ReviewFinding[]
  filtered: number
}

export const draftStudio = (
  outlineId: number,
  data: { section_id: string; direction: string; length: 'short' | 'normal' },
): Promise<StudioDraft> =>
  pastorSend(`/pastor/studio/outlines/${outlineId}/draft`, 'POST', data, '문단 초안을 받지 못했습니다')
