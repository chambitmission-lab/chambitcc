// 언어 코드 → ISO 3166-1 alpha-2 국가 코드 (flag-icons용, 소문자)
// OS 이모지 폰트에 의존하지 않고 SVG 국기를 렌더링하기 위함
export const getLanguageCountryCode = (langCode?: string): string => {
  const normalizedCode = langCode?.trim().toLowerCase()

  switch (normalizedCode) {
    case 'ko':
    case 'kr':
      return 'kr'
    case 'en':
    case 'us':
      return 'us'
    case 'vi':
    case 'vn':
      return 'vn'
    case 'ja':
    case 'jp':
      return 'jp'
    case 'fr':
      return 'fr'
    case 'zh':
    case 'cn':
      return 'cn'
    case 'th':
      return 'th'
    default:
      return 'kr' // 기본값은 한국어
  }
}

// 언어 코드에 따른 국기 이모지 반환
export const getLanguageFlag = (langCode?: string): string => {
  const normalizedCode = langCode?.trim().toLowerCase()
  
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
    case 'th':
      return '🇹🇭'
    default:
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
    case 'th':
      return 'TH'
    default:
      return '한글'
  }
}
