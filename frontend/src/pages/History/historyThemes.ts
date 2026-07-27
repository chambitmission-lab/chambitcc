// 참빛 발자취 — '테마별' 렌즈용 자동 분류.
//
// 643건의 기록에 태그 필드를 손으로 붙이는 대신, 원문 키워드 규칙으로 런타임에 분류한다.
// historyData.ts에 기록이 추가돼도 자동으로 분류되고, 데이터 파일은 원문 그대로 유지된다.
//
// RULES는 "먼저 매칭되는 것이 이긴다". 순서가 곧 우선순위이므로 바꿀 때 주의할 것.
// (예: 「새 성전 입당예배」는 '예배'가 아니라 '성전과 터전'이어야 하므로 sanctuary가 위에 있다.)

import { HISTORY_EVENTS, decadeOf } from './historyData'
import type { HistoryEvent } from './historyData'

export type ThemeKey =
  | 'people'
  | 'sanctuary'
  | 'nextgen'
  | 'culture'
  | 'mission'
  | 'outreach'
  | 'worship'
  | 'life'

export interface ThemeMeta {
  key: ThemeKey
  icon: string
  label: string
  copy: string
}

export const THEMES: ThemeMeta[] = [
  {
    key: 'people',
    icon: '🤝',
    label: '세움과 섬김',
    copy: '목회자를 청빙하고 직분자를 세운 기록. 교회의 뼈대가 놓인 순간들입니다.',
  },
  {
    key: 'sanctuary',
    icon: '🏗️',
    label: '성전과 터전',
    copy: '거실에서 심곡동으로, 중동에서 상동으로. 예배할 자리를 찾아온 여정입니다.',
  },
  {
    key: 'mission',
    icon: '🌍',
    label: '선교와 나눔',
    copy: '파송과 단기선교, 바자회와 장학금. 담장 밖으로 흘러간 기록입니다.',
  },
  {
    key: 'outreach',
    icon: '📣',
    label: '전도와 부흥',
    copy: '새생명 전도축제와 부흥회, 간증집회. 한 영혼을 향해 달려간 시간입니다.',
  },
  {
    key: 'worship',
    icon: '🙏',
    label: '예배와 양육',
    copy: '예배의 자리를 늘리고 말씀을 가르친 기록. 교회의 호흡에 해당합니다.',
  },
  {
    key: 'culture',
    icon: '🎶',
    label: '축제와 문화',
    copy: '음악회와 찬양제, 체육대회와 기념 축제. 함께 웃고 노래한 날들입니다.',
  },
  {
    key: 'nextgen',
    icon: '🌱',
    label: '다음세대',
    copy: '주일학교부터 청년부까지. 뒤이어 걸어올 세대를 위한 기록입니다.',
  },
  {
    key: 'life',
    icon: '🕊️',
    label: '교회의 일상',
    copy: '어느 갈래에도 넣기 어려운, 그러나 교회를 이루어온 보통의 날들.',
  },
]

