/**
 * 앱 사용자 검색 결과 한 줄 — 초대·담기 인풋(MemberSearchInput)이 그리는 최소 폭.
 * 캡슐 받는 분(CapsuleRecipient), 반 멤버 추가, 기도방·릴레이·동행 초대가 모두 이 모양을 쓴다.
 */
export interface MemberHit {
  id: number
  display_name: string
  username: string
  avatar_url: string | null
}
