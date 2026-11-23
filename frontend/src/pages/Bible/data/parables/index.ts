// 검증 스크립트(scripts/check-parables.mjs)가 node 로 그대로 import 하도록 .ts 확장자를 붙인다
import heart from './heart.ts'
import kingdom from './kingdom.ts'
import prayer from './prayer.ts'
import neighbor from './neighbor.ts'
import life from './life.ts'
import ready from './ready.ts'
import type { Parable, ParableTopic } from './types'

export type { Parable, ParableTopic, ParableMark, ParableArtKind } from './types'

export const TOPIC_ORDER: readonly ParableTopic[] = ['heart', 'kingdom', 'prayer', 'neighbor', 'life', 'ready']

export const TOPIC_LABEL: Record<ParableTopic, string> = {
  heart: '하나님의 마음',
  kingdom: '하나님 나라',
  prayer: '기도',
  neighbor: '이웃과 용서',
  life: '듣고 행하는 삶',
  ready: '깨어 준비하기',
}

export const TOPIC_HINT: Record<ParableTopic, string> = {
  heart: '잃은 사람을 끝까지 찾으세요',
  kingdom: '작게 시작해 크게 자라요',
  prayer: '포기하지 말고, 낮은 마음으로',
  neighbor: '받은 사랑을 흘려보내요',
  life: '아는 것보다 사는 것',
  ready: '주님 다시 오실 날을 기다리며',
}

/** 도감 순서 = 주제 순서 → 파일 안 순서 */
export const PARABLES: readonly Parable[] = [...heart, ...kingdom, ...prayer, ...neighbor, ...life, ...ready]

const BY_ID = new Map(PARABLES.map((p) => [p.id, p]))
export const getParable = (id: string | null | undefined): Parable | undefined => (id ? BY_ID.get(id) : undefined)

/** 처음 만나는 비유 — 초보자 입문 코스 5편 (쉬운 순서) */
export const INTRO_COURSE: readonly string[] = ['lost-sheep', 'prodigal-son', 'good-samaritan', 'sower', 'mustard-seed']

/**
 * 다 읽은 뒤 이어서 권할 비유.
 * 입문 코스 안이면 코스의 다음 편, 아니면 같은 주제의 다음 편(주제 끝이면 다음 주제 첫 편).
 * 이미 읽은 것은 건너뛰고, 전부 읽었으면 순서상 바로 다음 편.
 */
export const nextParable = (id: string, read: ReadonlySet<string>): Parable | undefined => {
  const course = INTRO_COURSE.indexOf(id)
  if (course >= 0) {
    const nextInCourse = INTRO_COURSE.slice(course + 1).find((x) => !read.has(x))
    if (nextInCourse) return BY_ID.get(nextInCourse)
  }
  const at = PARABLES.findIndex((p) => p.id === id)
  if (at < 0) return undefined
  const rotated = [...PARABLES.slice(at + 1), ...PARABLES.slice(0, at)]
  return rotated.find((p) => !read.has(p.id)) ?? rotated[0]
}
