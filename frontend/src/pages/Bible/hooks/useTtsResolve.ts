import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTtsResolve } from '../../../api/bibleTts'
import { bibleTtsKeys } from '../../../hooks/queryKeys'
import type { BibleTTSVoice } from '../../../types/bible'

interface UseTtsResolveOptions {
  bookNumber: number
  chapter: number
  voice: BibleTTSVoice
  enabled?: boolean
  /** 사전 생성(prewarm)을 걸어 둔 다음 장 — 캐시 URL 이 생길 때까지 몇 초 간격으로 다시 묻는다 */
  pollUntilCached?: boolean
}

/**
 * 사전 생성 확인 간격 — 합성은 보통 1분 안에 끝나니 처음엔 촘촘히, 길어지면 띄엄띄엄 묻고
 * 다 돌면(≈3분) 그만 묻는다. 예전엔 5초 고정에 상한이 없어, 합성이 실패하면(서버는 실패를
 * 알려 주지 않아 url 이 영영 null) 장이 끝날 때까지 5초마다 본문 조회 + R2 head 가 나갔다.
 * 상한에 걸려도 재생엔 지장 없다 — 다음 장은 스트리밍 엔드포인트로 그냥 이어진다.
 */
const POLL_SCHEDULE_MS = [5_000, 5_000, 5_000, 10_000, 10_000, 15_000, 20_000, 30_000, 30_000, 30_000, 30_000]

/**
 * 장 오디오북의 캐시 상태(R2 직접 URL + 절 타이밍)를 장을 여는 시점에 미리 받아 둔다.
 * 재생 버튼을 누르면 백엔드 307 왕복 없이 R2 mp3 를 곧장 재생하고, 타이밍도 요청 없이 붙는다.
 *
 * - URL 은 본문 해시 기반이라 세션 안에선 사실상 불변 → staleTime 1시간
 * - persist 는 제외(main.tsx) — 본문 수정으로 파일이 바뀐 뒤 옛 URL 이 며칠씩 복원되지 않게
 */
export const useTtsResolve = ({ bookNumber, chapter, voice, enabled = true, pollUntilCached = false }: UseTtsResolveOptions) => {
  // 몇 번째 확인인지는 성공 응답 횟수(dataUpdateCount)로 센다 — refetchInterval 함수는 상태가
  // 바뀔 때마다(요청 시작·응답) 다시 평가되므로 그 안에서 세면 두 배로 센다. 기준점은 폴링을
  // 시작한 시점의 값(캐시에 이미 있던 장은 0부터가 아니다). 장·음성이 바뀌면 처음부터.
  const baseRef = useRef<number | null>(null)
  useEffect(() => {
    baseRef.current = null
  }, [bookNumber, chapter, voice, pollUntilCached])

  const { data } = useQuery({
    queryKey: bibleTtsKeys.resolve(bookNumber, chapter, voice),
    queryFn: ({ signal }) => fetchTtsResolve(bookNumber, chapter, voice, signal),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    refetchInterval: (query) => {
      if (!pollUntilCached || !query.state.data || query.state.data.url) return false
      const count = query.state.dataUpdateCount
      if (baseRef.current === null) baseRef.current = count
      return POLL_SCHEDULE_MS[count - baseRef.current] ?? false
    },
  })
  return data
}
