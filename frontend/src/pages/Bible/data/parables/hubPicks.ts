// /bible 허브 '성경 공부 도구' 무대에 올리는 비유 — 입문 코스 5편의 이름·한 줄만 옮긴 작은 표.
// 허브 청크가 비유 데이터(34편 풀이, 70KB)를 끌어오지 않도록 따로 둔다 (chapters.ts 와 같은 이유).
// ★입문 코스(INTRO_COURSE)나 이 다섯 편의 title·gist 를 고치면 여기도 고친다 — scripts/check-parables.mjs 가 어긋남을 잡는다.
export interface HubParablePick {
  id: string
  title: string
  gist: string
}

export const HUB_PARABLE_PICKS: readonly HubParablePick[] = [
  { id: 'lost-sheep', title: '잃은 양', gist: '끝까지 찾으시는 하나님' },
  { id: 'prodigal-son', title: '돌아온 아들', gist: '달려 나와 안아 주는 아버지' },
  { id: 'good-samaritan', title: '선한 사마리아 사람', gist: '내 이웃은 누구일까' },
  { id: 'sower', title: '씨 뿌리는 자', gist: '말씀을 받는 네 가지 마음 밭' },
  { id: 'mustard-seed', title: '겨자씨', gist: '가장 작은 씨가 큰 나무로' },
]
