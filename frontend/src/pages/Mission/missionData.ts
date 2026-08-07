// 참빛교회 선교 현황 데이터
// 이미지 자료 기준으로 작성되었습니다.

export type RegionKey = 'asia' | 'europe' | 'africa' | 'americas'

export interface Missionary {
  country: string          // 파송국
  name: string             // 선교사 이름
  note?: string            // 비고 (예: 주파송)
}

export interface CountryInfo {
  name: string
  /** SVG viewBox(0 0 1000 500) 상 대략적 좌표 */
  x: number
  y: number
  region: RegionKey
}

/** 아시아 지역 선교사 */
export const asiaMissionaries: Missionary[] = [
  { country: '튀르키예', name: '곽성' },
  { country: '베트남', name: '김삼성' },
  { country: '태국', name: '김원희' },
  { country: '미얀마', name: '김 인', note: '주파송' },
  { country: '태국', name: '김주만' },
  { country: '태국', name: '김지영' },
  { country: '인도네시아', name: '박종덕' },
  { country: '인도', name: '서근석' },
  { country: '네팔', name: '서대우' },
  { country: '인도', name: '송호완' },
  { country: '미얀마', name: '신우영' },
  { country: '말레이시아', name: '윤병국' },
  { country: '말레이시아', name: '이경근' },
  { country: '태국', name: '이규식' },
  { country: '말레이시아', name: '이상민' },
  { country: '필리핀', name: '이슬기', note: '주파송' },
  { country: '말레이시아', name: '이산지' },
  { country: '요르단', name: '조동성' },
  { country: '미얀마', name: '조동제', note: '주파송' },
  { country: '위구르', name: '최갈렙' },
  { country: '일본', name: '최재현' },
  { country: '미얀마', name: '최현' },
  { country: '베트남', name: '허엽' },
  { country: '인도네시아', name: '홍영화' },
  { country: '중국', name: '박상웅' },
  { country: '인도네시아', name: '오석재' },
  { country: '캄보디아', name: '엄성일' },
  { country: '베트남', name: '김형지', note: '주파송' },
]

/** 유럽 지역 선교사 */
export const europeMissionaries: Missionary[] = [
  { country: '포르투갈', name: '김영기' },
  { country: '키르기스스탄', name: '김평화' },
  { country: '아제르바이잔', name: '김창수' },
  { country: '독일', name: '박지원' },
  { country: '코소보', name: '서원민' },
  { country: '러시아', name: '이기영' },
  { country: '러시아', name: '이전진' },
  { country: '러시아 연해주', name: '이철신' },
  { country: '알바니아', name: '이흔도' },
  { country: '우크라이나', name: '정한규' },
  { country: '러시아 연해주', name: '정명동' },
  { country: '독일', name: '박오승' },
]

/** 아프리카 지역 선교사 */
export const africaMissionaries: Missionary[] = [
  { country: '잠비아', name: '김지혜' },
  { country: '우간다', name: '이상철' },
  { country: '남아프리카공화국', name: '전성진' },
  { country: '모로코', name: '정충호' },
  { country: '남아프리카공화국', name: '천준혁', note: '주파송' },
  { country: '탄자니아', name: '육지은', note: '주파송' },
]

/** 남미/중미 지역 선교사 */
export const americasMissionaries: Missionary[] = [
  { country: '파라과이', name: '박중민' },
  { country: '페루', name: '방도초' },
  { country: '파라과이', name: '이정건' },
]

/** 지역별 묶음 */
export const missionaryByRegion: Record<RegionKey, Missionary[]> = {
  asia: asiaMissionaries,
  europe: europeMissionaries,
  africa: africaMissionaries,
  americas: americasMissionaries,
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
    color: '#f59e0b',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
  europe: {
    label: '유럽·중앙아시아',
    labelEn: 'EUROPE · CENTRAL ASIA',
    emoji: '🌍',
    color: '#3b82f6',
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
  },
  africa: {
    label: '아프리카',
    labelEn: 'AFRICA',
    emoji: '🦁',
    color: '#84cc16',
    gradient: 'from-lime-500 via-green-500 to-emerald-600',
  },
  americas: {
    label: '아메리카',
    labelEn: 'AMERICAS',
    emoji: '🌎',
    color: '#ec4899',
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
  },
}

/**
 * 지도 좌표 — 0~1000, 0~500 스케일의 SVG viewBox 기준 대략적 위치.
 * 정확한 지리 좌표는 아니지만 세계지도 배경 위에 점을 찍기 위한 값.
 */
