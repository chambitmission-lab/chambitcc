import type { NavIconKey } from '../layout/NewHeader/components/NavIcons'

// ⌘K 팔레트의 정적 페이지 색인 — 라벨·설명은 두 언어를 직접 들고, 검색은 라벨+설명+키워드 전부를 본다.
// 라우트가 생기면 여기에 한 줄 추가. (관리자 페이지는 넣지 않는다 — 관리자 메뉴가 따로 있다)

export interface PageEntry {
  to: string
  label: { ko: string; en: string }
  desc: { ko: string; en: string }
  icon?: NavIconKey
  emoji?: string // NAV_ICONS 에 없는 항목의 대체 표식
  keywords: string[]
  /** 빠른 이동(빈 검색창)에 노출 */
  quick?: boolean
  /** 로그인 교인 전용 — 비로그인 팔레트에선 숨긴다 */
  memberOnly?: boolean
}

export const PAGE_INDEX: PageEntry[] = [
  { to: '/worship', label: { ko: '예배 안내', en: 'Worship' }, desc: { ko: '주일 7:30 · 9:20 · 11:20 · 1:30', en: 'Sunday service times' }, icon: 'worship', keywords: ['예배', '시간', '주일', '새벽', '수요', '금요', 'worship', 'service', 'time'], quick: true },
  { to: '/visit', label: { ko: '오시는 길', en: 'Directions' }, desc: { ko: '7호선 상동역 · 주차 안내', en: 'Sangdong Stn. · parking' }, icon: 'visit', keywords: ['오시는길', '위치', '주소', '지도', '주차', '상동역', 'directions', 'map', 'parking', 'address'], quick: true },
  { to: '/sermon', label: { ko: '설교', en: 'Sermons' }, desc: { ko: '주일 1~4부 설교 다시보기', en: 'Replay every Sunday sermon' }, icon: 'sermon', keywords: ['설교', '말씀', '다시보기', '영상', 'sermon', 'message', 'replay'], quick: true },
  { to: '/bible', label: { ko: '성경', en: 'Bible' }, desc: { ko: '읽기 · 통독표 · 오디오북', en: 'Read · stamp chart · audiobook' }, icon: 'bible', keywords: ['성경', '읽기', '통독', '오디오', '낭독', 'bible', 'read', 'audio'], quick: true },
  { to: '/events', label: { ko: '일정', en: 'Events' }, desc: { ko: '교회 캘린더 · 참석 신청', en: 'Church calendar · RSVP' }, icon: 'events', keywords: ['일정', '행사', '캘린더', '달력', '참석', 'events', 'calendar', 'rsvp'], quick: true },
  { to: '/about', label: { ko: '교회 소개', en: 'About' }, desc: { ko: '참빛교회 이야기와 담임목사', en: 'Our story and senior pastor' }, icon: 'about', keywords: ['소개', '교회', '담임목사', '목사', '비전', 'about', 'pastor', 'church'] },
  { to: '/greeting', label: { ko: '인사말', en: 'Greeting' }, desc: { ko: '담임목사가 전하는 환영 인사', en: 'A welcome from our senior pastor' }, icon: 'greeting', keywords: ['인사말', '인사', '담임목사', '목사', '환영', '역대', 'greeting', 'welcome', 'pastor'] },
  { to: '/history', label: { ko: '발자취', en: 'History' }, desc: { ko: '걸어온 길, 주요 순간들', en: 'Milestones along the way' }, icon: 'history', keywords: ['발자취', '역사', '연혁', 'history', 'timeline'] },
  { to: '/organization', label: { ko: '조직도', en: 'Organization' }, desc: { ko: '섬기는 분들과 부서', en: 'Who serves, and where' }, icon: 'organization', keywords: ['조직도', '부서', '장로', '교역자', '섬김', 'organization', 'staff'] },
  { to: '/ministry', label: { ko: '목양칼럼', en: 'Pastoral Column' }, desc: { ko: '담임목사의 주간 편지', en: "The pastor's weekly letter" }, icon: 'ministry', keywords: ['칼럼', '목양', '편지', '목사님', 'column', 'letter'] },
  { to: '/news?tab=bulletin', label: { ko: '주보', en: 'Bulletin' }, desc: { ko: '이번 주 주보 보기', en: "This week's bulletin" }, emoji: '📄', keywords: ['주보', '순서지', 'bulletin'] },
  { to: '/news', label: { ko: '교회 소식', en: 'News' }, desc: { ko: '소식과 공지', en: 'News and announcements' }, icon: 'news', keywords: ['소식', '공지', '뉴스', 'news', 'notice'] },
  { to: '/news?tab=new-family', label: { ko: '새가족 앨범', en: 'Newcomers' }, desc: { ko: '새로 오신 분들을 환영해요', en: 'Welcoming those who just arrived' }, emoji: '🌱', keywords: ['새가족', '새신자', '등록', '환영', 'newcomer', 'new family'] },
  { to: '/mission', label: { ko: '선교', en: 'Mission' }, desc: { ko: '파송 선교사와 기도', en: 'Missionaries we send and pray for' }, emoji: '🌍', keywords: ['선교', '선교사', '파송', 'mission', 'missionary'] },
  { to: '/culture', label: { ko: '문화교실', en: 'Culture Classes' }, desc: { ko: '강좌 안내 · 신청', en: 'Classes · sign up' }, icon: 'culture', keywords: ['문화교실', '강좌', '수업', '신청', 'culture', 'class'] },
  { to: '/bible/plans', label: { ko: '성경 읽기 플랜', en: 'Reading Plans' }, desc: { ko: '365 일독 · 주제별 플랜', en: '365-day & topical plans' }, emoji: '🗓️', keywords: ['플랜', '일독', '365', '통독', 'plan', 'reading'] },
  { to: '/bible/story', label: { ko: '처음 만나는 성경', en: 'Meeting the Bible' }, desc: { ko: '초보자용 42화 스토리 모드', en: '42-episode story mode for beginners' }, emoji: '📚', keywords: ['스토리', '처음', '초보', '입문', 'story', 'beginner'] },
  { to: '/bible/situation', label: { ko: '상황별 성구', en: 'Verses by Situation' }, desc: { ko: '지금 마음에 맞는 말씀', en: 'A verse for how you feel' }, emoji: '💬', keywords: ['상황', '위로', '불안', '감사', '성구', 'situation', 'comfort', 'anxiety'] },
  { to: '/bible/photo-verse', label: { ko: '말씀 카드 만들기', en: 'Verse Card' }, desc: { ko: '사진 · 필터 · 프레임', en: 'Photo · filter · frame' }, emoji: '🖼️', keywords: ['말씀카드', '카드', '사진', '이미지', 'card', 'photo'] },
  { to: '/bible/wordbook', label: { ko: '단어장', en: 'Wordbook' }, desc: { ko: '밑줄 친 단어 모음', en: 'Words you underlined' }, emoji: '✏️', keywords: ['단어장', '단어', 'wordbook'], memberOnly: true },
  { to: '/feed', label: { ko: '기도 커뮤니티', en: 'Prayer Feed' }, desc: { ko: '기도제목 나누고 아멘하기', en: 'Share prayers, say amen' }, emoji: '🙏', keywords: ['기도', '커뮤니티', '피드', '아멘', 'prayer', 'feed', 'amen'], quick: true },
  { to: '/thanks', label: { ko: '오늘의 감사', en: 'Daily Thanks' }, desc: { ko: '감사 한 줄 남기기', en: 'One line of thanks' }, emoji: '🌼', keywords: ['감사', 'thanks', 'gratitude'], memberOnly: true },
  { to: '/groups', label: { ko: '모임', en: 'Groups' }, desc: { ko: '소그룹 · 기도방', en: 'Small groups · prayer rooms' }, icon: 'myGroups', keywords: ['모임', '소그룹', '기도방', '구역', 'group', 'room'], memberOnly: true },
  { to: '/classes', label: { ko: '우리반 알림장', en: 'Class Notices' }, desc: { ko: '부서 공지 · 출석 · 앨범', en: 'Dept. notices · attendance · album' }, icon: 'classNote', keywords: ['알림장', '우리반', '교회학교', '주일학교', 'class', 'notice'], memberOnly: true },
  { to: '/growth', label: { ko: '신앙 여정', en: 'Faith Journey' }, desc: { ko: '타임라인 · 스트릭 · 통계', en: 'Timeline · streaks · stats' }, emoji: '🌡️', keywords: ['여정', '성장', '온도', '스트릭', 'journey', 'growth'], memberOnly: true },
  { to: '/garden', label: { ko: '성경 칭호', en: 'Bible Titles' }, desc: { ko: '모은 칭호와 커버', en: 'Titles you earned' }, icon: 'garden', keywords: ['칭호', '뱃지', '업적', 'title', 'badge'], memberOnly: true },
  { to: '/bluemarble', label: { ko: '바이블 퀘스트', en: 'Bible Quest' }, desc: { ko: '성경 보드게임 · 퀴즈', en: 'Bible board game · quiz' }, icon: 'bluemarble', keywords: ['퀘스트', '게임', '퀴즈', '보드', 'quest', 'quiz', 'game'], memberOnly: true },
  { to: '/answered-prayers', label: { ko: '응답의 전당', en: 'Answered Prayers' }, desc: { ko: '응답받은 기도의 기록', en: 'Testimonies of answered prayer' }, icon: 'answeredPrayers', keywords: ['응답', '간증', 'answered', 'testimony'] },
  { to: '/capsule', label: { ko: '타임캡슐', en: 'Time Capsule' }, desc: { ko: '미래의 나에게 봉인 편지', en: 'A sealed letter to future you' }, emoji: '⏳', keywords: ['타임캡슐', '캡슐', '편지', 'capsule', 'letter'], memberOnly: true },
  { to: '/profile', label: { ko: '내 프로필', en: 'My Profile' }, desc: { ko: '프로필 · 칭호 · 설정', en: 'Profile · titles · settings' }, emoji: '👤', keywords: ['프로필', '내정보', '설정', 'profile', 'settings'], memberOnly: true },
  { to: '/login', label: { ko: '로그인', en: 'Log in' }, desc: { ko: '교인 로그인', en: 'Member login' }, emoji: '🔑', keywords: ['로그인', 'login', 'sign in'] },
  { to: '/register', label: { ko: '처음 오셨나요? 회원가입', en: 'New here? Sign up' }, desc: { ko: '1분이면 끝나요', en: 'Takes a minute' }, emoji: '✨', keywords: ['회원가입', '가입', '처음', 'register', 'sign up', 'join'] },
]

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')

/** 라벨·설명·키워드에 질의가 부분 포함되면 점수 — 라벨 접두 일치 > 라벨 포함 > 키워드 > 설명 */
export const scorePage = (entry: PageEntry, query: string): number => {
  const q = norm(query)
  if (!q) return 0
  const labels = [entry.label.ko, entry.label.en].map(norm)
  if (labels.some((l) => l.startsWith(q))) return 100
  if (labels.some((l) => l.includes(q))) return 80
  if (entry.keywords.some((k) => norm(k).includes(q) || q.includes(norm(k)))) return 60
  const descs = [entry.desc.ko, entry.desc.en].map(norm)
  if (descs.some((d) => d.includes(q))) return 40
  return 0
}
