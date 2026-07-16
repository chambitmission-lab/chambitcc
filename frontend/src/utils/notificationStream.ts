// 알림 SSE 스트림 싱글턴
// 5분 폴링을 대체한다 — 서버가 새 공지/개인 알림을 push하면 react-query
// 캐시를 invalidate해 목록·뱃지를 즉시 갱신한다.
// 연결이 끊기면 지수 백오프로 재연결하고, 그동안 useNotifications의
// 폴백 폴링(refetchInterval)이 다시 동작한다.
import type { QueryClient } from '@tanstack/react-query'
import { API_V1 } from '../config/api'
import { streamSSE } from '../api/sse'

const INITIAL_RETRY_MS = 5_000
const MAX_RETRY_MS = 60_000

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
    // notificationKeys.all과 동일한 키 — hooks 모듈과의 순환 import를 피해 리터럴 사용
    this.queryClient?.invalidateQueries({ queryKey: ['notifications'] })
  }

  private async loop(gen: number): Promise<void> {
    while (this.running && gen === this.generation) {
      const token = localStorage.getItem('access_token')
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
          (event) => {
            if (event === 'connected') {
              this.connected = true
              this.retryMs = INITIAL_RETRY_MS
              // 끊겨 있던 사이의 변경분 동기화
              this.invalidate()
            } else if (event === 'notification' || event === 'refresh') {
              this.invalidate()
            }
          },
        )
      } catch {
        // 네트워크 오류 / 서버 재시작 / abort — 아래 백오프 후 재연결
      }

      this.connected = false
      if (!this.running) break

      await new Promise((resolve) => setTimeout(resolve, this.retryMs))
      this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS)
    }
  }
}

export const notificationStream = new NotificationStreamManager()
