import { useState } from 'react'
import { generateReflection, streamReflection, updateReflection } from '../api/biblePlan'
import type { PlanReflection } from '../types/biblePlan'
import { showToast } from '../utils/toast'

export interface ReflectionState {
  loading: boolean
  data?: PlanReflection
  /** SSE 스트리밍 중 지금까지 도착한 묵상 본문 (타자기 효과 렌더링용) */
  streamText?: string
  error?: string
}

/**
 * 플랜 일차별 AI 묵상 상태 — 열림/생성/재생성(관리자)/수정(관리자).
 * 서버 캐시(react-query)가 아닌 로컬 상태인 이유: 묵상은 일차별로 지연 생성되고
 * 같은 화면 안에서만 쓰여서, 페이지 상태로 충분하다.
 *
 * 생성은 SSE 스트리밍(streamReflection)이 기본 — Gemini 토큰이 도착하는 대로
 * streamText에 쌓여 실시간으로 보인다. 스트림이 아무것도 보내기 전에 실패하면
 * (구버전 서버·프록시 비호환 등) 기존 블로킹 API로 자동 폴백한다.
 */
export const usePlanReflections = (planId: number) => {
  const [reflections, setReflections] = useState<Record<number, ReflectionState>>({})
  const [openReflection, setOpenReflection] = useState<number | null>(null)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null)

  const runReflection = async (dayNumber: number, force: boolean) => {
    let receivedAny = false
    setReflections((prev) => ({
      ...prev,
      [dayNumber]: { loading: true, streamText: '' },
    }))

    try {
      await streamReflection(planId, dayNumber, force, {
        onDelta: (text) => {
          receivedAny = true
          setReflections((prev) => ({
            ...prev,
            [dayNumber]: {
              loading: true,
              streamText: (prev[dayNumber]?.streamText ?? '') + text,
            },
          }))
        },
        onDone: (data) => {
          receivedAny = true
          setReflections((prev) => ({ ...prev, [dayNumber]: { loading: false, data } }))
        },
      })
    } catch (e) {
      if (!receivedAny) {
        // 스트림 시작 전 실패 — 블로킹 API 폴백 (여기서 실패하면 호출자에게 throw)
        const data = await generateReflection(planId, dayNumber, force)
        setReflections((prev) => ({ ...prev, [dayNumber]: { loading: false, data } }))
        return
      }
      throw e
    }
  }

  const toggleReflection = async (dayNumber: number) => {
    setOpenReflection((prev) => (prev === dayNumber ? null : dayNumber))
    if (reflections[dayNumber]?.data || reflections[dayNumber]?.loading) return
    try {
      await runReflection(dayNumber, false)
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
    const previous = reflections[dayNumber]
    setRegeneratingDay(dayNumber)
    try {
      await runReflection(dayNumber, true)
      showToast('AI 묵상을 새로 생성했어요', 'success')
    } catch (e) {
      // 실패 시 기존 묵상 복원
      setReflections((prev) => ({
        ...prev,
        [dayNumber]: previous ?? { loading: false },
      }))
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
