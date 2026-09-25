// 참빛교회 선교 현황 — 명단은 DB(섬기는 사람들), 지리 정보·국내 협력처는 이 파일

export type RegionKey = 'asia' | 'europe' | 'africa' | 'americas'

export interface Missionary {
  country: string          // 파송국
  name: string             // 선교사 이름
  note?: string            // 비고 (예: 주파송 — DB group_ko '파송선교사')
}

// 선교사 명단은 섬기는 사람들(church_people, category=missionary)이 단일 출처다 — 관리자 화면에서
// 추가·수정하면 이 화면과 챗봇 참비에 함께 반영된다(2026-09-25, 이전의 정적 명단은 DB 로 옮김).
// 라우트 로더가 loadMissionRoster()(api/missionRoster.ts)로 명단을 먼저 채운 뒤 화면 청크를 연다.
// 아래 값들은 ES 모듈 live binding 이라 채운 결과가 import 한 쪽에 그대로 보인다.
//
// 이 파일에 남는 것은 지리 정보(대륙·국기·현지 시간·좌표)뿐이다. 새 나라에 선교사를 보내면
// countryCoordinates · countryCode · countryDetail 에 그 나라를 추가해야 지구본·국기·시계가 나온다.

export let allMissionaries: Missionary[] = []

export let missionaryByRegion: Record<RegionKey, Missionary[]> = {
  asia: [],
  europe: [],
  africa: [],
  americas: [],
}

/** 사역지 문자열 → 지리 표의 나라 이름 ("캄보디아 프놈펜" → "캄보디아"). 긴 이름부터 본다 */
export const resolveCountry = (field: string): string | null => {
  const text = field.trim()
  if (countryCoordinates[text]) return text
  const keys = Object.keys(countryCoordinates).sort((a, b) => b.length - a.length)
  return keys.find((k) => text.startsWith(k)) ?? null
}

/** 명단 채우기 — 지리 표에 없는 나라는 총계에는 넣되 대륙 탭·지구본에는 그리지 않는다 */
export const setMissionRoster = (roster: Missionary[]): void => {
  const byRegion: Record<RegionKey, Missionary[]> = { asia: [], europe: [], africa: [], americas: [] }
  const all = roster.map((m) => ({ ...m, country: resolveCountry(m.country) ?? m.country }))
  for (const m of all) {
    const region = countryCoordinates[m.country]?.region
    if (region) byRegion[region].push(m)
    else console.warn(`[mission] 지리 표에 없는 사역지: ${m.country} — missionData.ts 에 추가하세요`)
  }
  allMissionaries = all
  missionaryByRegion = byRegion
  missionStats = {
    ...missionStats,
    total: all.length,
    countries: new Set(all.map((m) => m.country)).size,
  }
}

/** 지역 메타 정보 */
export const regionMeta: Record<RegionKey, {
  label: string
  labelEn: string
  emoji: string
  color: string
  gradient: string
}> = {
  asia: {
    label: '아시아',
    labelEn: 'ASIA',
    emoji: '🌏',
    color: '#3182f6',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
  europe: {
    label: '유럽·중앙아시아',
    labelEn: 'EUROPE · CENTRAL ASIA',
    emoji: '🌍',
    color: '#4a7c59',
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
  },
  africa: {
    label: '아프리카',
    labelEn: 'AFRICA',
    emoji: '🦁',
    color: '#a1621f',
    gradient: 'from-lime-500 via-green-500 to-emerald-600',
  },
  americas: {
    label: '아메리카',
    labelEn: 'AMERICAS',
    emoji: '🌎',
    color: '#7c4fbf',
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
  },
}

/**
 * 국가 → 대륙 분류. 지구본 점·대륙 탭 연동의 기준.
 * 실제 위경도는 countryDetail(lat/lng)에 있다.
 */
export const countryCoordinates: Record<string, { region: RegionKey }> = {
  // 아시아
  '튀르키예': { region: 'asia' },
  '베트남': { region: 'asia' },
  '태국': { region: 'asia' },
  '미얀마': { region: 'asia' },
  '인도네시아': { region: 'asia' },
  '인도': { region: 'asia' },
  '네팔': { region: 'asia' },
  '말레이시아': { region: 'asia' },
  '필리핀': { region: 'asia' },
  '요르단': { region: 'asia' },
  '위구르': { region: 'asia' },
  '일본': { region: 'asia' },
  '중국': { region: 'asia' },
  '캄보디아': { region: 'asia' },

  // 유럽·중앙아시아
  '포르투갈': { region: 'europe' },
  '키르기스스탄': { region: 'europe' },
  '아제르바이잔': { region: 'europe' },
  '독일': { region: 'europe' },
  '코소보': { region: 'europe' },
  '러시아': { region: 'europe' }, // 모스크바 사역 기준
  '러시아 연해주': { region: 'europe' },
  '알바니아': { region: 'europe' },
  '우크라이나': { region: 'europe' },

  // 아프리카
  '잠비아': { region: 'africa' },
  '우간다': { region: 'africa' },
  '남아프리카공화국': { region: 'africa' },
  '모로코': { region: 'africa' },
  '탄자니아': { region: 'africa' },

  // 아메리카
  '파라과이': { region: 'americas' },
  '페루': { region: 'americas' },
}

/**
 * 국가 → ISO 3166-1 alpha-2 코드. 국기는 flagcdn 이미지로 그린다 —
 * 윈도우는 국기 이모지 글리프가 없어 알파벳 두 글자(TH, PE…)로 깨져 보이기 때문.
 * 국기가 애매한 지역(위구르 등)은 코드 없이 두고 이모지 폴백으로 대신한다.
 */
export const countryCode: Record<string, string> = {
  '튀르키예': 'tr',
  '베트남': 'vn',
  '태국': 'th',
  '미얀마': 'mm',
  '인도네시아': 'id',
  '인도': 'in',
  '네팔': 'np',
  '말레이시아': 'my',
  '필리핀': 'ph',
  '요르단': 'jo',
  '일본': 'jp',
  '중국': 'cn',
  '캄보디아': 'kh',
  '포르투갈': 'pt',
  '키르기스스탄': 'kg',
  '아제르바이잔': 'az',
  '독일': 'de',
  '코소보': 'xk',
  '러시아': 'ru',
  '러시아 연해주': 'ru',
  '알바니아': 'al',
  '우크라이나': 'ua',
  '잠비아': 'zm',
  '우간다': 'ug',
  '남아프리카공화국': 'za',
  '모로코': 'ma',
  '탄자니아': 'tz',
  '파라과이': 'py',
  '페루': 'pe',
}

/** 국기 이미지가 없는 지역의 이모지 폴백 (일반 이모지는 윈도우에서도 정상 표시된다) */
export const countryFallbackEmoji: Record<string, string> = {
  '위구르': '🕊️',
}

/** 서울 실좌표 — 거리 계산용 */
export const SEOUL_GEO = { lat: 37.57, lng: 126.98 }

/** 마지막 글자에 받침이 있는지 — 을/를 조사 선택용 */
const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

const strHash = (s: string) => [...s].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)

