import { useState } from 'react'
import { generateReflection, updateReflection } from '../api/biblePlan'
import type { PlanReflection } from '../types/biblePlan'
import { showToast } from '../utils/toast'

export interface ReflectionState {
  loading: boolean
  data?: PlanReflection
  error?: string
}

/**
 * 플랜 일차별 AI 묵상 상태 — 열림/생성/재생성(관리자)/수정(관리자).
 * 서버 캐시(react-query)가 아닌 로컬 상태인 이유: 묵상은 일차별로 지연 생성되고
 * 같은 화면 안에서만 쓰여서, 페이지 상태로 충분하다.
 */
export const usePlanReflections = (planId: number) => {
  const [reflections, setReflections] = useState<Record<number, ReflectionState>>({})
  const [openReflection, setOpenReflection] = useState<number | null>(null)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null)

  const toggleReflection = async (dayNumber: number) => {
    setOpenReflection((prev) => (prev === dayNumber ? null : dayNumber))
    if (reflections[dayNumber]?.data || reflections[dayNumber]?.loading) return
    setReflections((prev) => ({ ...prev, [dayNumber]: { loading: true } }))
    try {
      const data = await generateReflection(planId, dayNumber)
      setReflections((prev) => ({ ...prev, [dayNumber]: { loading: false, data } }))
    } catch (e) {
      setReflections((prev) => ({
        ...prev,
        [dayNumber]: {
          loading: false,
          error: e instanceof Error ? e.message : '생성 실패',
        },
      }))
    }
  }

  // 관리자 — 캐시 무시하고 AI 묵상 새로 생성
  const regenerateReflection = async (dayNumber: number) => {
    if (regeneratingDay !== null) return
    if (!confirm('이 일자의 AI 묵상을 새로 생성할까요? 기존 내용은 교체됩니다.')) return
    setRegeneratingDay(dayNumber)
    try {
      const data = await generateReflection(planId, dayNumber, true)
      setReflections((prev) => ({ ...prev, [dayNumber]: { loading: false, data } }))
      showToast('AI 묵상을 새로 생성했어요', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '다시 생성에 실패했습니다', 'error')
    } finally {
      setRegeneratingDay(null)
    }
  }

  // 관리자 — 수정 모달 저장
  const saveReflection = async (
    dayNumber: number,
    reflection: string,
    questions: string[],
  ) => {
    const data = await updateReflection(planId, dayNumber, { reflection, questions })
    setReflections((prev) => ({ ...prev, [dayNumber]: { loading: false, data } }))
    setEditingDay(null)
    showToast('묵상을 수정했어요', 'success')
  }

  return {
    reflections,
    openReflection,
    editingDay,
    setEditingDay,
    regeneratingDay,
    toggleReflection,
    regenerateReflection,
    saveReflection,
  }
}
