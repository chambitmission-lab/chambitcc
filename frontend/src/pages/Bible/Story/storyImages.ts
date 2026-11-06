import { pairSrc, type ThemeName, type ThemePair } from '../../../utils/themeAssets'

// 에피소드 일러스트 — img/{에피소드 id}.webp 파일을 넣기만 하면 자동으로 연결된다.
// 아직 없는 화는 기존 이모지 히어로를 유지한다. eager여도 청크에는 URL 맵만 실리고
// 이미지 바이너리는 실제로 그 그림을 그릴 때 로드된다.
const STORY_IMAGES = import.meta.glob('./img/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// 480px 썸네일 — 완주 벽화(42칸)처럼 한 화면에 여러 장을 그릴 때 쓴다.
// 원본(1200px) 42장을 한꺼번에 받으면 1.9MB라, 칸에는 이걸 쓰고 크게 볼 때만 원본을 받는다.
const STORY_THUMBS = import.meta.glob('./img/thumb/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// 테마별 한 쌍 — img/{id}-light.webp + img/{id}-dark.webp 가 둘 다 있으면 테마에 맞는 쪽을 쓴다.
// 본편 42화는 밤하늘 한 장(테마 공용)이고, 특별편(약속의 실)은 라이트·다크 두 장으로 그린다.
// 한쪽만 있으면 쌍으로 치지 않는다(한 테마에서만 그림이 사라지는 것보다 아이콘 통일이 낫다).
export const storyImagePair = (id: string): ThemePair | undefined => {
  const light = STORY_IMAGES[`./img/${id}-light.webp`]
  const dark = STORY_IMAGES[`./img/${id}-dark.webp`]
  return light && dark ? { light, dark } : undefined
}

/** 지금 테마에서 보여 줄 그림 — 쌍이 있으면 쌍, 없으면 공용 한 장 */
export const storyImage = (id: string, theme: ThemeName = 'dark'): string | undefined => {
  const pair = storyImagePair(id)
  return pair ? pairSrc(pair, theme) : STORY_IMAGES[`./img/${id}.webp`]
}

export const storyThumb = (id: string): string | undefined =>
  STORY_THUMBS[`./img/thumb/${id}.webp`] ?? storyImage(id)
