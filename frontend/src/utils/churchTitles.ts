// 직분 목록 — 백엔드 app/models/pastoral.py 의 CHURCH_TITLES / CLERGY_TITLES 와 짝.
// 관리자 회원관리와 성도 명부가 같은 pill 을 보여 주고, 값은 member_profiles.church_title 한 곳에 저장된다.
export const CHURCH_TITLES = [
  '담임목사', '원로목사', '부목사', '강도사', '전도사',
  '장로', '권사', '안수집사', '서리집사', '성도',
] as const

/** 이 직분으로 지정하면 서버가 목회자 권한(is_pastor)을 함께 켠다 */
export const CLERGY_TITLES: readonly string[] = ['담임목사', '부목사', '강도사', '전도사']
