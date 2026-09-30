// 그룹 초대 링크 — 묵상방과 동일한 해시 라우트 방식.
// GroupModals(모달 UI)에서 떼어내 별도 모듈로 둔다 — 어드민처럼 모달이 필요 없는
// 화면이 이 한 줄을 쓰려고 모달 번들 전체를 끌어오지 않게.
export const groupInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/groups/join/${code}`

// 우리반 알림장 초대 링크
export const classInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/classes/join/${code}`

// 선거 투표 링크 — 현장 QR 용. 비밀 토큰 없이 선거 주소만 담는다:
// 투표 자격은 로그인한 계정이 선거인 명부에 있는지로 서버가 가른다.
export const electionVoteUrl = (electionId: number) =>
  `${window.location.origin}${window.location.pathname}#/elections/${electionId}`
