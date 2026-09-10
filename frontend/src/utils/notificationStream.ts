// 실시간 SSE 스트림 싱글턴 (/notifications/stream 하나로 알림 + 기도 반응)
// 5분 폴링을 대체한다 — 서버가 새 공지/개인 알림을 push하면 react-query
// 캐시를 invalidate해 목록·뱃지를 즉시 갱신하고, 기도 반응(prayer_reaction)·
// 댓글(prayer_reply) 이벤트는 피드·상세 캐시의 카운트만 서버 값으로 덮어쓴다.
// 연결이 끊기면 지수 백오프로 재연결하고, 그동안 useNotifications의
// 폴백 폴링(refetchInterval)이 다시 동작한다.
import type { QueryClient } from '@tanstack/react-query'
import { API_V1 } from '../config/api'
import { streamSSE } from '../api/sse'
import type { Prayer } from '../types/prayer'
import type { PrayerListCache } from '../types/queryCache'
import { trimInfiniteQuery } from './infiniteQueryTrim'
import { tokenStore } from './tokenStore'
import { prayerKeys } from '../hooks/usePrayersQuery'

const INITIAL_RETRY_MS = 5_000
const MAX_RETRY_MS = 60_000

/**
 * 재연결 대기 시간에 ±50% 흔들림을 준다. 서버가 재시작(재배포)되면 연결돼 있던 모두가
 * 같은 순간 끊기는데, 지터가 없으면 정확히 5초 뒤 전원이 동시에 다시 붙고 그 즉시
 * 'connected' 처리(알림 invalidate·홈 live 재조회·하트비트 재전송)까지 한꺼번에 몰린다.
 */
const jitter = (ms: number): number => Math.round(ms * (0.5 + Math.random()))

/** 스트림 이벤트 구독자 — data 는 SSE data 라인 원문(JSON 문자열) */
export type StreamEventHandler = (data: string) => void

class NotificationStreamManager {
  /** 현재 SSE 연결 여부 — useNotifications가 폴백 폴링 여부를 결정하는 데 사용 */
  connected = false

  private running = false
  private controller: AbortController | null = null
  private retryMs = INITIAL_RETRY_MS
  private queryClient: QueryClient | null = null
  // stop() 직후 start() 되어도(StrictMode의 mount→cleanup→mount 등)
  // 이전 루프가 계속 돌지 않도록 세대 번호로 구분한다
  private generation = 0
  // 기능별 이벤트 구독자 — 알림/기도 반응은 이 클래스가 직접 처리하지만, 그 밖의
  // 이벤트(함께 읽기 presence, 절 묵상 등)는 각 기능 모듈이 on() 으로 붙인다.
  // 새 실시간 기능마다 이 파일을 고치지 않게 하기 위한 확장점(OCP).
  private handlers = new Map<string, Set<StreamEventHandler>>()

  /**
   * 이벤트 구독. 'connected' 도 구독할 수 있다(재연결 직후 상태를 다시 보내야 하는 기능용).
   * 반환값을 호출하면 해제된다. 연결 여부와 무관하게 언제든 등록 가능.
   */
  on(event: string, handler: StreamEventHandler): () => void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
    return () => {
      set?.delete(handler)
      if (set && set.size === 0) this.handlers.delete(event)
    }
  }

  private dispatch(event: string, data: string): void {
    const set = this.handlers.get(event)
    if (!set) return
    for (const handler of set) {
      try {
        handler(data)
      } catch (err) {
        // 한 구독자의 오류가 다른 구독자·스트림 루프를 죽이면 안 된다
        console.error(`[stream] handler for "${event}" failed`, err)
      }
    }
  }

  start(queryClient: QueryClient): void {
    this.queryClient = queryClient
    if (this.running) return
    this.running = true
    this.retryMs = INITIAL_RETRY_MS
    void this.loop(++this.generation)
  }

  stop(): void {
    this.running = false
    this.connected = false
    this.controller?.abort()
    this.controller = null
  }

  private invalidate(): void {
    if (!this.queryClient) return
    // notificationKeys.all과 동일한 키 — hooks 모듈과의 순환 import를 피해 리터럴 사용.
    // 무한 목록은 invalidate 시 받은 페이지 전부를 순차 재요청하므로 앞 2페이지만 남기고 자른다
    trimInfiniteQuery(this.queryClient, ['notifications', 'infinite'], 2)
    this.queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  /** 다른 사용자의 기도 반응/댓글 — 캐시된 카운트만 서버 값으로 동기화한다.
   * is_prayed 같은 사용자별 상태는 건드리지 않고, refetch 없이 setQueryData만
   * 쓰므로 네트워크 비용도 없다. 관심순 재정렬은 하지 않는다 — 읽는 중인
   * 피드의 행이 갑자기 자리를 바꾸면 오히려 방해라서 다음 refetch에 맡긴다. */
  private applyPrayerCount(event: 'prayer_reaction' | 'prayer_reply', payload: string): void {
    if (!this.queryClient) return

    const field = event === 'prayer_reaction' ? 'prayer_count' : 'reply_count'
    let prayerId: number
    let count: number
    try {
      const data = JSON.parse(payload)
      prayerId = data.prayer_id
      count = data[field]
    } catch {
      return
    }
    if (typeof prayerId !== 'number' || typeof count !== 'number') return

    // 기도 목록(무한 스크롤) 캐시 — prayerKeys.lists()와 동일한 리터럴 키
    this.queryClient.setQueriesData<PrayerListCache>(
      { queryKey: prayerKeys.lists() },
      (old) => {
        if (!old?.pages) return old
        let touched = false
        const pages = old.pages.map((page) => {
          const items = page?.data?.items
          if (!items?.some((p) => p.id === prayerId && p[field] !== count)) {
            return page
          }
          touched = true
          return {
            ...page,
            data: {
              ...page.data,
              items: items.map((p) =>
                p.id === prayerId ? { ...p, [field]: count } : p,
              ),
            },
          }
        })
        return touched ? { ...old, pages } : old
      },
    )

    // 기도 상세 캐시
    this.queryClient.setQueriesData<Prayer>(
      { queryKey: prayerKeys.details() },
      (old) => {
        if (!old || old.id !== prayerId || old[field] === count) return old
        return { ...old, [field]: count }
      },
    )
  }

  private async loop(gen: number): Promise<void> {
    while (this.running && gen === this.generation) {
      const token = tokenStore.getAccess()
      if (!token) {
        // 로그아웃 상태 — 연결하지 않고 종료 (로그인 시 start가 다시 호출됨)
        this.running = false
        break
      }

      this.controller = new AbortController()
      try {
        await streamSSE(
          `${API_V1}/notifications/stream`,
          { signal: this.controller.signal },
          (event, data) => {
            if (event === 'connected') {
              this.connected = true
              this.retryMs = INITIAL_RETRY_MS
              // 끊겨 있던 사이의 변경분 동기화
              this.invalidate()
            } else if (event === 'notification' || event === 'refresh') {
              this.invalidate()
            } else if (event === 'prayer_reaction' || event === 'prayer_reply') {
              this.applyPrayerCount(event, data)
            }
            this.dispatch(event, data)
          },
        )
      } catch {
        // 네트워크 오류 / 서버 재시작 / abort — 아래 백오프 후 재연결
      }

      this.connected = false
      if (!this.running) break

      await new Promise((resolve) => setTimeout(resolve, jitter(this.retryMs)))
      this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS)
    }
  }
}

export const notificationStream = new NotificationStreamManager()
