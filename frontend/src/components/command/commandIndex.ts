import type { NavIconKey } from '../layout/NewHeader/components/NavIcons'
import { navEntry } from '../layout/navCatalog'
import { translations, type Translation } from '../../locales'
import {
  Books,
  CalendarDots,
  ChatCircleText,
  Files,
  Flower,
  HandsPraying,
  Hourglass,
  ImageSquare,
  Key,
  PencilLine,
  Plant,
  Sparkle,
  Thermometer,
  UserCircle,
  type Icon,
} from '../icons/phosphor'

// ⌘K 팔레트의 정적 페이지 색인 — 메뉴에 있는 페이지는 layout/navCatalog.ts 의 이름·설명·아이콘을
// 그대로 쓰고(헤더·메가 메뉴와 같은 말), 여기엔 검색 키워드·빠른 이동·회원 전용 같은 팔레트 사정만 적는다.
// 메뉴에 없는 페이지(성경 도구·기도 피드·프로필·로그인…)만 EXTRA_PAGES 에 두 언어를 직접 든다.
// 라우트가 생기면 카탈로그에 한 줄 + 아래 키워드 한 줄. (관리자 페이지는 넣지 않는다 — 관리자 메뉴가 따로 있다)

export interface PageEntry {
  to: string
  label: { ko: string; en: string }
  desc: { ko: string; en: string }
  icon?: NavIconKey
  /** NAV_ICONS 에 없는 항목 — Phosphor duotone 으로 그린다(이모지 금지) */
  glyph?: Icon
  keywords: string[]
  /** 빠른 이동(빈 검색창)에 노출 */
  quick?: boolean
  /** 로그인 교인 전용 — 비로그인 팔레트에선 숨긴다 */
  memberOnly?: boolean
}

type PaletteExtras = Pick<PageEntry, 'keywords' | 'quick' | 'memberOnly' | 'glyph'>

// 카탈로그 경로 → 팔레트 사정. 순서가 팔레트의 기본 노출 순서다(빠른 이동은 quick 만)
const CATALOG_PALETTE: [string, PaletteExtras][] = [
  ['/worship', { keywords: ['예배', '시간', '주일', '새벽', '수요', '금요', 'worship', 'service', 'time'], quick: true }],
  ['/visit', { keywords: ['오시는길', '위치', '주소', '지도', '주차', '상동역', 'directions', 'map', 'parking', 'address'], quick: true }],
  ['/sermon', { keywords: ['설교', '말씀', '다시보기', '영상', 'sermon', 'message', 'replay'], quick: true }],
  ['/bible', { keywords: ['성경', '읽기', '통독', '오디오', '낭독', 'bible', 'read', 'audio'], quick: true }],
  ['/events', { keywords: ['일정', '행사', '캘린더', '달력', '참석', 'events', 'calendar', 'rsvp'], quick: true }],
  ['/about', { keywords: ['소개', '교회', '담임목사', '목사', '비전', 'about', 'pastor', 'church'] }],
  ['/greeting', { keywords: ['인사말', '인사', '담임목사', '목사', '환영', '역대', 'greeting', 'welcome', 'pastor'] }],
  ['/history', { keywords: ['발자취', '역사', '연혁', 'history', 'timeline'] }],
  ['/people', { keywords: ['섬기는사람들', '섬기는', '교역자', '부목사', '전도사', '선교사', '파송', '장로', '직원', '간사', '연락처', 'people', 'staff', 'pastor', 'missionary', 'elder'] }],
  ['/organization', { keywords: ['조직도', '부서', '위원회', '국', 'organization', 'committee'] }],
  ['/education', { keywords: ['교육', '훈련', '주일학교', '청년부', '양육', '제자', 'education', 'training', 'class'] }],
  ['/ministry', { keywords: ['칼럼', '목양', '편지', '목사님', 'column', 'letter'] }],
  ['/news?tab=bulletin', { keywords: ['주보', '순서지', 'bulletin'], glyph: Files }],
  ['/news', { keywords: ['소식', '공지', '뉴스', 'news', 'notice'] }],
  ['/news?tab=new-family', { keywords: ['새가족', '새신자', '등록', '환영', 'newcomer', 'new family'], glyph: Plant }],
  ['/mission', { keywords: ['선교', '선교사', '파송', 'mission', 'missionary'] }],
  ['/culture', { keywords: ['문화교실', '강좌', '수업', '신청', 'culture', 'class'] }],
  ['/seats', { keywords: ['좌석', '자리', '예약', '콘서트', '행사', 'seat', 'booking', 'reserve'] }],
  ['/survey', { keywords: ['설문', '설문조사', '의견', '투표', 'survey', 'poll', 'feedback'] }],
  ['/groups', { keywords: ['모임', '소그룹', '기도방', '구역', 'group', 'room'], memberOnly: true }],
  ['/classes', { keywords: ['알림장', '우리반', '교회학교', '주일학교', 'class', 'notice'], memberOnly: true }],
  ['/garden', { keywords: ['칭호', '뱃지', '업적', 'title', 'badge'], memberOnly: true }],
  ['/bluemarble', { keywords: ['퀘스트', '게임', '퀴즈', '보드', 'quest', 'quiz', 'game'], memberOnly: true }],
  ['/answered-prayers', { keywords: ['응답', '간증', 'answered', 'testimony'] }],
  ['/intercession', { keywords: ['누군가', '중보', '기도짝', '짝꿍', '마니또', 'intercession'] }],
]

