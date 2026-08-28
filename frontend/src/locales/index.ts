// 다국어 지원 메인 파일
import { ko } from './ko'

export type Language = 'ko' | 'en'

/** 한 언어분 번역 사전 — `t: any` 대신 프로퍼티 오타까지 잡히는 타입 */
export type Translation = typeof ko

// 영어 사전(~100KB)은 필요할 때만 내려받는다 — 사용자 대다수가 한국어라
// 첫 화면 엔트리 청크에 en 전체를 싣는 건 순수 낭비였다.
// 로드 전까지 en 슬롯은 ko 를 가리키고(폴백), loadTranslation('en') 이 끝나면 교체된다.
// 소비자는 `translations[language]` 를 동기로 읽으므로 객체 자체는 그대로 두고 슬롯만 바꾼다.
export const translations: Record<Language, Translation> = {
  ko,
  en: ko,
}

const loadedLanguages = new Set<Language>(['ko'])
let enPromise: Promise<void> | null = null

export const isTranslationLoaded = (lang: Language): boolean => loadedLanguages.has(lang)

/** 해당 언어 사전을 받아 `translations` 슬롯에 채운다. 이미 있으면 즉시 resolve */
export const loadTranslation = (lang: Language): Promise<void> => {
  if (loadedLanguages.has(lang)) return Promise.resolve()
  if (!enPromise) {
    enPromise = import('./en')
      .then((m) => {
        // ko 의 리터럴 값 타입과는 다르지만 키 구조는 같다 (기존에도 translations[lang] 으로 합쳐 썼다)
        translations.en = m.en as unknown as Translation
        loadedLanguages.add('en')
      })
      .catch(() => {
        enPromise = null // 오프라인 등 — 다음 호출에서 재시도
      })
  }
  return enPromise
}

// 브라우저 언어 감지
export const detectLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ko')) return 'ko'
  return 'en'
}

// 로컬 스토리지에서 언어 가져오기
export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem('language') as Language
  return stored || detectLanguage()
}

// 로컬 스토리지에 언어 저장
export const setStoredLanguage = (lang: Language): void => {
  localStorage.setItem('language', lang)
}
