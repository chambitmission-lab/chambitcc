// 홈 "지금 함께 읽는 말씀" — 붐비는 장 현황 훅 + SSE 동기화
//
// 흐름: 홈 진입 시 GET 한 번(live + today) → 이후 서버가 장 인원 변화를 10초 단위로 묶어
//       전체 방송(SSE `reading_live`) → 이 훅이 React Query 캐시의 live 만 갈아끼운다.
//       today(오늘 최다 장)는 천천히 변하는 값이라 GET 값을 지키고 staleTime 으로 새로 받는다.
//
// 폴링이 아니라 SSE 인 이유: 로그인 사용자는 이미 전역 스트림 하나를 물고 있어 연결이 늘지
// 않고, 변화가 없으면 아무것도 안 오니 접속자 × 30초 폴링보다 항상 적다. 비로그인은 스트림이
// 없어 60초 폴링으로 대신한다(홈에 비로그인이 머무는 일은 드물다).
import { useEffect } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getLiveReading, type LiveReading, type LiveReadingEvent } from '../api/biblePresence'
import { notificationStream } from '../utils/notificationStream'
import { readingTogetherKeys } from './queryKeys'

const applyLiveEvent = (qc: QueryClient, ev: LiveReadingEvent) => {
  qc.setQueryData<LiveReading>(readingTogetherKeys.live(), (old) => {
    // 방송은 모두에게 같은 값이라 me_included 가 없다 — GET 이 알려 준 내 포함 여부를
    // 같은 장에 한해 이어 간다(다른 탭에서 읽는 중인 나를 "지금 1명"으로 세지 않게).
    const mine = new Set(
      (old?.live ?? []).filter((c) => c.me_included).map((c) => `${c.book_number}:${c.chapter}`),
    )
    const live = ev.live.map((c) => ({
      ...c,
      me_included: c.me_included ?? mine.has(`${c.book_number}:${c.chapter}`),
    }))
    return { live, today: old?.today ?? [] }
  })
}

let subscribers = 0
let unsubscribe: (() => void) | null = null

/** 홈 카드가 떠 있는 동안만 스트림 핸들러를 붙인다(카드 여러 개여도 한 번). */
const useLiveStream = (qc: QueryClient, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return
    subscribers += 1
    if (subscribers === 1) {
      const offLive = notificationStream.on('reading_live', (raw) => {
        try {
          applyLiveEvent(qc, JSON.parse(raw) as LiveReadingEvent)
        } catch {
          /* 깨진 페이로드는 무시 — 다음 방송이 바로잡는다 */
        }
      })
      // 재연결 직후엔 끊긴 사이의 방송을 놓쳤을 수 있다 — 한 번 새로 받는다
      const offConnected = notificationStream.on('connected', () => {
        void qc.invalidateQueries({ queryKey: readingTogetherKeys.live() })
      })
      unsubscribe = () => {
        offLive()
        offConnected()
      }
    }
    return () => {
      subscribers -= 1
      if (subscribers === 0) {
        unsubscribe?.()
        unsubscribe = null
      }
    }
  }, [qc, enabled])
}

/**
 * @param authed 로그인 여부 — 스트림이 있으면 SSE, 없으면 폴링
 */
export const useLiveReading = (authed: boolean) => {
  const qc = useQueryClient()
  useLiveStream(qc, authed)
  return useQuery({
    queryKey: readingTogetherKeys.live(),
    queryFn: getLiveReading,
    // 실시간 값 — persist 복원분·이전 방문의 화석을 그리지 않고 진입마다 새로 받는다
    staleTime: 60_000,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchInterval: authed ? false : 60_000,
    refetchIntervalInBackground: false,
  })
}
