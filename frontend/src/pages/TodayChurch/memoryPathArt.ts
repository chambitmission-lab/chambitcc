// 걸어온 길 히어로 그림 묶음 — 그림 한 장마다 표지 좌표·길 중심선을 따로 둔다 (MemoryPath.tsx 가 그린다).
// 화면 밖(routePreload)에서도 지금 테마 그림을 미리 받을 수 있게 컴포넌트 파일과 나눠 둔다.
import type { MemoryPath as PathData, TodayChurch } from '../../api/todayChurch'
import { currentTheme, warmImage } from '../../utils/themeAssets'
// v2 그림은 src/assets — 다시 구우면 URL 해시가 바뀌어 서비스 워커의 옛 캐시를 비켜 간다(public/ 은 한 번은 옛 그림).
// -m 은 가로 1024 축소본: 모바일 띠·보통 밀도 PC 엔 이걸로 충분하다(다크 원본 154~202KB → 78~127KB)
import v2Light from '../../assets/today/memory-path-v2-light.webp'
import v2LightM from '../../assets/today/memory-path-v2-light-m.webp'
import v2Dark from '../../assets/today/memory-path-v2-dark.webp'
import v2DarkM from '../../assets/today/memory-path-v2-dark-m.webp'
import v2AutumnLight from '../../assets/today/memory-path-v2-seasons-autumn-light.webp'
import v2AutumnLightM from '../../assets/today/memory-path-v2-seasons-autumn-light-m.webp'
import v2AutumnDark from '../../assets/today/memory-path-v2-seasons-autumn-dark.webp'
import v2AutumnDarkM from '../../assets/today/memory-path-v2-seasons-autumn-dark-m.webp'

// ── 히어로 그림 위 빛 — 그림(1536×1024) 좌표 그대로. 표지: 돌무더기(1년 전)·이정표(6개월 전)·벤치(한 달 전)·발밑(오늘)
// 그림마다 표지 위치가 조금씩 달라서 좌표는 그림 한 장마다 따로 둔다. 그림을 바꾸면 여기 좌표도 다시 잰다.
export type StationOffset = 'year' | 'half' | 'month'
export type Pt = [number, number]

export interface HeroArt {
  src: string
  /** 가로 1024 축소본 — 없으면 원본을 쓴다 */
  srcSmall?: string
  stations: Record<StationOffset, Pt>
  today: Pt
  /** 길 중심선 꼭짓점(먼 곳 → 발밑). 되짚는 빛이 이 선을 따라 내려온다 */
  route: Pt[]
  /** 라이트 그림의 해 위치 — 천천히 밝아졌다 흐려진다 */
  sun?: Pt
  /** 칩을 표지 아래에 다는 정거장(기본: 지평선이라 글과 겹치는 1년 전만) */
  chipBelow?: StationOffset[]
  /** 글 자리와 겹쳐 칩을 달지 않는 정거장(불빛은 그대로) */
  chipHidden?: StationOffset[]
  /** 하늘이 좁아 글 뒤가 복잡한 그림 — 위쪽에 은은한 그라데이션을 깐다 */
  scrim?: boolean
}

const PLAIN_STATIONS: Record<StationOffset, Pt> = { year: [455, 532], half: [650, 592], month: [802, 708] }
const PLAIN_ROUTE: Pt[] = [
  [462, 540], [420, 552], [385, 568], [400, 585], [480, 595], [580, 600], [640, 608], [620, 625], [520, 640], [420, 655],
  [360, 672], [400, 690], [520, 705], [680, 715], [820, 728], [920, 750], [990, 790], [1040, 840], [1120, 880], [1180, 890],
]

/** 기본 — 돌아보는 언덕길 */
const PLAIN: { light: HeroArt; dark: HeroArt } = {
  light: { src: '/images/today/memory-path-light.webp', stations: PLAIN_STATIONS, today: [1180, 890], route: PLAIN_ROUTE, sun: [408, 500] },
  dark: { src: '/images/today/memory-path-dark.webp', stations: PLAIN_STATIONS, today: [1180, 890], route: PLAIN_ROUTE },
}

/** 함께한 지 1년이 넘은 가을 — 사계절을 지나온 길(지평선 작년 가을 → 겨울 → 봄 → 여름 → 발밑 올가을) */
const SEASONS_AUTUMN: { light: HeroArt; dark: HeroArt } = {
  light: {
    src: '/images/today/memory-path-seasons-autumn-light.webp',
    stations: { year: [463, 467], half: [652, 560], month: [808, 690] },
    today: [1180, 885],
    sun: [430, 440],
    route: [
      [475, 478], [430, 484], [385, 494], [395, 508], [470, 518], [580, 530], [660, 552], [670, 572], [610, 590], [480, 605],
      [375, 622], [355, 645], [420, 668], [560, 682], [720, 697], [840, 712], [905, 745], [940, 795], [1000, 845], [1100, 880], [1180, 885],
    ],
  },
  dark: {
    src: '/images/today/memory-path-seasons-autumn-dark.webp',
    stations: { year: [455, 495], half: [652, 553], month: [808, 697] },
    today: [1180, 885],
    route: [
      [470, 505], [430, 510], [390, 518], [395, 532], [470, 542], [580, 552], [660, 572], [668, 592], [610, 608], [480, 620],
      [375, 635], [355, 655], [420, 678], [560, 690], [720, 702], [840, 718], [905, 750], [940, 800], [1000, 848], [1100, 880], [1180, 885],
    ],
  },
}

