// 언어 코드에 따른 국기 이모지 반환
export const getLanguageFlag = (langCode?: string): string => {
  const normalizedCode = langCode?.trim().toLowerCase()
  console.log('🚩 getLanguageFlag - input:', langCode, '→ normalized:', normalizedCode)
  
  switch (normalizedCode) {
    case 'ko':
    case 'kr':
      return '🇰🇷'
    case 'en':
    case 'us':
      return '🇺🇸'
    case 'vi':
    case 'vn':
      return '🇻🇳'
    case 'ja':
    case 'jp':
      return '🇯🇵'
    case 'fr':
      return '🇫🇷'
    case 'zh':
    case 'cn':
      return '🇨🇳'
    default:
      console.warn('⚠️ Unknown language code:', langCode, '→', normalizedCode)
      return '🇰🇷' // 기본값은 한국어
  }
}

// 언어 코드에 따른 언어 이름 반환
export const getLanguageName = (langCode?: string): string => {
  const normalizedCode = langCode?.trim().toLowerCase()
  
  switch (normalizedCode) {
    case 'ko':
    case 'kr':
      return '한글'
    case 'en':
    case 'us':
      return 'EN'
    case 'vi':
    case 'vn':
      return 'VI'
    case 'ja':
    case 'jp':
      return 'JP'
    case 'fr':
      return 'FR'
    case 'zh':
    case 'cn':
      return 'CN'
    default:
      return '한글'
  }
}
