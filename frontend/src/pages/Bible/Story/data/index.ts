import type { StoryAct, StoryEpisode } from '../storyTypes'
import { act01 } from './act01'
import { act02 } from './act02'
import { act03 } from './act03'
import { act04 } from './act04'
import { act05 } from './act05'
import { act06 } from './act06'
import { act07 } from './act07'
import { act08 } from './act08'
import { act09 } from './act09'
import { act10 } from './act10'
import { promiseAct } from './promise'

export const STORY_ACTS: StoryAct[] = [
  act01,
  act02,
  act03,
  act04,
  act05,
  act06,
  act07,
  act08,
  act09,
  act10,
]

// 전체 에피소드 순서대로 (여정 진행·이전/다음 탐색의 기준)
export const ALL_EPISODES: StoryEpisode[] = STORY_ACTS.flatMap(a => a.episodes)

export const TOTAL_EPISODES = ALL_EPISODES.length

// 특별편 — 약속의 실(메시아의 신호). 본편 42화 순서·완주·벽화에는 끼지 않는 별도 묶음이다.
// 화 id 는 'promise-' 로 시작한다(storyProgress.isMainEpisodeId 가 이 접두사로 본편을 가른다).
export const PROMISE_ACT: StoryAct = promiseAct
export const PROMISE_EPISODES: StoryEpisode[] = promiseAct.episodes

export interface FoundEpisode {
  episode: StoryEpisode
  act: StoryAct
  /** series 안에서의 위치 (0부터) */
  index: number
  /** 이 화가 속한 연속 목록 — 이전/다음 화는 이 안에서만 오간다 */
  series: StoryEpisode[]
  special: boolean
}

export const findEpisode = (id: string): FoundEpisode | null => {
  const index = ALL_EPISODES.findIndex(e => e.id === id)
  if (index >= 0) {
    const act = STORY_ACTS.find(a => a.episodes.some(e => e.id === id))!
    return { episode: ALL_EPISODES[index], act, index, series: ALL_EPISODES, special: false }
  }
  const pIndex = PROMISE_EPISODES.findIndex(e => e.id === id)
  if (pIndex >= 0) {
    return {
      episode: PROMISE_EPISODES[pIndex],
      act: PROMISE_ACT,
      index: pIndex,
      series: PROMISE_EPISODES,
      special: true,
    }
  }
  return null
}

/** 특별편에서 이어 읽을 화 — 다 읽었으면 null */
export const nextUnreadPromise = (readIds: Set<string>): StoryEpisode | null =>
  PROMISE_EPISODES.find(e => !readIds.has(e.id)) ?? null

// 읽은 목록 기준 "이어서 읽을" 에피소드 — 순서상 첫 번째 안 읽은 화.
// 전부 읽었으면 null (완주).
export const nextUnread = (readIds: Set<string>): StoryEpisode | null =>
  ALL_EPISODES.find(e => !readIds.has(e.id)) ?? null
