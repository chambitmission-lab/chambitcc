import type { StoryAct, StoryActToc, StoryEpisode, StoryEpisodeToc } from '../storyTypes'
import { STORY_TOC, promiseToc } from './toc'

// 지도·벽화·에피소드 히어로는 목차(toc.ts, 생성 파일)만 본다. 본문이 든 act01~10.ts·promise.ts 는
// 여기서 정적으로 import 하지 않는다 — 그러면 지도 청크에 본문 120KB 가 통째로 따라온다.
// 본문은 loadEpisodeBody 로 막 단위 청크를 읽을 때만 받는다(Story/storyQueries 가 캐시).
export const STORY_ACTS: StoryActToc[] = STORY_TOC

// 전체 에피소드 순서대로 (여정 진행·이전/다음 탐색의 기준)
export const ALL_EPISODES: StoryEpisodeToc[] = STORY_ACTS.flatMap(a => a.episodes)

export const TOTAL_EPISODES = ALL_EPISODES.length

// 특별편 — 약속의 실(메시아의 신호). 본편 42화 순서·완주·벽화에는 끼지 않는 별도 묶음이다.
// 화 id 는 'promise-' 로 시작한다(storyProgress.isMainEpisodeId 가 이 접두사로 본편을 가른다).
export const PROMISE_ACT: StoryActToc = promiseToc
export const PROMISE_EPISODES: StoryEpisodeToc[] = promiseToc.episodes

export interface FoundEpisode {
  episode: StoryEpisodeToc
  act: StoryActToc
  /** series 안에서의 위치 (0부터) */
  index: number
  /** 이 화가 속한 연속 목록 — 이전/다음 화는 이 안에서만 오간다 */
  series: StoryEpisodeToc[]
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
export const nextUnreadPromise = (readIds: Set<string>): StoryEpisodeToc | null =>
  PROMISE_EPISODES.find(e => !readIds.has(e.id)) ?? null

// 읽은 목록 기준 "이어서 읽을" 에피소드 — 순서상 첫 번째 안 읽은 화.
// 전부 읽었으면 null (완주).
export const nextUnread = (readIds: Set<string>): StoryEpisodeToc | null =>
  ALL_EPISODES.find(e => !readIds.has(e.id)) ?? null

// ── 본문 ──────────────────────────────────────────────────────────────────
// 막 번호 → 본문 청크. 한 막이 한 파일이라 같은 막의 다음 화는 추가 요청 없이 읽는다.
// 브라우저가 모듈을 한 번만 받으므로 여기서 따로 캐시하지 않는다
const BODY_LOADERS: Record<number, () => Promise<StoryAct>> = {
  0: () => import('./promise').then(m => m.promiseAct),
  1: () => import('./act01').then(m => m.act01),
  2: () => import('./act02').then(m => m.act02),
  3: () => import('./act03').then(m => m.act03),
  4: () => import('./act04').then(m => m.act04),
  5: () => import('./act05').then(m => m.act05),
  6: () => import('./act06').then(m => m.act06),
  7: () => import('./act07').then(m => m.act07),
  8: () => import('./act08').then(m => m.act08),
  9: () => import('./act09').then(m => m.act09),
  10: () => import('./act10').then(m => m.act10),
}

/** 화 본문(이야기·왜 중요할까·절 참조·딥링크…) — 모르는 id 면 null */
export const loadEpisodeBody = async (id: string): Promise<StoryEpisode | null> => {
  const found = findEpisode(id)
  const load = found && BODY_LOADERS[found.act.act]
  if (!load) return null
  const act = await load()
  return act.episodes.find(e => e.id === id) ?? null
}
