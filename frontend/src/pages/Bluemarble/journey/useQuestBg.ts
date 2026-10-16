// 발자취 지도 배경(테마별 성지 조감도) — 본 화면(JourneyView)과 준비 중 스켈레톤이 같은 그림을 깐다.
// 그래야 상태 응답이 도착해 본 화면으로 바뀌는 순간 배경이 꺼졌다 켜지지 않는다.
import type { CSSProperties } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
import { QUEST_MAP_MOBILE, QUEST_MAP_PC } from '../../../utils/themeAssets'

export const useQuestBgStyle = (): CSSProperties => {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const pc = dark ? QUEST_MAP_PC.dark : QUEST_MAP_PC.light
  const m = dark ? QUEST_MAP_MOBILE.dark : QUEST_MAP_MOBILE.light
  return { ['--qj-bg' as string]: `url(${pc})`, ['--qj-bg-m' as string]: `url(${m})` } as CSSProperties
}
