// '오늘의 한 걸음' — 이 기기에서 오늘 밟은 걸음(추천 말씀 읽기·말씀 카드)과 알림 안내 닫음 기록.
// 기도 걸음은 서버 값(내 최근 기도의 날짜)으로 판정하므로 여기 없다.
// 날짜(KST)가 바뀌면 걸음은 저절로 비워진다. 추천 카드와 걸음 목록이 같은 저장소를 본다.

import { useSyncExternalStore } from 'react'
import { kstDateKey } from '../../../../utils/date'
import { safeStorage } from '../../../../utils/safeStorage'

type LocalStep = 'read' | 'card'

const STEPS_KEY = 'home-rail-today-steps'
const ALARM_NUDGE_KEY = 'home-rail-alarm-nudge-dismissed'

const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const emit = () => listeners.forEach((fn) => fn())

const todayKey = () => kstDateKey(new Date())

const readSteps = (): LocalStep[] => {
  const raw = safeStorage.getJson(STEPS_KEY) as { date?: unknown; steps?: unknown } | undefined
  if (!raw || raw.date !== todayKey() || !Array.isArray(raw.steps)) return []
  return raw.steps.filter((s): s is LocalStep => s === 'read' || s === 'card')
}

/** 오늘 이 걸음을 밟았다고 적는다 — 이미 적혀 있으면 아무 일도 없다 */
const markTodayStep = (step: LocalStep) => {
  const steps = readSteps()
  if (steps.includes(step)) return
  safeStorage.setJson(STEPS_KEY, { date: todayKey(), steps: [...steps, step] })
  emit()
}

const dismissAlarmNudge = () => {
  safeStorage.set(ALARM_NUDGE_KEY, '1')
  emit()
}

// 스냅숏은 원시값(문자열)이라 매번 새로 읽어도 참조가 흔들리지 않는다
const snapshot = () => `${readSteps().sort().join(',')}|${safeStorage.get(ALARM_NUDGE_KEY) === '1' ? 1 : 0}`

const useTodaySteps = () => {
  const snap = useSyncExternalStore(subscribe, snapshot, snapshot)
  const [steps, dismissed] = snap.split('|')
  const done = steps.split(',')
  return {
    readDone: done.includes('read'),
    cardDone: done.includes('card'),
    alarmNudgeDismissed: dismissed === '1',
  }
}

export { useTodaySteps, markTodayStep, dismissAlarmNudge }
