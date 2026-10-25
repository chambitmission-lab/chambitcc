// 미리보기 카드가 뜨는 공유 링크(/b/ 말씀·/w/ 주보·/c/ 목양칼럼)의 정식 도메인.
//
// 어느 호스트에서 보든(미리보기 배포 등) 이 도메인으로 보낸다 — /b/*·/w/*·/c/* 를 백엔드
// OG 라우트로 넘기는 Pages Function 이 여기에만 걸려 있고, 받는 사람에게도 교회
// 주소가 찍히는 편이 낫다.
export const SHARE_ORIGIN = 'https://chambitcc.kro.kr'

/** 로컬 개발에는 /b/*·/w/*·/c/* 프록시가 없다 — 그때만 해시 딥링크로 폴백한다 */
export const isLocalHost = () =>
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
