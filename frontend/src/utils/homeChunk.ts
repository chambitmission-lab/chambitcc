// 로그인 홈(NewHome) 청크 로더 — App 의 lazy 와 로그인 화면의 선요청이 같은 import() 를 공유해
// 청크를 한 번만 받는다. 비로그인 방문자(랜딩)에겐 홈 피드 코드가 첫 로드에 필요 없어서
// 메인 번들에서 뗐고, 토큰이 있으면 App 모듈 평가 직후 곧바로 받아 폭포수를 없앤다.
export const loadHome = () => import('../pages/Home/NewHome')