const KO_PRAYER_TEMPLATES = [
  (c: string, o: string) => `복음의 씨앗이 자라나는 ${c}${o} 위해 기도해주세요.`,
  (c: string, o: string) => `복음의 빛이 더 밝게 비추도록 ${c}${o} 위해 기도해주세요.`,
  (c: string, o: string) => `하나님의 사랑이 흐르는 ${c}${o} 위해 기도해주세요.`,
  (c: string, o: string) => `복음의 문이 활짝 열리도록 ${c}${o} 위해 기도해주세요.`,
]

const EN_PRAYER_TEMPLATES = [
  (c: string) => `Pray for ${c}, where seeds of the gospel are growing.`,
  (c: string) => `Pray that the light of the gospel shines brighter in ${c}.`,
  (c: string) => `Pray for God's love to keep flowing through ${c}.`,
  (c: string) => `Pray for doors of the gospel to open wide in ${c}.`,
]

/** 국가별 기도 문장 — 국가명 해시로 문구를 고정 로테이션 (을/를 자동 처리) */
export const countryPrayerLine = (country: string, lang: 'ko' | 'en') => {
  const idx = strHash(country) % KO_PRAYER_TEMPLATES.length
  if (lang === 'ko') return KO_PRAYER_TEMPLATES[idx](country, hasBatchim(country) ? '을' : '를')
  return EN_PRAYER_TEMPLATES[idx](country)
}

/** 아바타 링·배경 컬러 — 이름 해시로 고정 배정 */
const AVATAR_COLORS = ['#3182f6', '#7c4fbf', '#a1503c', '#b45309', '#0f766e', '#4a7c59']
export const avatarColor = (name: string) =>
  AVATAR_COLORS[strHash(name) % AVATAR_COLORS.length]

/**
 * 국가 → 상세 정보(타임존·대표 도시·실좌표).
 * 바텀시트의 "지금 그곳은" 현지 시간·시차·거리 계산에 쓰인다.
 * 도시는 수도 또는 대표 사역 도시 기준의 근사값.
 */
export interface CountryDetail {
  tz: string
  city: string
  cityEn: string
  lat: number
  lng: number
}

