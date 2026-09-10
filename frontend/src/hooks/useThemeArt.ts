// 테마별 배경 삽화를 쓰는 컴포넌트용 훅 — themeAssets.ts 의 컴포넌트 쪽 손잡이.
//
// 마운트 동안 쌍을 "지금 화면에 떠 있음" 으로 등록해 토글 직전 선요청(ThemeContext)이
// 반대 테마 파일을 챙기게 하고, 현재 테마 파일을 받아(반대 테마는 유휴 시간에) 도착 여부를
// 돌려준다. 돌려준 값은 첫 표시 페이드인(is-loaded 류 클래스)에 쓴다 — 이미 받아 둔 파일이면
// 첫 렌더부터 true 라 페이드를 건너뛴다.
import { useEffect, useState } from 'react'
import { isPairWarm, registerThemePair, warmPair, type ThemePair } from '../utils/themeAssets'

export const useThemeArt = (pair: ThemePair, active = true): boolean => {
  const [ready, setReady] = useState(() => active && isPairWarm(pair))

  useEffect(() => {
    if (!active) return
    const unregister = registerThemePair(pair)
    let alive = true
    void warmPair(pair).then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
      unregister()
    }
  }, [pair, active])

  return active && ready
}
