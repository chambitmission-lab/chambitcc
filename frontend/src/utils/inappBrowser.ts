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
  window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
}
