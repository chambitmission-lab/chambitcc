import { describe, expect, it } from 'vitest'
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
import { STORY_TOC, promiseToc } from './toc'
import type { StoryAct, StoryActToc } from '../storyTypes'

// toc.ts 는 생성 파일이다 — 본문 파일을 고치고 `npm run gen:story-toc` 를 잊으면 여기서 어긋난 자리가 보인다
const project = (act: StoryAct): StoryActToc => ({
  act: act.act,
  ...(act.badge !== undefined ? { badge: act.badge } : {}),
  title: act.title,
  subtitle: act.subtitle,
  emoji: act.emoji,
  range: act.range,
  episodes: act.episodes.map(e => ({
    id: e.id,
    emoji: e.emoji,
    title: e.title,
    hook: e.hook,
    ...(e.promise ? { promiseKind: e.promise.kind } : {}),
  })),
})

const BODIES = [act01, act02, act03, act04, act05, act06, act07, act08, act09, act10]

describe('story toc (생성 파일) ↔ 본문 파일 동기', () => {
  it('본편 10막 목차가 본문과 같다', () => {
    expect(STORY_TOC).toEqual(BODIES.map(project))
  })

  it('특별편 목차가 본문과 같다', () => {
    expect(promiseToc).toEqual(project(promiseAct))
  })

  it('화 id 는 전역 유일하고 특별편만 promise- 로 시작한다', () => {
    const main = BODIES.flatMap(a => a.episodes.map(e => e.id))
    const special = promiseAct.episodes.map(e => e.id)
    expect(new Set([...main, ...special]).size).toBe(main.length + special.length)
    expect(main.some(id => id.startsWith('promise-'))).toBe(false)
    expect(special.every(id => id.startsWith('promise-'))).toBe(true)
  })
})
