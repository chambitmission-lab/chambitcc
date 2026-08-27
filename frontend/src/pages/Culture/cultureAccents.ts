// 문화교실 강좌 액센트 — 강좌 제목 키워드로 아이콘·파스텔 컬러를 자동 매핑
// DB에 이미지가 없으므로 제목만으로 강좌마다 "얼굴"을 만들어 준다.
// 아이콘은 이모지 대신 직접 그린 선화(CultureIcons) — 카드 액센트 컬러를 그대로 따른다.
// 컬러는 Tailwind JIT가 동적 클래스를 생성하지 못하므로 인라인 스타일용 hex로 관리.
import type { ReactElement, SVGProps } from 'react'
import {
  PaletteIcon,
  BrushIcon,
  BreadIcon,
  CoffeeIcon,
  MusicIcon,
  YogaIcon,
  YarnIcon,
  FlowerIcon,
  BooksIcon,
  CameraIcon,
  TulipIcon,
  SnowIcon,
  BlossomIcon,
  SunflowerIcon,
  LeafIcon,
} from './CultureIcons'

export type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement

export interface CultureAccent {
  Icon: IconComponent
  /** 라이트·다크 양쪽에서 읽히는 중간 채도 컬러 */
  color: string
}

const ACCENTS: { keywords: string[]; accent: CultureAccent }[] = [
  {
    keywords: ['수채화', '그림', '미술', '드로잉', '스케치', '유화', '아크릴', '민화'],
    accent: { Icon: PaletteIcon, color: '#8b7cf6' },
  },
  {
    keywords: ['캘리', '서예', '붓글씨', '손글씨', 'POP'],
    accent: { Icon: BrushIcon, color: '#e8875f' },
  },
  {
    keywords: ['요리', '베이킹', '제과', '제빵', '쿠킹', '반찬', '떡'],
    accent: { Icon: BreadIcon, color: '#d99c2b' },
  },
  {
    keywords: ['커피', '바리스타', '차', '티', '다도'],
    accent: { Icon: CoffeeIcon, color: '#b08050' },
  },
  {
    keywords: ['피아노', '악기', '기타', '우쿨렐레', '통기타', '오카리나', '드럼', '바이올린', '플루트', '하모니카', '찬양', '성가', '노래', '합창', '음악'],
    accent: { Icon: MusicIcon, color: '#38a8f8' },
  },
  {
    keywords: ['요가', '필라테스', '운동', '체조', '댄스', '라인댄스', '스트레칭', '탁구', '배드민턴', '걷기', '에어로빅', '헬스'],
    accent: { Icon: YogaIcon, color: '#10b981' },
  },
  {
    keywords: ['공예', '뜨개', '자수', '리본', '비즈', '만들기', '목공', '가죽', '도자기', '종이접기', '퀼트'],
    accent: { Icon: YarnIcon, color: '#ec6aa8' },
  },
  {
    keywords: ['꽃꽂이', '플라워', '원예', '가드닝', '화분', '식물'],
    accent: { Icon: FlowerIcon, color: '#fb7185' },
  },
  {
    keywords: ['영어', '중국어', '일본어', '한글', '어학', '회화', '한자', '독서', '글쓰기', '인문학', '성경'],
    accent: { Icon: BooksIcon, color: '#818cf8' },
  },
  {
    keywords: ['사진', '스마트폰', '컴퓨터', '미디어', '영상', '유튜브', 'SNS', '키오스크'],
    accent: { Icon: CameraIcon, color: '#2eb8a6' },
  },
]

const DEFAULT_ACCENT: CultureAccent = { Icon: TulipIcon, color: '#6d8df0' }

export const getCultureAccent = (title: string): CultureAccent => {
  const found = ACCENTS.find(({ keywords }) =>
    keywords.some((k) => title.toLowerCase().includes(k.toLowerCase()))
  )
  return found ? found.accent : DEFAULT_ACCENT
}

/** #rrggbb → rgba(r,g,b,a) — 파스텔 틴트·게이지 트랙 등 인라인 스타일용 */
export const withAlpha = (hex: string, alpha: number): string => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const DAY_ORDER = '월화수목금토일'

/**
 * 일정 문자열에서 요일만 추출한다.
 * "매주 화요일 오전 10시" → ['화'], "월·수·금 저녁" → ['월','수','금']
 * "10월 5일" 같은 날짜의 월·일은 요일로 오인하지 않도록 앞 글자가 숫자면 제외.
 */
export const parseScheduleDays = (schedule?: string | null): string[] => {
  if (!schedule) return []
  const days: string[] = []
  const re = /[월화수목금토일]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(schedule))) {
    const ch = m[0]
    const prev = m.index > 0 ? schedule[m.index - 1] : ''
    const rest = schedule.slice(m.index + 1)
    const before = schedule.slice(0, m.index)
    const isDay =
      rest.startsWith('요일') ||
      /^\s*[·,/]\s*[월화수목금토일]/.test(rest) ||
      (/[·,/]\s*$/.test(before) && days.length > 0)
    if (isDay && !/\d/.test(prev) && !days.includes(ch)) days.push(ch)
  }
  return days.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
}

/** "2026년 4분기" → 계절 아이콘 (모집 배너용) */
export const quarterIcon = (quarter?: string | null): IconComponent => {
  const m = quarter?.match(/([1-4])\s*분기/)
  if (!m) return TulipIcon
  return (
    { '1': SnowIcon, '2': BlossomIcon, '3': SunflowerIcon, '4': LeafIcon }[m[1]] ?? TulipIcon
  )
}
