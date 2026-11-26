import { CHURCH_SEASON_PHOTO, visitSceneFor } from '../../../utils/themeAssets'
import { getNaturalSeason, type NaturalSeason } from '../../../utils/naturalSeason'

/* 참빛 풍경 엽서 세트 — 같은 계절이 이어져도 매주 구도가 바뀌도록 주 번호로 돌린다.
 * 사진은 지금 교회 전경 두 갈래: /visit 가로 풍경(건물 전체·하늘) · 계절 세로 사진(탑·간판·정원 클로즈업).
 * 라이트 = 낮, 다크 = 밤 사진. 네 계절 세로 사진은 구도가 같아 같은 objectPosition 이 통한다. */

export interface PostcardFrame {
  src: string
  /** CSS object-position */
  pos: string
  /** 사진 아래 손글씨 — "No.48 — 십자가 탑을 올려다보며" 의 뒷부분 */
  caption: string
}

const SEASON_WORD: Record<NaturalSeason, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }

type FrameSpec = { kind: 'wide' | 'tall'; pos: string; caption: (s: NaturalSeason) => string }

const FRAMES: FrameSpec[] = [
  { kind: 'wide', pos: '96% 65%', caption: (s) => `${SEASON_WORD[s]} 하늘과 성전` },
  { kind: 'tall', pos: '50% 8%', caption: () => '십자가 탑을 올려다보며' },
  { kind: 'tall', pos: '50% 84%', caption: (s) => `${SEASON_WORD[s]}, 예배당 앞 뜰` },
  { kind: 'tall', pos: '72% 32%', caption: () => '참빛교회 이름 아래' },
]

export const postcardFrameFor = (weekNo: number, sunday: Date, theme: 'light' | 'dark'): PostcardFrame => {
  const season = getNaturalSeason(sunday)
  const spec = FRAMES[weekNo % FRAMES.length]
  const src = spec.kind === 'wide' ? visitSceneFor(theme, sunday)!.src : CHURCH_SEASON_PHOTO[season][theme]
  return { src, pos: spec.pos, caption: spec.caption(season) }
}

/** 우표 속 작은 교회 — 그 주 계절 가로 풍경의 건물 쪽 */
export const postcardStampFor = (sunday: Date, theme: 'light' | 'dark'): string => visitSceneFor(theme, sunday)!.src
