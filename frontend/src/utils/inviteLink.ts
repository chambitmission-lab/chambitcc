// 그룹 초대 링크 — 묵상방과 동일한 해시 라우트 방식.
// GroupModals(모달 UI)에서 떼어내 별도 모듈로 둔다 — 어드민처럼 모달이 필요 없는
// 화면이 이 한 줄을 쓰려고 모달 번들 전체를 끌어오지 않게.
export const groupInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/groups/join/${code}`
