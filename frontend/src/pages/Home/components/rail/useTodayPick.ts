// 참비의 오늘 추천 — 추천 근거와 오늘의 한 절. 추천 카드와 '오늘의 한 걸음'이 함께 쓴다.
//
// 개인화 근거 우선순위: ① 내 최근 기도의 감정 태그 → ② 이번주 성도들 1위 감정 → ③ 기본 카테고리.
// 감정은 상황별 성구 카테고리(emotion_keys)로 이어지고, 그 카테고리 구절 중 하나를
// 날짜 기준으로 고정 선택해 하루 동안 같은 말씀이 유지되게 한다. 백엔드 무변경.

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { NavigateFunction } from 'react-router-dom'
import { fetchPrayers } from '../../../../api/prayer'
import { useHomeRailPending } from '../../../../hooks/useHomeRail'
import { prayerKeys } from '../../../../hooks/usePrayersQuery'
import { useSituationCategories, useSituationVerses } from '../../../../hooks/useSituation'
import type { SituationCategory, SituationVerse } from '../../../../types/situation'
import { tokenStore } from '../../../../utils/tokenStore'
import { useWeeklyPrayerStats } from './queries'
import { markTodayStep } from './todaySteps'

// 내 최근 기도 1건 — 로그인 사용자만. 감정 태그와 날짜(오늘 기도했는지)만 쓴다.
// 홈 레일 묶음(useHomeRail)이 같은 키에 심어 줄 때까지 단건 요청은 미룬다.
const useMyLatestPrayer = () => {
  const railPending = useHomeRailPending()
  const loggedIn = !!tokenStore.getAccess()
  return useQuery({
    queryKey: prayerKeys.mineLatest(),
    queryFn: async () => {
      const res = await fetchPrayers(1, 1, 'latest', null, 'my_prayers')
      return res.data.items[0] ?? null
    },
    enabled: loggedIn && !railPending,
    staleTime: 1000 * 60 * 10,
  })
}

const dayOfYear = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

const useTodayPick = () => {
  const railPending = useHomeRailPending()
  const { data: myPrayer } = useMyLatestPrayer()
  const weekly = useWeeklyPrayerStats()
  // 아래 category 규칙은 서버(home_rail_service.pick_category)와 같아 묶음이 심은 구절 키와 맞는다.
  const { data: categories = [] } = useSituationCategories(!railPending)

  // 근거 결정 — 어떤 감정으로 추천했는지 카드에 그대로 밝힌다(블랙박스 금지)
  const basis = useMemo<{ emotion: string | null; source: 'mine' | 'week' | 'default' }>(() => {
    if (myPrayer?.emotion) return { emotion: myPrayer.emotion, source: 'mine' }
    const top = weekly.data?.emotions?.[0]?.emotion
    if (top) return { emotion: top, source: 'week' }
    return { emotion: null, source: 'default' }
  }, [myPrayer, weekly.data])

  const category = useMemo<SituationCategory | undefined>(() => {
    const withVerses = categories.filter((c) => c.verse_count > 0)
    if (basis.emotion) {
      const hit = withVerses.find((c) => c.emotion_keys?.includes(basis.emotion!))
      if (hit) return hit
    }
    return withVerses.find((c) => c.is_default) ?? withVerses[0]
  }, [categories, basis])

  const { data: withVerses, isLoading } = useSituationVerses(category?.id ?? 0, !!category)
  const verse = useMemo<SituationVerse | null>(() => {
    const list = withVerses?.verses ?? []
    if (list.length === 0) return null
    return list[dayOfYear() % list.length]
  }, [withVerses])

  return { basis, category, verse, isLoading }
}

const verseRef = (verse: SituationVerse) => `${verse.book_name_ko} ${verse.chapter}:${verse.verse}`

/** 추천 말씀 읽으러 가기 — 오늘의 걸음에도 적는다 */
const goReadPick = (navigate: NavigateFunction, verse: SituationVerse) => {
  markTodayStep('read')
  navigate(`/bible/${verse.book_number}/${verse.chapter}${verse.verse > 0 ? `?verse=${verse.verse}` : ''}`)
}

/** 말씀 카드 만들기 — 추천 말씀이 있으면 그 절을 미리 얹어 연다 */
const goMakeCard = (navigate: NavigateFunction, verse: SituationVerse | null) => {
  markTodayStep('card')
  navigate(
    '/bible/photo-verse',
    verse ? { state: { presetVerse: { text: verse.text, refLabel: verseRef(verse) } } } : undefined,
  )
}

export { useTodayPick, useMyLatestPrayer, verseRef, goReadPick, goMakeCard }
