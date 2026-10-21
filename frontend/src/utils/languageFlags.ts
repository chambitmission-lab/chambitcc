// 지원 언어 한 표 — 국가 코드(flag-icons용, 소문자)·국기 이모지·짧은 이름.
// 언어를 하나 더 붙일 때 고칠 곳은 LANGUAGES 와 ALIAS 두 줄, 그리고 LangFlag.tsx 의 SVG 한 줄뿐이다
// (SVG 는 컴포넌트가 Record<LanguageCountry, …> 로 들고 있어 빠뜨리면 컴파일이 막는다).
// OS 이모지 폰트에 의존하지 않고 SVG 국기를 렌더링하기 위해 국가 코드를 기준으로 삼는다.

export type LanguageCountry = 'kr' | 'us' | 'vn' | 'jp' | 'fr' | 'cn' | 'th' | 'mm'

export interface LanguageMeta {
  /** ISO 3166-1 alpha-2 (flag-icons 파일명) */
  country: LanguageCountry
  flag: string
  /** 짧은 표시명 — 번역 칩에 쓴다 */
  name: string
}

const LANGUAGES: ReadonlyMap<LanguageCountry, LanguageMeta> = new Map<LanguageCountry, LanguageMeta>([
  ['kr', { country: 'kr', flag: '🇰🇷', name: '한글' }],
  ['us', { country: 'us', flag: '🇺🇸', name: 'EN' }],
  ['vn', { country: 'vn', flag: '🇻🇳', name: 'VI' }],
  ['jp', { country: 'jp', flag: '🇯🇵', name: 'JP' }],
  ['fr', { country: 'fr', flag: '🇫🇷', name: 'FR' }],
  ['cn', { country: 'cn', flag: '🇨🇳', name: 'CN' }],
  ['th', { country: 'th', flag: '🇹🇭', name: 'TH' }],
  ['mm', { country: 'mm', flag: '🇲🇲', name: 'MM' }],
])

/** 언어 코드(ISO 639-1) → 국가 코드. 국가 코드를 그대로 넣어도 된다 */
const ALIAS: ReadonlyMap<string, LanguageCountry> = new Map([
  ['ko', 'kr'],
  ['en', 'us'],
  ['vi', 'vn'],
  ['ja', 'jp'],
  ['zh', 'cn'],
  ['my', 'mm'],
])

/** 기본값은 한국어 */
const DEFAULT_LANGUAGE = LANGUAGES.get('kr')!

/** 언어 코드(ko/en/vi…) 또는 국가 코드(kr/us/vn…) → 언어 정보. 모르는 코드는 한국어 */
export const getLanguageMeta = (langCode?: string): LanguageMeta => {
  const code = langCode?.trim().toLowerCase() ?? ''
  const country = ALIAS.get(code) ?? (code as LanguageCountry)
  return LANGUAGES.get(country) ?? DEFAULT_LANGUAGE
}

// 언어 코드 → ISO 3166-1 alpha-2 국가 코드 (flag-icons용, 소문자)
export const getLanguageCountryCode = (langCode?: string): LanguageCountry => getLanguageMeta(langCode).country

// 언어 코드에 따른 국기 이모지 반환
export const getLanguageFlag = (langCode?: string): string => getLanguageMeta(langCode).flag

// 언어 코드에 따른 언어 이름 반환
export const getLanguageName = (langCode?: string): string => getLanguageMeta(langCode).name
