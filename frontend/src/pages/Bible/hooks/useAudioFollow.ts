import { useEffect, useRef, useState } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse } from '../../../types/bible'
import type { VerseScrollBlock } from './useVerseScroll'

interface UseAudioFollowOptions {
  /** 오디오북이 지금 낭독 중인 절 */
  audioActiveVerse?: number | null
  /** 오디오북이 실제 재생 중인지 */
  audioPlaying: boolean
  /** 절이 아직 로드됐는지 판단하고, 갱신될 때마다 다시 맞추기 위해 필요 */
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  scrollVerseIntoView: (el: HTMLElement, block?: VerseScrollBlock) => void
  cancelVerseScroll: () => void
}

// 낭독 절이 편안 구역(헤더 아래 ~ 화면 하단 앵커 82%) 안에 온전히 보이면 true.
// 이 안에 있으면 화면을 움직이지 않고 하이라이트만 아래로 흐르게 둔다.
// 아래쪽 82%를 넘어가면 그때 딱 한 절만큼만 밀어 하단에 붙여둔다.
const isVerseInComfortZone = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  return rect.top >= 112 && rect.bottom <= window.innerHeight * 0.82
}

/**
 * 오디오북 듣기-보기 동기화.
 *
 * 낭독 절을 텔레프롬프터처럼 하단 고정으로 따라간다. 절이 바뀔 때마다
 * 화면을 움직이거나, 맨 위로 확 끌어올리면(예전 방식) 반 화면이 점프하며
 * 멀미가 난다. 대신:
 *  1) 낭독 절이 아직 화면 위쪽~하단 앵커(82%) 사이에 보이는 동안은 스크롤을
 *     하지 않고 하이라이트만 아래로 내린다 — 이미 화면에 있는 다음 절들을
 *     자연스럽게 따라 읽는다("하단 하단 하단").
 *  2) 낭독 절이 하단 앵커에 닿으면, 딱 한 절만큼만 아래로 밀어 그 절을 다시
 *     앵커에 맞춘다 — 맨 위로 리셋하지 않고 계속 하단에 머문다("한 단계씩").
 * 사용자가 직접 스크롤하면 잠시 멈추고 pill을 띄우며, pill 탭 또는
 * 마지막 조작 6초 후 자동으로 다시 따라간다.
 */
export const useAudioFollow = ({
  audioActiveVerse,
  audioPlaying,
  chapterData,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  scrollVerseIntoView,
  cancelVerseScroll,
}: UseAudioFollowOptions) => {
  const [audioFollow, setAudioFollow] = useState(true)
  const audioFollowRef = useRef(audioFollow)
  audioFollowRef.current = audioFollow
  // 재생이 멈추면 따라가기도 즉시 멈춘다. 하이라이트(audioActiveVerse)는 마지막
  // 낭독 절에 그대로 남아 있으므로, 재생 여부를 함께 봐야 "멈췄는데 화면만
  // 계속 그 절로 끌려가는" 현상이 없다.
  const audioSyncActive = audioActiveVerse != null && audioPlaying
  const audioPlayingRef = useRef(audioPlaying)
  audioPlayingRef.current = audioPlaying

  // 낭독 절이 바뀌면: 따라가기 중이고 하단 앵커를 벗어났을 때만 한 절만큼 밀어 올린다.
  // 아직 로드 안 된 절(무한 스크롤 뒷페이지)이면 다음 페이지를 미리 받는다.
  useEffect(() => {
    if (audioActiveVerse == null) {
      setAudioFollow(true) // 다음 재생을 위해 초기화
      return
    }
    // 일시정지 중이면 절이 로드되거나 목록이 갱신돼도 화면을 움직이지 않는다
    if (!audioPlaying) return
    if (!chapterData) return
    const el = document.getElementById(`bible-verse-${audioActiveVerse}`)
    if (el) {
      if (audioFollowRef.current && !isVerseInComfortZone(el)) {
        scrollVerseIntoView(el, 'follow')
      }
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [audioActiveVerse, audioPlaying, chapterData, hasNextPage, isFetchingNextPage, fetchNextPage, scrollVerseIntoView])

  const followResumeTimerRef = useRef<number | null>(null)

  // 일시정지(또는 종료) 순간: 진행 중인 따라가기 스크롤과 6초 자동 복귀 예약을 모두 취소.
  // 이게 없으면 멈춘 뒤에도 예약된 복귀가 살아 있어 화면이 혼자 낭독 절로 돌아간다.
  useEffect(() => {
    if (audioPlaying) return
    cancelVerseScroll()
    if (followResumeTimerRef.current) {
      clearTimeout(followResumeTimerRef.current)
      followResumeTimerRef.current = null
    }
    setAudioFollow(true) // 다시 재생하면 곧바로 따라가도록 초기화
  }, [audioPlaying, cancelVerseScroll])

  const resumeAudioFollow = () => {
    if (followResumeTimerRef.current) {
      clearTimeout(followResumeTimerRef.current)
      followResumeTimerRef.current = null
    }
    setAudioFollow(true)
    if (audioActiveVerse != null && audioPlayingRef.current) {
      const el = document.getElementById(`bible-verse-${audioActiveVerse}`)
      // 이미 편안 구역에 보이면 굳이 화면을 움직이지 않는다
      if (el && !isVerseInComfortZone(el)) scrollVerseIntoView(el, 'follow')
    }
  }
  // 자동 재개 타이머에서 항상 최신 상태(현재 낭독 절)를 보도록 ref로 보관
  const resumeAudioFollowRef = useRef(resumeAudioFollow)
  resumeAudioFollowRef.current = resumeAudioFollow

  // 낭독 중 사용자가 직접 스크롤(휠/터치)하면 따라가기를 잠시 멈춘다.
  // - 모바일은 화면에 손가락이 스치기만 해도 touchmove가 오므로, 12px 이상
  //   실제로 드래그했을 때만 '직접 스크롤'로 간주한다 (탭 떨림 방어).
  // - 멈춘 따라가기는 마지막 조작 후 6초가 지나면 현재 낭독 절로 자동 복귀한다.
  // scrollIntoView가 만드는 scroll 이벤트는 wheel/touchmove를 발생시키지 않아 안전.
  useEffect(() => {
    if (!audioSyncActive) return
    let touchStartY: number | null = null
    const pauseFollow = () => {
      cancelVerseScroll() // 진행 중인 자동 스크롤이 손가락과 싸우지 않게 즉시 중단
      setAudioFollow(false)
      if (followResumeTimerRef.current) clearTimeout(followResumeTimerRef.current)
      followResumeTimerRef.current = window.setTimeout(() => {
        followResumeTimerRef.current = null
        resumeAudioFollowRef.current()
      }, 6000)
    }
    const onWheel = () => pauseFollow()
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (touchStartY == null || y == null) return
      if (Math.abs(y - touchStartY) > 12) pauseFollow()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      if (followResumeTimerRef.current) {
        clearTimeout(followResumeTimerRef.current)
        followResumeTimerRef.current = null
      }
    }
  }, [audioSyncActive, cancelVerseScroll])

  return { audioFollow, audioSyncActive, resumeAudioFollow }
}