// ── v2 그림 묶음(2026-11-17 채택, 기본값). 표지 순서가 그림마다 달라 '길을 따라 만나는 순서'로 1년 전·6개월 전·한 달 전을 매긴다
const V2_LIGHT_ROUTE: Pt[] = [
  [490, 568], [455, 585], [460, 602], [540, 612], [700, 614], [830, 618], [915, 640], [925, 665], [860, 690], [720, 712],
  [560, 722], [420, 740], [370, 770], [420, 800], [560, 815], [720, 825], [880, 840], [1000, 862], [1100, 880], [1180, 890],
]
const V2_LIGHT_STATIONS: Record<StationOffset, Pt> = { year: [488, 560], half: [825, 600], month: [672, 700] }

const V2_PLAIN: { light: HeroArt; dark: HeroArt } = {
  light: { src: v2Light, srcSmall: v2LightM, stations: V2_LIGHT_STATIONS, today: [1180, 890], route: V2_LIGHT_ROUTE, sun: [614, 477] },
  dark: {
    src: v2Dark,
    srcSmall: v2DarkM,
    // 돌무더기 → 벤치 → 이정표 순서. 이정표가 돌무더기 바로 아래라 한 달 전 칩도 아래로
    stations: { year: [425, 515], half: [920, 598], month: [565, 640] },
    chipBelow: ['year', 'month'],
    today: [1190, 890],
    route: [
      [430, 525], [395, 540], [390, 560], [430, 578], [560, 585], [720, 590], [860, 600], [945, 620], [950, 645], [880, 662],
      [720, 672], [560, 690], [440, 708], [380, 735], [390, 765], [470, 790], [620, 800], [800, 810], [930, 830], [1030, 860],
      [1120, 880], [1190, 890],
    ],
  },
}

const V2_SEASONS_AUTUMN: { light: HeroArt; dark: HeroArt } = {
  light: { src: v2AutumnLight, srcSmall: v2AutumnLightM, stations: V2_LIGHT_STATIONS, today: [1180, 890], route: V2_LIGHT_ROUTE, sun: [614, 477] },
  dark: {
    src: v2AutumnDark,
    srcSmall: v2AutumnDarkM,
    // 지평선이 높아 돌무더기가 히어로 글 자리 — 칩 없이 불빛만, 글 뒤는 그라데이션
    stations: { year: [800, 358], half: [1037, 472], month: [612, 582] },
    chipHidden: ['year'],
    scrim: true,
    today: [1230, 905],
    route: [
      [795, 372], [735, 383], [708, 395], [740, 408], [785, 422], [770, 440], [700, 452], [672, 462], [720, 472], [860, 482],
      [990, 492], [1018, 507], [960, 522], [850, 537], [750, 551], [702, 566], [735, 581], [850, 596], [950, 612], [982, 632],
      [935, 652], [820, 672], [700, 697], [560, 722], [440, 752], [395, 785], [440, 815], [600, 840], [800, 860], [1000, 875],
      [1120, 890], [1230, 905],
    ],
  },
}

export type HeroArtSet = 'v1' | 'v2'
const ART_SETS: Record<HeroArtSet, { plain: typeof PLAIN; seasonsAutumn: typeof PLAIN }> = {
  v1: { plain: PLAIN, seasonsAutumn: SEASONS_AUTUMN },
  v2: { plain: V2_PLAIN, seasonsAutumn: V2_SEASONS_AUTUMN },
}

/** 1년을 채운 사람에게만 사계절 길 — 지금 받은 그림은 앞뒤가 가을이라 9~11월에만. 다른 계절 그림이 오면 여기서 늘린다 */
export const pickArt = (since: PathData['since'] | undefined, today: string, set: HeroArtSet) => {
  const month = Number(today.slice(5, 7))
  const arts = ART_SETS[set]
  return (since?.days ?? 0) >= 365 && month >= 9 && month <= 11 ? arts.seasonsAutumn : arts.plain
}

// 무대는 모바일 ~360px, PC ~630px 폭(CSS px) — 좁은 화면이거나 보통 밀도면 축소본으로 충분하다.
// <img>·선요청(useThemeArt·warmMemoryHero)이 같은 파일을 가리켜야 두 번 받지 않으므로 srcset 대신 한 번 정해 둔다
const preferSmall =
  typeof window !== 'undefined' && (window.innerWidth < 1024 || (window.devicePixelRatio || 1) < 1.5)

/** 이 기기에서 쓸 그림 파일 */
export const heroSrc = (art: HeroArt): string => (preferSmall && art.srcSmall) || art.src

/** 홈 봉투가 뜰 때(preloadRoute '/today') 지금 테마의 히어로 그림을 미리 받는다 — 탭 즉시 그림이 깔리게 */
export const warmMemoryHero = (data: TodayChurch | undefined, set: HeroArtSet = 'v2'): Promise<void> =>
  data?.memories.length ? warmImage(heroSrc(pickArt(data.path?.since, data.date, set)[currentTheme()])) : Promise.resolve()
