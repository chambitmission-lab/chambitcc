// 오디오북 연속 재생 — 다음 장 미리 준비.
// BibleAudioPlayer 에서 분리: 플레이어는 "지금 장"의 재생만 다루고, 다음 장을 언제 미리
// 생성시키고 캐시 URL 을 언제까지 다시 물을지는 여기서 담당한다.
import { useEffect, useState } from 'react'
import { prewarmTts } from '../../../api/bibleTts'
import type { BibleTTSVoice } from '../../../types/bible'
import { useTtsResolve } from './useTtsResolve'

interface UseNextChapterPrewarmOptions {
  bookNumber: number
  chapter: number
  voice: BibleTTSVoice
  /** 이 장의 재생을 시작했는지 */
  started: boolean
  isPlaying: boolean
  /** 연속 재생 설정 */
  autoNext: boolean
  hasNextChapter?: boolean
  /** 현재 재생 시각(초) */
  currentTime: number
  /** 진행률(0~100). 총길이를 모르는 스트리밍이면 0 */
  pct: number
}

/**
 * 현재 장을 절반(총길이 모르는 스트리밍이면 30초) 넘게 들었으면 다음 장을 백엔드에 미리
 * 생성시키고, 캐시 URL 이 생길 때까지 resolve 를 다시 묻는다.
 * 장이 끝나는 순간 생성 지연 없이 R2 파일로 바로 이어진다.
 *
 * 반환값은 다음 장의 resolve 결과(아직 준비 전이면 undefined 또는 url 이 null).
 */
export const useNextChapterPrewarm = ({
  bookNumber,
  chapter,
  voice,
  started,
  isPlaying,
  autoNext,
  hasNextChapter,
  currentTime,
  pct,
}: UseNextChapterPrewarmOptions) => {
  const chapterKey = `${bookNumber}-${chapter}`
  const nextChapter = chapter + 1
  // 준비를 건 장(key)을 기억 — 장이 바뀌면 key 가 달라져 자동으로 "아직 안 걺"이 된다
  const [prepNextKey, setPrepNextKey] = useState<string | null>(null)
  const prepNext = prepNextKey === chapterKey && !!hasNextChapter
  useEffect(() => {
    if (prepNext || !started || !isPlaying || !autoNext || !hasNextChapter) return
    if (currentTime < 30 && pct < 50) return
    setPrepNextKey(chapterKey)
  }, [prepNext, started, isPlaying, autoNext, hasNextChapter, currentTime, pct, chapterKey])
  const nextResolved = useTtsResolve({
    bookNumber,
    chapter: nextChapter,
    voice,
    enabled: prepNext,
    pollUntilCached: true,
  })
  useEffect(() => {
    if (!prepNext) return
    prewarmTts(bookNumber, nextChapter, voice).catch(() => {})
  }, [prepNext, bookNumber, nextChapter, voice])

  return nextResolved
}
