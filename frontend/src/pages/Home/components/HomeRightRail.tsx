// 홈 PC 우측 위젯 레일 — 넓은 화면에서만 붙는 세 번째 컬럼.
// 기도 현황 · 기도 태그 · 말씀 알림 배너 · 오늘의 일정 · 말씀 카드 배너.
//
// 기도 현황·태그는 /prayers/stats/weekly (이번주 KST 실측 집계, 백엔드 배포 필요)를
// 쓰고, 구버전 백엔드(404)면 기존 누적 통계 + 큐레이션 태그로 자동 폴백한다.

import { ActionBentoWidget } from './rail/ActionBentoWidget'
import { PersonalPickWidget } from './rail/PersonalPickWidget'
import { PrayerStatsWidget } from './rail/PrayerStatsWidget'
import { SituationTagsWidget } from './rail/SituationTagsWidget'
import { TodayScheduleWidget } from './rail/TodayScheduleWidget'


// ── 레일 본체 ─────────────────────────────────────────────────────────

const HomeRightRail = () => (
  <>
    <PrayerStatsWidget />
    <SituationTagsWidget />
    <PersonalPickWidget />
    <ActionBentoWidget />
    <TodayScheduleWidget />
  </>
)

export default HomeRightRail
