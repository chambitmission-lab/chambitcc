import { useCallback, useMemo, useState } from 'react'
import type { AtlasJourney, AtlasRef } from './atlasTypes'
import { PLACES } from './data/places'
import { uniquePlaceIds } from './data/journeys'

// 지도 퀴즈 — "이 일이 일어난 곳은 어디일까요?"
//
// 난이도 정책: 질문과 보기는 쉽게, 해설은 깊이 있게. 그래서
//  - 보기는 3개, 그것도 지도 위에 반짝이는 핀으로만 (읽을 게 없다)
//  - 문제는 그 장소의 사건 문장을 그대로 쓴다 (새로 외울 것이 없다)
//  - 틀려도 정답 핀을 부드럽게 알려 주고, 그때 본문 링크와 배경 설명을 붙인다
//
// 문제 문장에 장소 이름이 들어 있으면 답이 그대로 노출되므로 그런 사건은 뺀다.

const QUESTION_COUNT = 5
const CHOICE_COUNT = 3

export interface QuizQuestion {
  /** 정답 장소 슬러그 */
  answer: string
  /** 지도에서 반짝일 후보들 (정답 포함, 섞여 있다) */
  choices: string[]
  /** 문제 문장 */
  prompt: string
  /** 해설에 붙일 본문 */
  ref: AtlasRef
}

const shuffle = <T,>(list: T[]): T[] => {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 이 여정으로 낼 수 있는 문제 만들기 */
export const buildQuestions = (journey: AtlasJourney): QuizQuestion[] => {
  const placeIds = uniquePlaceIds(journey)

  const pool: QuizQuestion[] = []
  for (const id of placeIds) {
    const place = PLACES[id]
    if (!place?.events?.length) continue
    for (const event of place.events) {
      // 문장에 지명이 들어 있으면 답이 새어 나간다
      if (event.text.includes(place.name)) continue
      const others = placeIds.filter((other) => other !== id)
      if (others.length < CHOICE_COUNT - 1) continue
      pool.push({
        answer: id,
        choices: shuffle([id, ...shuffle(others).slice(0, CHOICE_COUNT - 1)]),
        prompt: event.text,
        ref: event.ref,
      })
      break // 한 장소에서 한 문제만 — 같은 곳이 반복되면 지루하다
    }
  }

  return shuffle(pool).slice(0, QUESTION_COUNT)
}

export interface MapQuiz {
  active: boolean
  questions: QuizQuestion[]
  index: number
  current?: QuizQuestion
  /** 이번 문제에서 사용자가 고른 답 (아직이면 null) */
  picked: string | null
  correctCount: number
  /** 마지막 문제까지 답을 마쳤는가 */
  done: boolean
  start: () => void
  stop: () => void
  /** 지도에서 핀을 눌렀을 때 — 퀴즈 중이면 답으로 받는다 */
  pick: (placeId: string) => void
  next: () => void
}

export const useMapQuiz = (journey: AtlasJourney): MapQuiz => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  // 여정이 바뀌면 진행 중이던 퀴즈는 접는다 — 다른 지도에 문제만 남으면 이상하다
  const [forJourney, setForJourney] = useState(journey.id)
  if (forJourney !== journey.id) {
    setForJourney(journey.id)
    setQuestions([])
    setIndex(0)
    setPicked(null)
    setCorrectCount(0)
  }

  const start = useCallback(() => {
    setQuestions(buildQuestions(journey))
    setIndex(0)
    setPicked(null)
    setCorrectCount(0)
  }, [journey])

  const stop = useCallback(() => {
    setQuestions([])
    setPicked(null)
  }, [])

  const current = questions[index]

  const pick = useCallback(
    (placeId: string) => {
      if (!current || picked) return
      setPicked(placeId)
      if (placeId === current.answer) setCorrectCount((n) => n + 1)
    },
    [current, picked]
  )

  const next = useCallback(() => {
    setPicked(null)
    setIndex((i) => i + 1)
  }, [])

  const done = questions.length > 0 && index >= questions.length

  return useMemo(
    () => ({
      active: questions.length > 0,
      questions,
      index,
      current,
      picked,
      correctCount,
      done,
      start,
      stop,
      pick,
      next,
    }),
    [questions, index, current, picked, correctCount, done, start, stop, pick, next]
  )
}
