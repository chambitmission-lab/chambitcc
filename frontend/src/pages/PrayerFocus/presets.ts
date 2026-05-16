// 감성형 시간 프리셋 — 숫자 + 감정적 라벨
// labelKey/descKey 는 prayer i18n의 키 이름

export interface PrayerTimePreset {
  minutes: number
  labelKey: string
  descKey?: string
  highlight?: boolean
}

export const PRAYER_TIME_PRESETS: PrayerTimePreset[] = [
  { minutes: 5, labelKey: 'timeBriefPause' },
  { minutes: 10, labelKey: 'timeShortStay' },
  { minutes: 15, labelKey: 'timeQuietFocus', highlight: true },
  { minutes: 20, labelKey: 'timeStillness' },
  { minutes: 30, labelKey: 'timeDeepPrayer' },
]
