// 한 장의 "읽음" 상태를 한 곳에서 — 현황 조회·완독 판정·플랜 동기화·본문 대기(hold)·
// 절/장 읽음 처리까지. 예전엔 VerseList 안에 effect 여섯 개가 각자 ref 플래그를 들고
// 같은 readStatusData 를 감시했고, 장이 바뀔 때마다 그 플래그를 되돌리는 effect 가 또
// 따로 있었다. 여기서는 장별 상태를 "장 키와 함께" 저장해 장이 바뀌면 저절로 없는 값이
// 되게 하고(리셋 effect 없음), 완독 감시는 effect 하나로 모은다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../types/bible'
import { useAuth } from '../../../hooks/useAuth'
import {
  useChapterReadStatus,
  useMarkVerseAsRead,
  useUnmarkVerseAsRead,
  useMarkChapterAsRead,
  useUnmarkChapterAsRead,
} from '../../../hooks/useBibleReading'
import { biblePlanKeys } from '../../../hooks/useBiblePlan'
import { showToast } from '../../../utils/toast'

// 본문이 먼저 왔을 때 읽음 상태를 함께 기다리는 최대 시간 — 이보다 길면 본문부터 그린다
const READ_STATUS_HOLD_MS = 220
// 장 전체 읽음 취소 2탭 확인 유지 시간
const UNMARK_CONFIRM_MS = 3000

// 축하 효과(canvas-confetti)는 절을 다 읽은 순간에만 필요하다
const celebrateFlowerBloom = () =>
  void import('../../../utils/confettiEffects').then((m) => m.celebrateFlowerBloom())

/**
 * 읽음 처리 호출 묶음을 기다린다.
 *
 * 병합 구간(신 6:18-19)은 화면엔 한 덩이지만 읽음 기록은 절 행마다 남는다 —
 * 함께 찍어야 '읽은 절 / 전체 절'과 장 완독 판정(백엔드는 행 수로 센다)이
 * 어긋나지 않는다. 이미 읽음(ALREADY_READ)은 실패가 아니다: 묶음 중 일부만
 * 기록돼 있을 수 있다.
 */
const settleReadCalls = async (calls: Promise<unknown>[]) => {
  const results = await Promise.allSettled(calls)
  for (const r of results) {
    if (r.status !== 'rejected') continue
    if (r.reason instanceof Error && r.reason.message === 'ALREADY_READ') continue
    throw r.reason
  }
}

interface UseChapterReadStateOptions {
  bookNumber: number
  chapter: number
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  /** 본문 자체가 아직 오는 중인지 (부모의 장 쿼리 isLoading) */
  chapterLoading: boolean
  /** 병합 구간 첫 절 id → 함께 읽음 처리할 절 id 전부 (숨은 자리표시자 절 포함) */
  mergedMemberIds: Map<number, number[]>
  /** 이 장의 모든 절을 읽었을 때 장마다 1회 (읽기 플랜 자동 완료). 이미 다 읽힌 장을 열어도 부른다 */
  onChapterFullyRead?: () => void
  /** 수동(길게 누르기) 읽음 처리를 성공했을 때 — 안내 문구를 닫는 용도 */
  onManualReadDone?: () => void
}

