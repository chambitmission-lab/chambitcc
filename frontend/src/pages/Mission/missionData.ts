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
  { country: '터키', name: '곽성' },
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
  { country: '키르키스탄', name: '김평화' },
  { country: '아제르바이잔', name: '김창수' },
  { country: '독일', name: '박지원' },
  { country: '코소보', name: '서원민' },
  { country: '모스크바', name: '이기영' },
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
    label: '유럽',
    labelEn: 'EUROPE',
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
  '터키': { x: 582, y: 205, region: 'asia' },
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
  '키르키스탄': { x: 675, y: 200, region: 'europe' },
  '아제르바이잔': { x: 625, y: 205, region: 'europe' },
  '독일': { x: 520, y: 180, region: 'europe' },
  '코소보': { x: 545, y: 200, region: 'europe' },
  '모스크바': { x: 570, y: 155, region: 'europe' },
  '러시아': { x: 640, y: 140, region: 'europe' },
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
  '터키': '🇹🇷',
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
  '키르키스탄': '🇰🇬',
  '아제르바이잔': '🇦🇿',
  '독일': '🇩🇪',
  '코소보': '🇽🇰',
  '모스크바': '🇷🇺',
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
