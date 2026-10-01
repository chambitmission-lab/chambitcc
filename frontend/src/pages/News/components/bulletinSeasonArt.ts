// 디지털 주보 넘겨보기 — 장마다 깔리는 계절 배경(수채 화첩). 지금은 가을만 있다.
// 원본·프롬프트: docs/bulletin-story-autumn-bg-prompts.md (B안). 흰 종이 띠는 잘라내고 webp 로 구웠다.
// 다른 계절을 더하면 같은 모양의 표를 SEASON_ART·COVER_ART 에 넣는다 — 없는 계절은 지금처럼 톤 색만 쓴다.
import type { NaturalSeason } from '../../../utils/naturalSeason'
import worshipLight from '../../../assets/bulletin/autumn/worship-light.webp'
import worshipDark from '../../../assets/bulletin/autumn/worship-dark.webp'
import sermonLight from '../../../assets/bulletin/autumn/sermon-light.webp'
import sermonDark from '../../../assets/bulletin/autumn/sermon-dark.webp'
import prayerLight from '../../../assets/bulletin/autumn/prayer-light.webp'
import prayerDark from '../../../assets/bulletin/autumn/prayer-dark.webp'
import newsLight from '../../../assets/bulletin/autumn/news-light.webp'
import newsDark from '../../../assets/bulletin/autumn/news-dark.webp'
import weekLight from '../../../assets/bulletin/autumn/week-light.webp'
import weekDark from '../../../assets/bulletin/autumn/week-dark.webp'
import groupsLight from '../../../assets/bulletin/autumn/groups-light.webp'
import groupsDark from '../../../assets/bulletin/autumn/groups-dark.webp'
import endLight from '../../../assets/bulletin/autumn/end-light.webp'
import endDark from '../../../assets/bulletin/autumn/end-dark.webp'
import coverLight from '../../../assets/bulletin/autumn/cover-light.webp'
import coverDark from '../../../assets/bulletin/autumn/cover-dark.webp'

type ArtKey = 'worship' | 'sermon' | 'prayer' | 'news' | 'week' | 'groups' | 'end'
interface ArtPair {
  light: string
  dark: string
}

const AUTUMN: Record<ArtKey, ArtPair> = {
  worship: { light: worshipLight, dark: worshipDark },
  sermon: { light: sermonLight, dark: sermonDark },
  prayer: { light: prayerLight, dark: prayerDark },
  news: { light: newsLight, dark: newsDark },
  week: { light: weekLight, dark: weekDark },
  groups: { light: groupsLight, dark: groupsDark },
  // 라이트 원본은 흰 종이 띠가 바구니 뒤를 가로질러 와서, 띠를 하늘로 메우고 억새 붓결은 같은 구도의 다크본에서 빌려 구웠다
  end: { light: endLight, dark: endDark },
}

/** 표지 — 하늘·들판이 네 모서리까지 이어지는 풀블리드 정사각형(문서 A-1). 늘려 굽지 않는다 */
const COVER_ART: Partial<Record<NaturalSeason, ArtPair>> = {
  autumn: { light: coverLight, dark: coverDark },
}

const SEASON_ART: Partial<Record<NaturalSeason, Record<ArtKey, ArtPair>>> = {
  autumn: AUTUMN,
}

/** 장 key → 배경 key. 추가 안내(extra-*)는 소식 배경을 같이 쓴다. 표지는 bulletinCoverArt 가 따로 맡는다 */
const artKeyOf = (slideKey: string): ArtKey | null => {
  if (slideKey.startsWith('extra-')) return 'news'
  return slideKey in AUTUMN ? (slideKey as ArtKey) : null
}

export const bulletinSeasonArt = (season: NaturalSeason, slideKey: string, isDark: boolean): string | null => {
  const table = SEASON_ART[season]
  const key = artKeyOf(slideKey)
  if (!table || !key) return null
  return isDark ? table[key].dark : table[key].light
}

/** 표지 삽화. 없는 계절이면 null — 그때는 홈 히어로의 계절 사진을 쓴다 */
export const bulletinCoverArt = (season: NaturalSeason, isDark: boolean): string | null => {
  const pair = COVER_ART[season]
  return pair ? (isDark ? pair.dark : pair.light) : null
}

/* ── PC 목차 썸네일 ──
 * 큰 배경을 44×30 에 줄이면 하늘만 보이고, 목차를 펼치자마자 큰 그림 15장을 다 받게 된다.
 * 장면 띠만 잘라 132×90 으로 따로 구웠다(thumb/, 다 합쳐 30KB 안쪽). 파일 이름 = '<장>-<light|dark>' */
const THUMB_FILES = import.meta.glob<string>('../../../assets/bulletin/autumn/thumb/*.webp', {
  eager: true,
  import: 'default',
})
const AUTUMN_THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(THUMB_FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
)
const SEASON_THUMBS: Partial<Record<NaturalSeason, Record<string, string>>> = {
  autumn: AUTUMN_THUMBS,
}

/** 목차 썸네일 — 표지는 'cover', 나머지는 장 key. 없으면 null(톤 색 썸네일 그대로) */
export const bulletinSeasonThumb = (season: NaturalSeason, slideKey: string, isDark: boolean): string | null => {
  const table = SEASON_THUMBS[season]
  const key = slideKey === 'cover' ? 'cover' : artKeyOf(slideKey)
  if (!table || !key) return null
  return table[`${key}-${isDark ? 'dark' : 'light'}`] ?? null
}
