import type { ComponentType } from 'react'
import { preloadBudget, scheduleAfterFirstScreen } from '../../utils/idlePreload'

type NotificationModalProps = { isOpen: boolean; onClose: () => void }

// 알림 모달 청크의 동적 import 를 한곳에 모은다.
// NewHeader 의 lazy() 와 미리 받기(warm)가 같은 함수를 써야 청크가 하나로 공유된다.
export const loadNotificationModal = (): Promise<{ default: ComponentType<NotificationModalProps> }> =>
  import('./NotificationModal').then((m) => {
    resolved = m.default
    return m
  })

let resolved: ComponentType<NotificationModalProps> | null = null

/**
 * 이미 도착한 모달 컴포넌트 (아직이면 null).
 * 청크를 미리 받아놔도 lazy() 는 첫 렌더에서 반드시 한 번 suspend 해 fallback 이 커밋되고,
 * React 는 fallback 을 그린 뒤 300ms 안에는 본 내용을 커밋하지 않는다(깜빡임 방지 스로틀).
 * 그래서 첫 탭만 스피너가 0.3초 넘게 보였다 — 도착한 뒤에는 lazy 를 거치지 않고 바로 그린다.
 */
export const getLoadedNotificationModal = (): ComponentType<NotificationModalProps> | null => resolved

let warmed: Promise<unknown> | null = null

/**
 * 알림 모달 청크를 미리 받아둔다 (여러 번 불러도 한 번만 요청).
 * 종을 누른 뒤에 받기 시작하면 도착할 때까지 아무것도 안 그려져 "무겁게" 열린다 —
 * 헤더 마운트 뒤 유휴 시간과 종 버튼 hover/pointerdown 에서 미리 불러 첫 탭에 바로 뜨게 한다.
 */
export const warmNotificationModal = (): Promise<unknown> => {
  if (!warmed) {
    warmed = loadNotificationModal().catch(() => {
      // 오프라인 등 실패 시 다음 기회에 재시도할 수 있게 초기화
      warmed = null
    })
  }
  return warmed
}

/** 첫 화면이 끝난 뒤 유휴 시간에 미리 받기 — 절약 모드·2G 에서는 건너뛴다. 반환값은 취소 함수 */
export const warmNotificationModalOnIdle = (): (() => void) => {
  if (preloadBudget() === 'none') return () => undefined
  return scheduleAfterFirstScreen(() => void warmNotificationModal(), { settleMs: 1500 })
}
