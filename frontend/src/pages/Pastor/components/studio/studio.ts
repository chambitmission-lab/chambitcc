// 설교 준비실 공용 — 단계 정의 · 진행 판단 · 본문 조회 (컴포넌트 파일과 분리: fast-refresh 규칙)
import { useQuery } from '@tanstack/react-query'
import { fetchSermonStudy, type OutlineSection, type SermonStudy, type StudioStep } from '../../../../api/pastor'
import { pastorKeys } from '../../../../hooks/queryKeys'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue'
import { countChars, sectionBody } from '../manuscript'

export interface StepDef {
  id: StudioStep
  no: number
  label: string
  icon: string
  /** 레일 아래 한 줄 — 이 단계에서 하는 일 */
  hint: string
}

export const STEPS: StepDef[] = [
  { id: 'passage', no: 1, label: '본문', icon: 'menu_book', hint: '말씀 앞에 머물기' },
  { id: 'study', no: 2, label: '연구', icon: 'travel_explore', hint: '배경·원어·구속사·적용' },
  { id: 'outline', no: 3, label: '뼈대', icon: 'account_tree', hint: '중심 명제와 대지' },
  { id: 'manuscript', no: 4, label: '원고', icon: 'edit_note', hint: '목사님의 말로' },
  { id: 'review', no: 5, label: '점검', icon: 'fact_check', hint: '말씀·교리·복음 확인' },
  { id: 'pulpit', no: 6, label: '강단·나눔', icon: 'campaign', hint: '강단 보기·한 주 묶음' },
]

export const isStep = (v: string | null): v is StudioStep => STEPS.some(s => s.id === v)

/** 원고에 그대로 남아 있는 AI 초안 문단 수 — 고친 문단은 목사님 글이다 */
export const pendingDraftCount = (sections: OutlineSection[]): number =>
  sections.reduce((n, s) => n + (s.ai_drafts ?? []).filter(d => (s.manuscript ?? '').includes(d.trim())).length, 0)

export const manuscriptChars = (sections: OutlineSection[]): number => sections.reduce((n, s) => n + countChars(sectionBody(s)), 0)

/** 단계마다 '해 두셨는지' — 레일의 체크 표시(막지는 않는다. 순서는 목사님이 자유롭게) */
export const stepDone = (
  step: StudioStep,
  d: { passage: string; sections: OutlineSection[]; noteCount: number; briefed: boolean; status: 'draft' | 'done' },
): boolean => {
  switch (step) {
    case 'passage':
      return !!d.passage.trim()
    case 'study':
      return d.briefed || d.noteCount > 0
    case 'outline':
      return d.sections.filter(s => s.text.trim()).length >= 2
    case 'manuscript':
      return manuscriptChars(d.sections) >= 1000
    case 'review':
      return manuscriptChars(d.sections) >= 1000 && pendingDraftCount(d.sections) === 0
    case 'pulpit':
      return d.status === 'done'
  }
}

export const usePassageStudy = (passage: string) => {
  const ref = useDebouncedValue(passage.trim(), 500)
  return useQuery<SermonStudy>({
    queryKey: pastorKeys.sermonStudy(ref),
    queryFn: () => fetchSermonStudy(ref),
    enabled: ref.length >= 2,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

/** 다가오는 주일(오늘이 주일이면 오늘) — YYYY-MM-DD 로컬 날짜 */
export const nextSunday = (from = new Date()): string => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + ((7 - from.getDay()) % 7))
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
