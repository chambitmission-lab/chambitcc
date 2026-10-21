// 마지막 기도 설정 기억 — 재방문 시 "지난 기도 그대로 시작" 원탭 카드에 사용
import type { PrayerThemeId } from './prayerThemes'
import { safeStorage } from '../../utils/safeStorage'

export interface LastPrayerSetup {
  minutes: number
  themeId: PrayerThemeId | null
  ambienceId: string
  guidedMode: boolean
}

const KEY = 'prayer_focus_last_setup'

// 저장 실패는 무시
export const saveLastSetup = (setup: LastPrayerSetup): void => {
  safeStorage.setJson(KEY, setup)
}

export const loadLastSetup = (): LastPrayerSetup | null => {
  const parsed = safeStorage.getJson(KEY) as Partial<LastPrayerSetup> | null | undefined
  if (!parsed || typeof parsed !== 'object') return null
  if (typeof parsed.minutes !== 'number' || parsed.minutes < 1) return null
  return {
    minutes: parsed.minutes,
    themeId: (parsed.themeId as PrayerThemeId) ?? null,
    ambienceId: typeof parsed.ambienceId === 'string' ? parsed.ambienceId : 'silent',
    guidedMode: !!parsed.guidedMode,
  }
}