export const countryCoordinates: Record<string, { x: number; y: number; region: RegionKey }> = {
  // 아시아
  '튀르키예': { x: 582, y: 205, region: 'asia' },
  '베트남': { x: 760, y: 265, region: 'asia' },
  '태국': { x: 745, y: 265, region: 'asia' },
  '미얀마': { x: 725, y: 250, region: 'asia' },
  '인도네시아': { x: 790, y: 310, region: 'asia' },
  '인도': { x: 700, y: 250, region: 'asia' },
  '네팔': { x: 715, y: 230, region: 'asia' },
  '말레이시아': { x: 765, y: 300, region: 'asia' },
  '필리핀': { x: 810, y: 275, region: 'asia' },
  '요르단': { x: 600, y: 220, region: 'asia' },
  '위구르': { x: 720, y: 200, region: 'asia' },
  '일본': { x: 830, y: 210, region: 'asia' },
  '중국': { x: 770, y: 215, region: 'asia' },
  '캄보디아': { x: 755, y: 275, region: 'asia' },

  // 유럽
  '포르투갈': { x: 475, y: 210, region: 'europe' },
  '키르기스스탄': { x: 675, y: 200, region: 'europe' },
  '아제르바이잔': { x: 625, y: 205, region: 'europe' },
  '독일': { x: 520, y: 180, region: 'europe' },
  '코소보': { x: 545, y: 200, region: 'europe' },
  '러시아': { x: 585, y: 148, region: 'europe' }, // 모스크바 사역 기준
  '러시아 연해주': { x: 820, y: 160, region: 'europe' },
  '알바니아': { x: 545, y: 205, region: 'europe' },
  '우크라이나': { x: 570, y: 180, region: 'europe' },

  // 아프리카
  '잠비아': { x: 565, y: 345, region: 'africa' },
  '우간다': { x: 580, y: 305, region: 'africa' },
  '남아프리카공화국': { x: 555, y: 395, region: 'africa' },
  '모로코': { x: 480, y: 220, region: 'africa' },
  '탄자니아': { x: 585, y: 320, region: 'africa' },

  // 아메리카
  '파라과이': { x: 295, y: 380, region: 'americas' },
  '페루': { x: 255, y: 335, region: 'americas' },
}

/**
 * 국가 → 국기 이모지. 카드에서 국가명을 시각적으로 즉시 구분하게 한다.
 * 국기가 애매한 지역(위구르 등)은 평화의 비둘기로 대신한다.
 */
export const countryFlag: Record<string, string> = {
  '튀르키예': '🇹🇷',
  '베트남': '🇻🇳',
  '태국': '🇹🇭',
  '미얀마': '🇲🇲',
  '인도네시아': '🇮🇩',
  '인도': '🇮🇳',
  '네팔': '🇳🇵',
  '말레이시아': '🇲🇾',
  '필리핀': '🇵🇭',
  '요르단': '🇯🇴',
  '위구르': '🕊️',
  '일본': '🇯🇵',
  '중국': '🇨🇳',
  '캄보디아': '🇰🇭',
  '포르투갈': '🇵🇹',
  '키르기스스탄': '🇰🇬',
  '아제르바이잔': '🇦🇿',
  '독일': '🇩🇪',
  '코소보': '🇽🇰',
  '러시아': '🇷🇺',
  '러시아 연해주': '🇷🇺',
  '알바니아': '🇦🇱',
  '우크라이나': '🇺🇦',
  '잠비아': '🇿🇲',
  '우간다': '🇺🇬',
  '남아프리카공화국': '🇿🇦',
  '모로코': '🇲🇦',
  '탄자니아': '🇹🇿',
  '파라과이': '🇵🇾',
  '페루': '🇵🇪',
}

/** 서울 실좌표 — 거리 계산용 */
export const SEOUL_GEO = { lat: 37.57, lng: 126.98 }

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

/**
 * 모든 지역을 하나의 리스트로 — 통계 계산용
 */
export const allMissionaries: Missionary[] = [
  ...asiaMissionaries,
  ...europeMissionaries,
  ...africaMissionaries,
  ...americasMissionaries,
]

/** 통계 계산 */
export const missionStats = {
  total: allMissionaries.length,
  countries: new Set(allMissionaries.map(m => m.country)).size,
  regions: 4,
  domesticPartners: domesticChurches.length + domesticOrganizations.length,
}
