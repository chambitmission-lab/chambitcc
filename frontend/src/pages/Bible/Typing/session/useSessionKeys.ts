/**
 * 필사 세션 키보드 단축키 — Tab/Shift+Tab 절 이동, Esc 처음부터, 틀린 뒤 Enter 다시 쓰기,
 * 입력칸 밖에서 글자를 치면 바로 입력칸으로.
 *
 * 최신 상태는 ref 로 읽어 리스너는 한 번만 단다 (TypingSession.tsx 에서 분리).
 */
import { useEffect, useRef } from 'react'
import type { Outcome } from './sessionModel'

interface KeyState {
  current: number | null
  outcome: Outcome | null
  showSummary: boolean
  /** 목표 달성·바통·릴레이 완성 같은 모달이 떠 있는 동안은 단축키를 쓰지 않는다 */
  goalOpen: boolean
  count: number
  goTo: (idx: number) => void
}

export const useSessionKeys = (state: KeyState) => {
  const keyState = useRef(state)
  useEffect(() => {
    keyState.current = state
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = keyState.current
      if (st.showSummary || st.goalOpen || st.current === null) return
      // 한 줄 남기기 입력칸에서는 절 이동·처음부터 단축키를 쓰지 않는다
      const focusEl = document.activeElement
      if (focusEl instanceof HTMLInputElement && focusEl.closest('.bt-gloss')) return
      const cur = st.current
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const ni = e.shiftKey ? cur - 1 : cur + 1
        e.preventDefault()
        if (ni >= 0 && ni < st.count) st.goTo(ni)
        return
      }
      if (e.isComposing || e.keyCode === 229) return
      if (e.key === 'Escape') {
        if (document.querySelector('[role="dialog"]')) return
        e.preventDefault()
        st.goTo(cur)
        return
      }
      if (e.key === 'Enter' && st.outcome?.status === 'failed') {
        e.preventDefault()
        e.stopPropagation()
        st.goTo(cur)
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.activeElement
        const typingElsewhere =
          el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)
        if (!typingElsewhere)
          document.querySelector<HTMLTextAreaElement>('.bt-active .bt-input:not(:disabled)')?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])
}