// 우선순위 순. 앞선 규칙이 이기므로 '더 구체적인 것'을 위에 둔다.
const RULES: Array<[ThemeKey, RegExp]> = [
  // 교회의 정체성을 규정하는 사건(창립·청빙·위임·분립)은 무조건 여기로 온다.
  [
    'people',
    /창립예배|설립예배|개척을 결의|개척의 뜻|분립하|원로목사|위임식|위임 ?감사|담임목사로 (부임|청빙|추대)|제\d대 담임|담임목사 (청빙|위임|은퇴|부임)/,
  ],
  // 북한·평양 관련은 '헌당'이 들어가도 선교로 본다 (봉수교회 헌당예배 등).
  ['mission', /평양|봉수교회|탈북|북한 ?선교/],
  [
    'sanctuary',
    /건축|기공|입당|헌당|봉헌|성전|예배당|교회당|종탑|교육관|본당|대지|부지|매입|구입|전세|확장 공사|증축|리모델링|이전하다|이전되다|\d+평|현판|교회 이름|교회명|주차장|엘리베이터|음향|영상 ?시설|보수 ?공사/,
  ],
  [
    'nextgen',
    /주일학교|교회학교|교육부서|유치부|영아부|유년부|초등부|초등\d부|중등부|중고등|고등부|청소년|1318|청년|대학부|SFC|학생회|여름 ?성경학교|겨울 ?성경학교|어린이|다음 ?세대|아동|영·?유아|키즈|유스/,
  ],
  [
    'culture',
    /음악회|연주회|독주회|독창회|공연|찬양제|합창|콘서트|뮤지컬|전시회|체육대회|성가의 밤|성가|앙상블|친목|야외 ?예배|문화 ?축제|문화 ?공연|중창단|피아노|바이올린|오르간|색소폰|경연|축하 ?공연|송년/,
  ],
  [
    'mission',
    /선교|파송|비전 ?트립|단기 ?선교|성지 ?순례|바자회|의료|봉사|헌혈|장기 ?기증|구제|후원|장학|기아 ?대책|이주 ?노동자|난민|조선족|김장|연탄|나눔|사랑의 집|기부/,
  ],
  // '전도사'는 인사 기록이므로 전도와 부흥에서 제외한다.
  ['outreach', /전도(?!사)|새생명|부흥회|사경회|심령|간증|초청 ?집회|생명 ?운동|노방|축호|총동원/],
  [
    'people',
    /임직|장립|취임|피택|지명 ?투표|은퇴|부임|사임|청빙|안수|위임|임명|추대|노회|공동의회|제직|중직자|청지기|당회|협동장로|강도사|분립|개척|교역자/,
  ],
  [
    'worship',
    /예배|부흥|기도|성찬|집회|세미나|수련회|제자|성서|훈련|양육|큐티|묵상|새벽|구역|성경 ?공부|공부반|강좌|특강|상담|찬양|헌금|작정|주보|홈페이지|앱|온라인|방송|회지|캠페인|사역|모임|신설|개설|발족|창간/,
  ],
]

export const themeOf = (event: HistoryEvent): ThemeKey => {
  const haystack = `${event.title ?? ''} ${event.text}`
  for (const [key, re] of RULES) if (re.test(haystack)) return key
  return 'life'
}

export const yearOf = (event: HistoryEvent) => Number(event.d.slice(0, 4))

export interface IndexedEvent {
  event: HistoryEvent
  index: number
  year: number
  decade: string
  theme: ThemeKey
}

/** 원본 순서를 유지한 채 연도·연대·테마를 한 번만 계산해 둔다. */
export const INDEXED_EVENTS: IndexedEvent[] = HISTORY_EVENTS.map((event, index) => {
  const year = yearOf(event)
  return { event, index, year, decade: decadeOf(year), theme: themeOf(event) }
})

export const MILESTONES = INDEXED_EVENTS.filter((e) => Boolean(e.event.icon))

export const FIRST_YEAR = INDEXED_EVENTS[0].year
export const LAST_YEAR = INDEXED_EVENTS[INDEXED_EVENTS.length - 1].year

export interface YearBar {
  year: number
  count: number
  milestones: number
  decade: string
}

/** 미니맵용 — 기록이 하나도 없는 해도 빈 막대로 자리를 지킨다. */
export const YEAR_BARS: YearBar[] = (() => {
  const bars = new Map<number, YearBar>()
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y += 1) {
    bars.set(y, { year: y, count: 0, milestones: 0, decade: decadeOf(y) })
  }
  INDEXED_EVENTS.forEach((e) => {
    const bar = bars.get(e.year)
    if (!bar) return
    bar.count += 1
    if (e.event.icon) bar.milestones += 1
  })
  return [...bars.values()]
})()

export const MAX_YEAR_COUNT = Math.max(...YEAR_BARS.map((b) => b.count))

export interface ThemeStat extends ThemeMeta {
  count: number
  /** 연대별 기록 수 — 카드의 미니 스팬 바에 쓴다. */
  byDecade: Record<string, number>
  peakDecade: string
  milestoneIcons: string[]
}

export const THEME_STATS: ThemeStat[] = THEMES.map((meta) => {
  const own = INDEXED_EVENTS.filter((e) => e.theme === meta.key)
  const byDecade: Record<string, number> = {}
  own.forEach((e) => {
    byDecade[e.decade] = (byDecade[e.decade] ?? 0) + 1
  })
  const peakDecade =
    Object.entries(byDecade).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '1990s'
  return {
    ...meta,
    count: own.length,
    byDecade,
    peakDecade,
    milestoneIcons: own
      .filter((e) => e.event.icon)
      .slice(0, 3)
      .map((e) => e.event.icon as string),
  }
}).sort((a, b) => b.count - a.count)
