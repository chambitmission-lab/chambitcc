import type { TodayResponse } from '../types/biblePlan'
import type { DailyVerseResponse } from '../types/dailyVerse'
import type { ElectionSummary } from '../types/election'
import type { MeditationCard } from '../types/meditation'
import type { Notification } from '../types/notification'
import type { GroupListResponse } from '../types/prayer'
import type { SurveySummary } from '../types/survey'
import type { WeeklyPrayer } from '../types/weeklyPrayer'
import type { IntercessionState } from './intercession'
import type { SermonTakeaway } from './sermonTakeaway'
import type { TodayChurch } from './todayChurch'
import { request } from './utils/request'

/**
 * 홈 묶음 — 홈 위젯들이 따로 보내던 요청을 한 번에. 각 조각은 단건 엔드포인트의 응답과 같은 모양이라
 * hooks/useHomeSummary 가 단건 쿼리 키에 그대로 심는다. 실패한 조각은 null + `failed` 에 이름이 담기고,
 * 단건이 404 로 답하는 '없음'(현재 말씀·이번 주 기도제목·통독표 없음)은 null 이지만 failed 가 아니다.
 */
export interface HomeSummary {
  /** 서버 KST 날짜 + 서버가 고른 시간대의 카드 — 프론트가 같은 키를 만들 때만 심는다 */
  meditation: { date: string; card: MeditationCard } | null
  plan_today: TodayResponse | null
  sermon_takeaways: { items: SermonTakeaway[] } | null
  daily_verse: DailyVerseResponse | null
  weekly_prayer: WeeklyPrayer | null
  answered_total: number | null
  intercession: IntercessionState | null
  survey_banner: SurveySummary | null
  elections: ElectionSummary[] | null
  popup_notices: Notification[] | null
  my_groups: GroupListResponse | null
  today_church: TodayChurch | null
  failed: string[]
}

export const getHomeSummary = async (): Promise<HomeSummary> => {
  const res = await request<{ success: boolean; data: HomeSummary }>('/home/summary', {
    auth: 'required',
    // 홈의 첫 요청 — 기도 목록과 함께 줄을 서지 않고 바로 나간다(utils/requestPriority)
    priority: 'critical',
    errorMessage: '홈 정보를 불러오지 못했습니다',
  })
  return res.data
}
