// 인앱 브라우저(카카오톡 등) 감지 + 외부 브라우저 탈출
// 카카오 인앱 웹뷰는 설치된 PWA·기본 브라우저 세션과 분리돼 있어,
// 초대 링크 도착지에서 외부 브라우저로 내보내야 안드로이드에서 설치된 PWA가 열린다.

export const isKakaoInApp = () => /KAKAOTALK/i.test(navigator.userAgent)

export const isOtherInApp = () =>
  /Instagram|NAVER\(inapp|Line\/|FBAN|FBAV|everytimeApp|DaumApps/i.test(navigator.userAgent)

export const isInAppBrowser = () => isKakaoInApp() || isOtherInApp()

// 카카오 공식 스킴: 인앱 브라우저를 닫고 시스템 기본 브라우저로 URL을 넘긴다.
// 안드로이드는 이때 스코프가 일치하는 설치된 PWA(WebAPK)가 있으면 앱이 바로 열린다.
export const escapeKakaoInApp = (url: string = window.location.href) => {
  markKakaoEscapeAttempted()
  window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
  // 넘긴 뒤 인앱 창은 닫는다 — 안 닫으면 카톡 안에 앱 화면이 하나 더 남아 사용자가 두 군데를 오간다
  window.setTimeout(closeKakaoInApp, 300)
}

/**
 * 카톡 인앱 브라우저 닫기 — 카톡 비공식이지만 널리 쓰이는 스킴(안드로이드·iOS 가 다르다).
 * 안 먹는 환경이면 아무 일도 없이 페이지가 남는다. ★ functions/_lib/shareEntry.js 의 탈출 페이지와 같은 문자열.
 */
export const closeKakaoInApp = () => {
  window.location.href = /ipad|iphone|ipod/i.test(navigator.userAgent)
    ? 'kakaoweb://closeBrowser'
    : 'kakaotalk://inappbrowser/close'
}

/**
 * "이 웹뷰에서 외부 브라우저 탈출을 이미 시도했다" 표식 — sessionStorage 라 인앱 탭 하나에만 남는다.
 * 공유 링크 탈출 페이지(functions/_lib/shareEntry.js)도 같은 키를 먼저 적는다: 거기서 openExternal 을
 * 한 번 부른 뒤 폴백으로 앱을 인앱에 띄우면, main.tsx 가 또 openExternal 을 불러 외부 브라우저가
 * 두 번 열리던 것을 막는다. ★ 키 문자열은 두 곳이 같아야 한다.
 */
const KAKAO_ESCAPE_KEY = 'kakaoEscapeAttempted'

export const markKakaoEscapeAttempted = () => {
  try {
    sessionStorage.setItem(KAKAO_ESCAPE_KEY, '1')
  } catch {
    /* 저장소 막힌 환경 — 표식 없이 진행 */
  }
}

const kakaoEscapeAttempted = () => {
  try {
    return sessionStorage.getItem(KAKAO_ESCAPE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * 앱 부팅 시 자동 탈출 (main.tsx) — 카카오톡 인앱이고 이 웹뷰에서 아직 시도한 적 없을 때만.
 * 초대 랜딩의 "외부 브라우저로 열기" 버튼은 사용자가 누른 것이므로 표식과 무관하게 escapeKakaoInApp 을 그대로 쓴다.
 */
export const autoEscapeKakaoInApp = () => {
  if (!isKakaoInApp() || kakaoEscapeAttempted()) return
  escapeKakaoInApp()
}
