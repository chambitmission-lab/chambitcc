// 기도 주제 카탈로그
// 주제 선택 시 진입 의식의 시작 멘트와 기도 중간 말씀이 달라진다.
// 백엔드(prayer_sessions.theme)에 그대로 저장되는 키이기도 하므로 id는 안정적으로 유지할 것.

export type PrayerThemeId = 'thanks' | 'repentance' | 'anxiety' | 'intercession' | 'decision' | 'freedom'

export interface PrayerTheme {
  id: PrayerThemeId
  /** material-icons-outlined 이름 */
  icon: string
  labelKey: string
  descKey: string
  /** 진입 의식 단계에 띄울 시작 멘트(말씀). i18n 키 */
  startQuoteKey: string
  startQuoteRefKey: string
  /** 기도 중간(50%) 시점에 띄울 말씀 */
  midVerseTextKey: string
  midVerseRefKey: string
  /** 종료 화면 격려 메시지(현재 SessionComplete에서 직접 t() 호출하여 사용) */
  closingMessageKey: string
}

// startQuote / midVerse 등은 prayer 로케일에서 자유롭게 추가하는 식이 아니라,
// 일반적인 묵상 구절은 i18n에 따로 키를 등록하지 않고 평이한 한 줄 한국어로 둔다.
// 여기 i18n 키들은 prayer 로케일에 추가했다.
// (i18n 키가 없으면 t() 가 키 자체를 그대로 반환하므로 fallback이 유지됨)

export const PRAYER_THEMES: PrayerTheme[] = [
  {
    id: 'thanks',
    icon: 'favorite',
    labelKey: 'themeThanks',
    descKey: 'themeThanksDesc',
    startQuoteKey: 'themeThanksQuote',
    startQuoteRefKey: 'themeThanksQuoteRef',
    midVerseTextKey: 'themeThanksMidVerse',
    midVerseRefKey: 'themeThanksMidVerseRef',
    closingMessageKey: 'themeThanksClose',
  },
  {
    id: 'repentance',
    icon: 'spa',
    labelKey: 'themeRepentance',
    descKey: 'themeRepentanceDesc',
    startQuoteKey: 'themeRepentanceQuote',
    startQuoteRefKey: 'themeRepentanceQuoteRef',
    midVerseTextKey: 'themeRepentanceMidVerse',
    midVerseRefKey: 'themeRepentanceMidVerseRef',
    closingMessageKey: 'themeRepentanceClose',
  },
  {
    id: 'anxiety',
    icon: 'self_improvement',
    labelKey: 'themeAnxiety',
    descKey: 'themeAnxietyDesc',
    startQuoteKey: 'themeAnxietyQuote',
    startQuoteRefKey: 'themeAnxietyQuoteRef',
    midVerseTextKey: 'themeAnxietyMidVerse',
    midVerseRefKey: 'themeAnxietyMidVerseRef',
    closingMessageKey: 'themeAnxietyClose',
  },
  {
    id: 'intercession',
    icon: 'diversity_3',
    labelKey: 'themeIntercession',
    descKey: 'themeIntercessionDesc',
    startQuoteKey: 'themeIntercessionQuote',
    startQuoteRefKey: 'themeIntercessionQuoteRef',
    midVerseTextKey: 'themeIntercessionMidVerse',
    midVerseRefKey: 'themeIntercessionMidVerseRef',
    closingMessageKey: 'themeIntercessionClose',
  },
  {
    id: 'decision',
    icon: 'route',
    labelKey: 'themeDecision',
    descKey: 'themeDecisionDesc',
    startQuoteKey: 'themeDecisionQuote',
    startQuoteRefKey: 'themeDecisionQuoteRef',
    midVerseTextKey: 'themeDecisionMidVerse',
    midVerseRefKey: 'themeDecisionMidVerseRef',
    closingMessageKey: 'themeDecisionClose',
  },
  {
    id: 'freedom',
    icon: 'air',
    labelKey: 'themeFreedom',
    descKey: 'themeFreedomDesc',
    // 자유 기도는 별도 시작 멘트 없음 — 기본 골방 말씀 사용
    startQuoteKey: '',
    startQuoteRefKey: '',
    midVerseTextKey: 'themeFreedomMidVerse',
    midVerseRefKey: 'themeFreedomMidVerseRef',
    closingMessageKey: 'themeFreedomClose',
  },
]

export const findTheme = (id?: string | null): PrayerTheme | null => {
  if (!id) return null
  return PRAYER_THEMES.find((t) => t.id === id) ?? null
}
