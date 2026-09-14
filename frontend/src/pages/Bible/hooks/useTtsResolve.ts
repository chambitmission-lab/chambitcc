import { useQuery } from '@tanstack/react-query'
import { fetchTtsResolve } from '../../../api/bibleTts'
import type { BibleTTSVoice } from '../../../types/bible'

interface UseTtsResolveOptions {
  bookNumber: number
  chapter: number
  voice: BibleTTSVoice
  enabled?: boolean
  /** 사전 생성(prewarm)을 걸어 둔 다음 장 — 캐시 URL 이 생길 때까지 몇 초 간격으로 다시 묻는다 */
  pollUntilCached?: boolean
}

const POLL_MS = 5000

/**
 * 장 오디오북의 캐시 상태(R2 직접 URL + 절 타이밍)를 장을 여는 시점에 미리 받아 둔다.
 * 재생 버튼을 누르면 백엔드 307 왕복 없이 R2 mp3 를 곧장 재생하고, 타이밍도 요청 없이 붙는다.
 *
 * - URL 은 본문 해시 기반이라 세션 안에선 사실상 불변 → staleTime 1시간
 * - persist 는 제외(main.tsx) — 본문 수정으로 파일이 바뀐 뒤 옛 URL 이 며칠씩 복원되지 않게
 */
export const useTtsResolve = ({ bookNumber, chapter, voice, enabled = true, pollUntilCached = false }: UseTtsResolveOptions) => {
  const { data } = useQuery({
    queryKey: ['bibleTts', 'resolve', bookNumber, chapter, voice],
    queryFn: ({ signal }) => fetchTtsResolve(bookNumber, chapter, voice, signal),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    refetchInterval: (query) =>
      pollUntilCached && query.state.data && !query.state.data.url ? POLL_MS : false,
  })
  return data
}
