// 인사말 페이지(/greeting) 번역
//
// 목사 개인 정보(이름·인사말 본문·약력)는 여기가 아니라 church_pastors 테이블에 있다.
// 이 파일은 "페이지가 하는 말" — 목사가 바뀌어도 그대로 남는 문구만 담는다.
// 값은 about_content.fields 를 그대로 공유하므로 관리자가 ✏️로 바로 고칠 수 있다.
export const greeting = {
  greetingHeroTitle: '참빛교회 홈페이지를\n방문해주신 모든 분들께',
  greetingHeroSubtitle: '감사의 인사를 드립니다',
  greetingBadge: '인사말',
  greetingProfileTitle: '담임목사 소개',
  greetingCredentialsTitle: '프로필',
  greetingEducationLabel: '학력',
  greetingCareerLabel: '주요 경력',
  greetingAwardLabel: '수상 내역',
  greetingHistoryTitle: '역대 담임목사',
  greetingHistoryHint: '참빛교회를 섬겨오신 분들입니다',
  greetingClosing: '참빛교회는 누구나 환영합니다',
  greetingClosingSub: '처음 오신 분들도 주님의 사랑으로 환영하고 축복합니다',
} as const
