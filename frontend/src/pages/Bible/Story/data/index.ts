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

export const findEpisode = (
  id: string
): { episode: StoryEpisode; act: StoryAct; index: number } | null => {
  const index = ALL_EPISODES.findIndex(e => e.id === id)
  if (index < 0) return null
  const episode = ALL_EPISODES[index]
  const act = STORY_ACTS.find(a => a.episodes.some(e => e.id === id))!
  return { episode, act, index }
}

// 읽은 목록 기준 "이어서 읽을" 에피소드 — 순서상 첫 번째 안 읽은 화.
// 전부 읽었으면 null (완주).
export const nextUnread = (readIds: Set<string>): StoryEpisode | null =>
  ALL_EPISODES.find(e => !readIds.has(e.id)) ?? null
