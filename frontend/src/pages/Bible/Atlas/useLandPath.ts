import { useEffect, useState } from 'react'

/**
 * 해안선(LAND_PATH) 동적 로드.
 *
 * 왜 나눠 받는가 — 해안선은 38KB 문자열 하나다. 지도 청크에 같이 들어 있으면
 * 바다·경로·핀처럼 "먼저 보여 줄 수 있는 것"까지 그 38KB 를 다 받고 파싱한
 * 뒤에야 그려진다. 배경 그림 하나 때문에 첫 페인트를 붙잡을 이유가 없다.
 *
 * 이 모듈을 import 하는 순간(= 지도 청크가 평가되는 순간) 요청이 시작된다.
 * 그래서 React 렌더를 기다리지 않고, 도크·레일의 유휴 프리패치로 지도 청크를
 * 미리 받아 둔 경우엔 해안선까지 같이 데워져 진입 시 한 번에 완성된 지도가 뜬다.
 *
 * 한 번 받은 뒤엔 동기로 값을 돌려준다 — 여정을 바꾸거나 카드를 다시 열 때
 * 해안선이 다시 깜빡이면 안 된다.
 */
let cached: string | null = null

const loading = import('./data/landPath')
  .then((m) => {
    cached = m.LAND_PATH
    return cached
  })
  .catch(() => null) // 실패해도 지도는 바다·핀만으로 읽힌다

export const useLandPath = (): string | null => {
  const [path, setPath] = useState<string | null>(cached)

  useEffect(() => {
    if (cached) return
    let alive = true
    void loading.then((value) => {
      if (alive && value) setPath(value)
    })
    return () => {
      alive = false
    }
  }, [])

  return path
}
