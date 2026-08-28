// 개발 전용 미리보기 (/dev/meditation-card, DEV 빌드에서만 라우팅) —
// 백엔드 없이 홈 묵상 카드의 완성형 레이아웃(히어로·여정·핵심 절·질문·CTA)을 바로 확인한다.
// 오늘 묵상 쿼리 키에 목 데이터를 심어 카드가 실데이터처럼 그려지게 한다.
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DailyMeditationCard from './DailyMeditationCard'
import { deriveTimeOfDay } from '../../../hooks/useDailyMeditation'
import type { MeditationCard } from '../../../types/meditation'
import '../Home.css'

const MOCK: MeditationCard = {
  plan_name: '올해 말씀 여정',
  plan_code: 'annual',
  day_number: 240,
  total_days: 365,
  season: 'ordinary',
  passage: {
    label: '창세기 2:1-25',
    book_number: 1,
    chapter: 2,
    verse_start: 1,
    verse_end: 25,
    theme: '안식과 사람',
  },
  verse: {
    reference: '창세기 2:18',
    text: '여호와 하나님이 이르시되 사람이 혼자 사는 것이 좋지 아니하니',
    book_number: 1,
    chapter: 2,
    verse: 18,
  },
  meditation_question:
    '내 외로움을 하나님께 정직하게 가져가고 있습니까, 혼자 해결하려 하고 있습니까?',
  redemptive_note: null,
  context: { time_of_day: null, emotion: null, selected_at: new Date().toISOString() },
}

const DailyMeditationCardPreview = () => {
  const qc = useQueryClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const now = new Date()
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    qc.setQueryData(['meditation', 'today', dateKey, deriveTimeOfDay(now.getHours()), null], MOCK)
    setReady(true)
  }, [qc])

  if (!ready) return null
  return (
    <div className="home" style={{ maxWidth: 480, margin: '0 auto', paddingTop: 12 }}>
      <DailyMeditationCard onWriteMeditation={() => {}} />
    </div>
  )
}

export default DailyMeditationCardPreview
