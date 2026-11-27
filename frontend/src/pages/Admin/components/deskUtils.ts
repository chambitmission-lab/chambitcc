/**
 * 관리 데스크 공용 규칙 — 화면 틀 클래스·PC 판별·단축키.
 * 화면마다 복사해 쓰던 것을 한 곳에 모았다(컴포넌트는 deskBits.tsx, 아이콘은 deskIcons.tsx).
 */
import { useEffect, useRef, type RefObject } from 'react'

/** 데스크 바깥 틀 — 헤더(56px) 아래를 꽉 채우고 PC 에선 안쪽 판만 스크롤한다 */
export const DESK_PAGE_CLS =
  'min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:!p-4 lg:overflow-hidden'

/** 데스크 안쪽 판 — PC 에서 왼쪽 400px 목록 + 오른쪽 상세 */
export const DESK_FRAME_CLS =
  'max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl'

export const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

export const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)

/** ↑↓ 로 옮긴 다음 자리 — 양 끝에서 멈춘다(i 가 -1 이면 ↓ 는 첫 줄, ↑ 도 첫 줄) */
export const stepIndex = (length: number, i: number, dir: 1 | -1) =>
  dir === 1 ? Math.min(length - 1, i + 1) : Math.max(0, i - 1)

interface DeskHotkeys {
  /** 주면 '/' 로 검색창에 초점 */
  searchRef?: RefObject<HTMLInputElement | null>
  /** ↑(-1) ↓(1) — 다음 줄을 고르고 스크롤하는 일은 화면이 한다 */
  onMove: (dir: 1 | -1) => void
  /** false 면 ↑↓ 를 건드리지 않는다(목록이 비었을 때 등). 기본 true */
  canMove?: boolean
  /** true 면 단축키 전체를 쉰다 */
  paused?: boolean
  /** 기본 true — PC(1024px 이상)에서만 동작 */
  desktopOnly?: boolean
  /** 입력 중 판별을 바꿀 때(기본 isTypingTarget) */
  isTyping?: (el: Element | null) => boolean
}

/**
 * 데스크 단축키: '/' 검색, ↑↓ 이동.
 * 확인창·모달이 떠 있거나 입력 중이면 무시한다. 리스너는 한 번만 달고 최신 값은 ref 로 읽는다.
 */
export function useDeskHotkeys(opts: DeskHotkeys) {
  const latest = useRef(opts)
  useEffect(() => {
    latest.current = opts
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { searchRef, onMove, canMove = true, paused, desktopOnly = true, isTyping = isTypingTarget } = latest.current
      if (e.metaKey || e.ctrlKey || e.altKey || paused) return
      if (desktopOnly && !isDesktop()) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTyping(document.activeElement)) return
      if (searchRef && e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || !canMove) return
      e.preventDefault()
      onMove(e.key === 'ArrowDown' ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
