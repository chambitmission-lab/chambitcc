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

export const storyImage = (id: string): string | undefined => STORY_IMAGES[`./img/${id}.webp`]

export const storyThumb = (id: string): string | undefined =>
  STORY_THUMBS[`./img/thumb/${id}.webp`] ?? storyImage(id)