export const useChapterReadState = ({
  bookNumber,
  chapter,
  chapterData,
  chapterLoading,
  mergedMemberIds,
  onChapterFullyRead,
  onManualReadDone,
}: UseChapterReadStateOptions) => {
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()
  const queryClient = useQueryClient()
  // 장별 상태는 이 키와 함께 저장한다 — 장이 바뀌면 키가 안 맞아 자동으로 '초기값'이 된다
  const chapterKey = `${bookNumber}:${chapter}`

  // 읽음 콜백은 memo 된 절에 내려가므로 참조를 흔들지 않게 ref 로 읽는다
  const mergedMemberIdsRef = useRef(mergedMemberIds)
  mergedMemberIdsRef.current = mergedMemberIds

  // ── 현황 조회 (로그인 시 항상) ──
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useChapterReadStatus(bookNumber, chapter, loggedIn)

  const readVerses = useMemo(() => {
    if (!status?.verses) return new Set<number>()
    return new Set(status.verses.filter((v) => v.is_read).map((v) => v.verse_id))
  }, [status])

  const totalVerses = status?.total_verses ?? 0
  const readCount = status?.read_verses ?? 0
  const unreadCount = Math.max(0, totalVerses - readCount)
  const progress = status?.progress ?? 0
  const isFullyRead = totalVerses > 0 && readCount >= totalVerses
  // 진행률 pill 분모는 장 전체 절 수 — 로드된 페이지(20절) 합계를 쓰면 첫 읽음이 1/20으로 보임
  const loadedVerseCount = chapterData?.pages.reduce((sum, page) => sum + page.verses.length, 0) ?? 0
  const pillTotal = totalVerses || chapterData?.pages[0]?.total_verses || loadedVerseCount

  // ── 완독 감시 (장마다 한 번) ──
  // 두 가지를 한 effect 에서 본다:
  //  1) 이 장의 모든 절이 읽혔으면 onChapterFullyRead 를 장당 1회 — 이미 다 읽힌 장을 다시 열어도
  //     부른다(플랜 일차의 마지막 장을 열람만 해도 자동 완료되는 동작).
  //  2) '안 읽음 → 다 읽음' 전환이 이 화면에서 일어났을 때만 플랜 캐시를 무효화 — 플랜 화면을
  //     거치지 않은 자유 읽기도 서버가 일차 완료를 동기화(get_today/get_detail)하게. 홈 카드 등
  //     비활성 쿼리는 stale 마크만 되고 돌아올 때 refetchOnMount 가 재조회한다.
  // 백엔드가 계산한 장 전체 기준(total_verses/read_verses)이라 페이지네이션과 무관하다.
  const completionRef = useRef<{ key: string; fired: boolean; wasFull: boolean | null }>({
    key: '',
    fired: false,
    wasFull: null,
  })
  useEffect(() => {
    if (completionRef.current.key !== chapterKey) {
      completionRef.current = { key: chapterKey, fired: false, wasFull: null }
    }
    if (!status) return
    const track = completionRef.current
    const prevFull = track.wasFull
    track.wasFull = isFullyRead
    if (prevFull === false && isFullyRead) {
      queryClient.invalidateQueries({ queryKey: biblePlanKeys.all })
    }
    if (isFullyRead && !track.fired && onChapterFullyRead) {
      track.fired = true
      onChapterFullyRead()
    }
  }, [chapterKey, status, isFullyRead, onChapterFullyRead, queryClient])

  // ── 본문 대기(hold) ──
  // 본문은 프리페치·24시간 캐시로 거의 즉시 오지만 읽음 상태는 네트워크를 탄다. 본문을 먼저
  // 그리면 읽은 절이 뒤늦게 일제히 흐려지며 화면이 툭 바뀌므로 아주 잠깐만 같이 기다린다.
  // 대기는 READ_STATUS_HOLD_MS 를 넘지 않고, 그 뒤엔 본문부터 그리고 도착 시 색만 입힌다.
  // 캐시가 있어 refetch 만 도는 경우(isLoading=false)는 기다리지 않는다.
  const statusPending = loggedIn && statusLoading
  const [holdExpiredKey, setHoldExpiredKey] = useState<string | null>(null)
  const holdExpired = holdExpiredKey === chapterKey
  useEffect(() => {
    if (!chapterData || !statusPending || holdExpired) return
    const id = window.setTimeout(() => setHoldExpiredKey(chapterKey), READ_STATUS_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [chapterData, statusPending, holdExpired, chapterKey])
  const holdingForReadStatus = !!chapterData && statusPending && !holdExpired
  const bodyRendered = !chapterLoading && !!chapterData && !holdingForReadStatus
  // 비로그인은 읽음 상태 쿼리가 꺼져 있어 '도착'으로 본다
  const readStatusReady = !loggedIn || !statusLoading

  // 진행률 pill 이 본문보다 늦게 도착하면 목록이 툭 밀린다 — 그 경우에만 높이를 펼치며 나타난다.
  // (읽음 상태가 캐시에 있어 본문과 함께 그려지면 그냥 정적으로 둔다)
  const [pillRevealKey, setPillRevealKey] = useState<string | null>(null)
  const pillReveal = pillRevealKey === chapterKey
  useEffect(() => {
    if (bodyRendered && !readStatusReady) setPillRevealKey(chapterKey)
  }, [bodyRendered, readStatusReady, chapterKey])

  // ── 절 읽음 처리 ──
  const markAsReadMutation = useMarkVerseAsRead()
  const unmarkAsReadMutation = useUnmarkVerseAsRead()
  // 묶음 처리로 mutateAsync 가 map 안에서 불려 deps 추적이 객체 단위로 넓어진다 —
  // 미리 꺼내 두면 콜백 참조가 안정적으로 유지된다(memo 된 절 재렌더 방지)
  const markVerse = markAsReadMutation.mutateAsync
  const unmarkVerse = unmarkAsReadMutation.mutateAsync
  // 수동 읽음 처리 중인 절 — 중복 클릭 방지 표시용
  const [togglingVerseId, setTogglingVerseId] = useState<number | null>(null)
  // 중복 클릭 가드는 ref 로 — togglingVerseId(state)를 읽으면 콜백 참조가 흔들린다
  const togglingGuardRef = useRef(false)

  /** 음성 낭독으로 읽음이 확인됐을 때 (similarity = 일치율) */
  const markVerseRead = useCallback(
    async (verseId: number, similarity: number) => {
      try {
        await settleReadCalls(
          (mergedMemberIdsRef.current.get(verseId) ?? [verseId]).map((id) =>
            markVerse({ verseId: id, similarity }),
          ),
        )
        celebrateFlowerBloom()
        await refetchStatus()
      } catch (error) {
        // 이미 읽음 처리된 경우는 에러로 처리하지 않음
        if (error instanceof Error && error.message === 'ALREADY_READ') {
          await refetchStatus()
        } else {
          console.error('Failed to save reading record:', error)
        }
      }
    },
    [markVerse, refetchStatus],
  )

  /**
   * 수동 읽음 처리/취소 — 음성 낭독 없이 상태만 바꾼다. 로그인한 사용자면 누구나.
   * similarity 는 수동 처리임을 뜻하는 1.0 으로 보낸다(백엔드 최소 임계값 0.75 충족).
   */
  const toggleVerseRead = useCallback(
    async (verse: BibleVerse, nextRead: boolean) => {
      if (togglingGuardRef.current) return
      togglingGuardRef.current = true
      setTogglingVerseId(verse.id)
      // '18-19'처럼 묶인 절은 묶음 전체를 한 번에 (안내 문구도 묶음 기준)
      const ids = mergedMemberIdsRef.current.get(verse.id) ?? [verse.id]
      const label = verse.verse_label || String(verse.verse)
      try {
        if (nextRead) {
          await settleReadCalls(ids.map((id) => markVerse({ verseId: id, similarity: 1 })))
          showToast(`${label}절을 읽음 처리했습니다`, 'success')
          onManualReadDone?.()
        } else {
          await settleReadCalls(ids.map((id) => unmarkVerse(id)))
          showToast(`${label}절 읽음을 취소했습니다`, 'info')
        }
        await refetchStatus()
      } catch (error) {
        // 이미 읽음 상태면 화면만 동기화하면 된다
        if (error instanceof Error && error.message === 'ALREADY_READ') {
          await refetchStatus()
        } else {
          console.error('Failed to toggle read state:', error)
          showToast(nextRead ? '읽음 처리에 실패했습니다' : '읽음 취소에 실패했습니다', 'error')
        }
      } finally {
        togglingGuardRef.current = false
        setTogglingVerseId(null)
      }
    },
    [markVerse, unmarkVerse, refetchStatus, onManualReadDone],
  )

  // ── 장 끝 일괄 읽음/취소 — 눈으로 끝까지 읽은 성도가 한 번에 완료 표시 (본인 계정) ──
  const markChapterMutation = useMarkChapterAsRead()
  const unmarkChapterMutation = useUnmarkChapterAsRead()
  const bulkPending = markChapterMutation.isPending || unmarkChapterMutation.isPending
  // 취소는 실수 방지 2탭 확인 — 한 번 탭하면 확인 문구로 바뀌고 3초 내 재탭 시 실행
  const [unmarkConfirmKey, setUnmarkConfirmKey] = useState<string | null>(null)
  const unmarkConfirming = unmarkConfirmKey === chapterKey
  const unmarkConfirmTimer = useRef<number | null>(null)
  const clearUnmarkConfirmTimer = () => {
    if (unmarkConfirmTimer.current) window.clearTimeout(unmarkConfirmTimer.current)
    unmarkConfirmTimer.current = null
  }
  // 장을 떠나거나 언마운트되면 남은 확인 타이머는 버린다
  useEffect(
    () => () => {
      if (unmarkConfirmTimer.current) window.clearTimeout(unmarkConfirmTimer.current)
      unmarkConfirmTimer.current = null
    },
    [chapterKey],
  )

  /**
   * 장 전체 읽음 — 장 끝 도장(ChapterSealStamp)은 꾹 누르기가 곧 확인이라 바로 실행한다.
   * 도장이 찍히는 연출이 완료 피드백이므로 꽃 효과·성공 토스트는 띄우지 않는다.
   */
  const stampChapter = async (): Promise<boolean> => {
    if (bulkPending) return false
    try {
      await markChapterMutation.mutateAsync({ bookNumber, chapter })
      await refetchStatus()
      return true
    } catch (error) {
      console.error('Failed to mark chapter read:', error)
      showToast('장 전체 읽음 처리에 실패했습니다', 'error')
      return false
    }
  }

  /** 장 전체 읽음 취소 — 첫 탭은 확인 문구, 3초 안의 두 번째 탭이 실행 */
  const unmarkChapterTap = async () => {
    if (bulkPending) return
    if (!unmarkConfirming) {
      clearUnmarkConfirmTimer()
      setUnmarkConfirmKey(chapterKey)
      unmarkConfirmTimer.current = window.setTimeout(() => setUnmarkConfirmKey(null), UNMARK_CONFIRM_MS)
      return
    }
    clearUnmarkConfirmTimer()
    setUnmarkConfirmKey(null)
    try {
      const res = await unmarkChapterMutation.mutateAsync({ bookNumber, chapter })
      showToast(`${res.deleted_records}개 읽음 기록을 취소했습니다`, 'info')
      await refetchStatus()
    } catch (error) {
      console.error('Failed to unmark chapter read:', error)
      showToast('장 전체 읽음 취소에 실패했습니다', 'error')
    }
  }

  return {
    /** 서버 읽음 현황이 도착했는지 — 장 끝 도장은 이 값이 있을 때만 */
    hasStatus: loggedIn && !!status,
    totalVerses,
    readCount,
    unreadCount,
    progress,
    pillTotal,
    isFullyRead,
    readVerses,
    readStatusReady,
    holdingForReadStatus,
    bodyRendered,
    pillReveal,
    togglingVerseId,
    markVerseRead,
    toggleVerseRead,
    stampChapter,
    unmarkChapterTap,
    unmarkConfirming,
    bulkPending,
  }
}
