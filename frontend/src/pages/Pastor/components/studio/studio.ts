// 설교 준비실 공용 — 단계 정의 · 진행 판단 · 본문 조회 (컴포넌트 파일과 분리: fast-refresh 규칙)
import { useQuery } from '@tanstack/react-query'
import { fetchSermonStudy, type OutlineSection, type SermonStudy, type StudioStep } from '../../../../api/pastor'
import { pastorKeys } from '../../../../hooks/queryKeys'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue'
import { countChars, pendingDraftsOf, sectionBody } from '../manuscript'

export interface StepDef {
  id: StudioStep
  no: number
  /** 레일·칩의 짧은 이름 */
  label: string
  /** 문장 속에서 부르는 이름 — "본문 정하기 단계에서" */
  title: string
  icon: string
  /** 레일 아래 한 줄 — 이 단계에서 하는 일 */
  hint: string
}

export const STEPS: StepDef[] = [
  { id: 'passage', no: 1, label: '본문', title: '본문 정하기', icon: 'menu_book', hint: '말씀 앞에 머물기' },
  { id: 'study', no: 2, label: '연구', title: '본문 연구', icon: 'travel_explore', hint: '배경·원어·구속사·적용' },
  { id: 'outline', no: 3, label: '뼈대', title: '뼈대 세우기', icon: 'account_tree', hint: '중심 명제와 대지' },
  { id: 'manuscript', no: 4, label: '원고', title: '원고 쓰기', icon: 'edit_note', hint: '목사님의 말로' },
  { id: 'review', no: 5, label: '점검', title: '원고 점검', icon: 'fact_check', hint: '말씀·교리·복음 확인' },
  { id: 'pulpit', no: 6, label: '강단·나눔', title: '강단과 나눔', icon: 'campaign', hint: '강단 보기·한 주 묶음' },
]

export const isStep = (v: string | null): v is StudioStep => STEPS.some(s => s.id === v)

export const stepOf = (id: StudioStep): StepDef => STEPS.find(s => s.id === id) ?? STEPS[0]

/** 원고에 그대로 남아 있는 AI 초안 문단 수 — 고친 문단은 목사님 글이다 */
export const pendingDraftCount = (sections: OutlineSection[]): number => sections.reduce((n, s) => n + pendingDraftsOf(s).length, 0)

export const manuscriptChars = (sections: OutlineSection[]): number => sections.reduce((n, s) => n + countChars(sectionBody(s)), 0)

export interface StudioProgress {
  /** 원고 전체 글자 수(공백 제외) */
  chars: number
  /** 고치지 않은 AI 초안 문단 수 */
  pending: number
  /** '해 두신' 단계 — 레일의 체크 표시(막지는 않는다. 순서는 목사님이 자유롭게) */
  done: ReadonlySet<StudioStep>
}

/** 원고 전체를 한 번만 훑어 단계 진행을 구한다 — 렌더마다 단계 수만큼 되풀이하지 않게 useMemo 로 감싸 쓴다 */
export const studioProgress = (d: {
  passage: string
  sections: OutlineSection[]
  noteCount: number
  briefed: boolean
  status: 'draft' | 'done'
}): StudioProgress => {
  const chars = manuscriptChars(d.sections)
  const pending = pendingDraftCount(d.sections)
  const done = new Set<StudioStep>()
  if (d.passage.trim()) done.add('passage')
  if (d.briefed || d.noteCount > 0) done.add('study')
  if (d.sections.filter(s => s.text.trim()).length >= 2) done.add('outline')
  if (chars >= 1000) done.add('manuscript')
  if (chars >= 1000 && pending === 0) done.add('review')
  if (d.status === 'done') done.add('pulpit')
  return { chars, pending, done }
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