export const countryDetail: Record<string, CountryDetail> = {
  '튀르키예': { tz: 'Europe/Istanbul', city: '앙카라', cityEn: 'Ankara', lat: 39.93, lng: 32.86 },
  '베트남': { tz: 'Asia/Ho_Chi_Minh', city: '하노이', cityEn: 'Hanoi', lat: 21.03, lng: 105.85 },
  '태국': { tz: 'Asia/Bangkok', city: '방콕', cityEn: 'Bangkok', lat: 13.76, lng: 100.5 },
  '미얀마': { tz: 'Asia/Yangon', city: '양곤', cityEn: 'Yangon', lat: 16.87, lng: 96.2 },
  '인도네시아': { tz: 'Asia/Jakarta', city: '자카르타', cityEn: 'Jakarta', lat: -6.21, lng: 106.85 },
  '인도': { tz: 'Asia/Kolkata', city: '델리', cityEn: 'Delhi', lat: 28.61, lng: 77.21 },
  '네팔': { tz: 'Asia/Kathmandu', city: '카트만두', cityEn: 'Kathmandu', lat: 27.72, lng: 85.32 },
  '말레이시아': { tz: 'Asia/Kuala_Lumpur', city: '쿠알라룸푸르', cityEn: 'Kuala Lumpur', lat: 3.14, lng: 101.69 },
  '필리핀': { tz: 'Asia/Manila', city: '마닐라', cityEn: 'Manila', lat: 14.6, lng: 120.98 },
  '요르단': { tz: 'Asia/Amman', city: '암만', cityEn: 'Amman', lat: 31.95, lng: 35.93 },
  '위구르': { tz: 'Asia/Urumqi', city: '우루무치', cityEn: 'Urumqi', lat: 43.83, lng: 87.62 },
  '일본': { tz: 'Asia/Tokyo', city: '도쿄', cityEn: 'Tokyo', lat: 35.68, lng: 139.69 },
  '중국': { tz: 'Asia/Shanghai', city: '베이징', cityEn: 'Beijing', lat: 39.9, lng: 116.4 },
  '캄보디아': { tz: 'Asia/Phnom_Penh', city: '프놈펜', cityEn: 'Phnom Penh', lat: 11.56, lng: 104.92 },
  '포르투갈': { tz: 'Europe/Lisbon', city: '리스본', cityEn: 'Lisbon', lat: 38.72, lng: -9.14 },
  '키르기스스탄': { tz: 'Asia/Bishkek', city: '비슈케크', cityEn: 'Bishkek', lat: 42.87, lng: 74.59 },
  '아제르바이잔': { tz: 'Asia/Baku', city: '바쿠', cityEn: 'Baku', lat: 40.41, lng: 49.87 },
  '독일': { tz: 'Europe/Berlin', city: '베를린', cityEn: 'Berlin', lat: 52.52, lng: 13.4 },
  '코소보': { tz: 'Europe/Belgrade', city: '프리슈티나', cityEn: 'Pristina', lat: 42.66, lng: 21.17 },
  '러시아': { tz: 'Europe/Moscow', city: '모스크바', cityEn: 'Moscow', lat: 55.76, lng: 37.62 },
  '러시아 연해주': { tz: 'Asia/Vladivostok', city: '블라디보스토크', cityEn: 'Vladivostok', lat: 43.12, lng: 131.89 },
  '알바니아': { tz: 'Europe/Tirane', city: '티라나', cityEn: 'Tirana', lat: 41.33, lng: 19.82 },
  '우크라이나': { tz: 'Europe/Kiev', city: '키이우', cityEn: 'Kyiv', lat: 50.45, lng: 30.52 },
  '잠비아': { tz: 'Africa/Lusaka', city: '루사카', cityEn: 'Lusaka', lat: -15.39, lng: 28.32 },
  '우간다': { tz: 'Africa/Kampala', city: '캄팔라', cityEn: 'Kampala', lat: 0.35, lng: 32.58 },
  '남아프리카공화국': { tz: 'Africa/Johannesburg', city: '요하네스버그', cityEn: 'Johannesburg', lat: -26.2, lng: 28.05 },
  '모로코': { tz: 'Africa/Casablanca', city: '라바트', cityEn: 'Rabat', lat: 34.02, lng: -6.84 },
  '탄자니아': { tz: 'Africa/Dar_es_Salaam', city: '다르에스살람', cityEn: 'Dar es Salaam', lat: -6.79, lng: 39.21 },
  '파라과이': { tz: 'America/Asuncion', city: '아순시온', cityEn: 'Asunción', lat: -25.28, lng: -57.63 },
  '페루': { tz: 'America/Lima', city: '리마', cityEn: 'Lima', lat: -12.05, lng: -77.04 },
}

/** 국내 선교 — 미자립 교회 지원 */
export const domesticChurches: string[] = [
  '가좌우교회',
  '나주우원교회',
  '낙서교회',
  '알음으로나는교회',
  '명리교회',
  '문경부천교회',
  '산양교회',
  '양정교회',
  '원주금굴교회',
  '전북예빌약암교회',
  '주은총함양교회',
  '진명복원교회',
  '찬전주안교회',
  '해동교회',
  '평양교회',
  '양칠교회',
  '하나님교회',
  '예수네브교회',
]

/** 국내 선교 — 협력 기관 */
export const domesticOrganizations: string[] = [
  '기독교산업사회연구소(원)',
  '(사)지구촌 선교회',
  '코람데오당회',
  '한국기독신문',
]

/** 선교 통계 — total·countries 는 setMissionRoster 가 명단으로 채운다 */
export let missionStats = {
  total: 0,
  countries: 0,
  regions: 4,
  domesticPartners: domesticChurches.length + domesticOrganizations.length,
}
