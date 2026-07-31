// 마지막 기도 설정 기억 — 재방문 시 "지난 기도 그대로 시작" 원탭 카드에 사용
import type { PrayerThemeId } from './prayerThemes'

export interface LastPrayerSetup {
  minutes: number
  themeId: PrayerThemeId | null
  ambienceId: string
  guidedMode: boolean
}

const KEY = 'prayer_focus_last_setup'

export const saveLastSetup = (setup: LastPrayerSetup): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(setup))
  } catch {
    // 저장 실패는 무시
  }
}

export const loadLastSetup = (): LastPrayerSetup | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LastPrayerSetup>
    if (typeof parsed.minutes !== 'number' || parsed.minutes < 1) return null
    return {
      minutes: parsed.minutes,
      themeId: (parsed.themeId as PrayerThemeId) ?? null,
      ambienceId: typeof parsed.ambienceId === 'string' ? parsed.ambienceId : 'silent',
      guidedMode: !!parsed.guidedMode,
    }
  } catch {
    return null
  }
}