// 메뉴에 없는 페이지 — 두 언어를 직접 든다
const EXTRA_PAGES: PageEntry[] = [
  { to: '/bible/plans', label: { ko: '성경 읽기 플랜', en: 'Reading Plans' }, desc: { ko: '365 일독 · 주제별 플랜', en: '365-day & topical plans' }, glyph: CalendarDots, keywords: ['플랜', '일독', '365', '통독', 'plan', 'reading'] },
  { to: '/bible/story', label: { ko: '처음 만나는 성경', en: 'Meeting the Bible' }, desc: { ko: '초보자용 42화 스토리 모드', en: '42-episode story mode for beginners' }, glyph: Books, keywords: ['스토리', '처음', '초보', '입문', 'story', 'beginner'] },
  { to: '/bible/situation', label: { ko: '상황별 성구', en: 'Verses by Situation' }, desc: { ko: '지금 마음에 맞는 말씀', en: 'A verse for how you feel' }, glyph: ChatCircleText, keywords: ['상황', '위로', '불안', '감사', '성구', 'situation', 'comfort', 'anxiety'] },
  { to: '/bible/photo-verse', label: { ko: '말씀 카드 만들기', en: 'Verse Card' }, desc: { ko: '사진 · 필터 · 프레임', en: 'Photo · filter · frame' }, glyph: ImageSquare, keywords: ['말씀카드', '카드', '사진', '이미지', 'card', 'photo'] },
  { to: '/bible/wordbook', label: { ko: '단어장', en: 'Wordbook' }, desc: { ko: '밑줄 친 단어 모음', en: 'Words you underlined' }, glyph: PencilLine, keywords: ['단어장', '단어', 'wordbook'], memberOnly: true },
  { to: '/feed', label: { ko: '기도 커뮤니티', en: 'Prayer Feed' }, desc: { ko: '기도제목 나누고 아멘하기', en: 'Share prayers, say amen' }, glyph: HandsPraying, keywords: ['기도', '커뮤니티', '피드', '아멘', 'prayer', 'feed', 'amen'], quick: true },
  { to: '/thanks', label: { ko: '오늘의 감사', en: 'Daily Thanks' }, desc: { ko: '감사 한 줄 남기기', en: 'One line of thanks' }, glyph: Flower, keywords: ['감사', 'thanks', 'gratitude'], memberOnly: true },
  { to: '/growth', label: { ko: '신앙 여정', en: 'Faith Journey' }, desc: { ko: '타임라인 · 스트릭 · 통계', en: 'Timeline · streaks · stats' }, glyph: Thermometer, keywords: ['여정', '성장', '온도', '스트릭', 'journey', 'growth'], memberOnly: true },
  { to: '/capsule', label: { ko: '타임캡슐', en: 'Time Capsule' }, desc: { ko: '미래의 나에게 봉인 편지', en: 'A sealed letter to future you' }, glyph: Hourglass, keywords: ['타임캡슐', '캡슐', '편지', 'capsule', 'letter'], memberOnly: true },
  { to: '/profile', label: { ko: '내 프로필', en: 'My Profile' }, desc: { ko: '프로필 · 칭호 · 설정', en: 'Profile · titles · settings' }, glyph: UserCircle, keywords: ['프로필', '내정보', '설정', 'profile', 'settings'], memberOnly: true },
  { to: '/login', label: { ko: '로그인', en: 'Log in' }, desc: { ko: '교인 로그인', en: 'Member login' }, glyph: Key, keywords: ['로그인', 'login', 'sign in'] },
  { to: '/register', label: { ko: '처음 오셨나요? 회원가입', en: 'New here? Sign up' }, desc: { ko: '1분이면 끝나요', en: 'Takes a minute' }, glyph: Sparkle, keywords: ['회원가입', '가입', '처음', 'register', 'sign up', 'join'] },
]

// 사전 값 중엔 중첩 객체(카테고리 표)도 있어 문자열만 통과시킨다 — 카탈로그 키는 전부 문자열이다
const word = (dict: Translation, key: keyof Translation): string => {
  const v = dict[key]
  return typeof v === 'string' ? v : String(key)
}

const catalogEntry = (path: string, extras: PaletteExtras): PageEntry => {
  const nav = navEntry(path)
  return {
    to: nav.path,
    // en 사전은 지연 로드 — 오기 전엔 ko 폴백(locales/index.ts). 호출 시점에 읽어야 교체가 반영된다
    label: { ko: word(translations.ko, nav.labelKey), en: word(translations.en, nav.labelKey) },
    desc: { ko: word(translations.ko, nav.descKey), en: word(translations.en, nav.descKey) },
    icon: nav.icon ?? undefined,
    ...extras,
  }
}

// 사전 슬롯(en 로드)이 바뀔 때만 다시 만든다 — 팔레트가 열릴 때마다 33개를 새로 조립할 필요는 없다
let cached: { en: Translation; index: PageEntry[] } | null = null

/** 팔레트 페이지 색인 — 카탈로그 항목(현재 사전) + 팔레트 전용 항목 */
export const getPageIndex = (): PageEntry[] => {
  if (cached && cached.en === translations.en) return cached.index
  const index = [...CATALOG_PALETTE.map(([path, extras]) => catalogEntry(path, extras)), ...EXTRA_PAGES]
  cached = { en: translations.en, index }
  return index
}

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
