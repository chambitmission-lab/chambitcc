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

// 절 길이 3단계 — 핵심 절 박스가 길이에 따라 글자만 줄이고 장면은 유지하는지 확인용
const VERSE_SAMPLES = [
  {
    key: '짧게',
    reference: '창세기 2:18',
    text: '여호와 하나님이 이르시되 사람이 혼자 사는 것이 좋지 아니하니',
  },
  {
    key: '길게',
    reference: '갈라디아서 1:10',
    text:
      '이제 내가 사람들에게 좋게 하랴 하나님께 좋게 하랴 사람들에게 기쁨을 구하랴 ' +
      '내가 지금까지 사람들의 기쁨을 구하였다면 그리스도의 종이 아니니라',
  },
  {
    key: '아주 길게',
    reference: '에베소서 1:3-4',
    text:
      '찬송하리로다 하나님 곧 우리 주 예수 그리스도의 아버지께서 그리스도 안에서 ' +
      '하늘에 속한 모든 신령한 복을 우리에게 주시되 곧 창세 전에 그리스도 안에서 ' +
      '우리를 택하사 우리로 사랑 안에서 그 앞에 거룩하고 흠이 없게 하시려고',
  },
]

const DailyMeditationCardPreview = () => {
  const qc = useQueryClient()
  const [sample, setSample] = useState(0)
  // 로딩 재현 — 캐시를 지우고 카드를 다시 마운트해 기다림 유머 대기부터 본다.
  // 실제 요청이 나가므로 백엔드가 떠 있거나, 헤드리스 검증처럼 /meditation/today 를 지연 목으로 받아야 한다.
  const [mountKey, setMountKey] = useState(0)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const replayLoading = () => {
    qc.removeQueries({ queryKey: ['meditation', 'today'] })
    setLoadingDemo(true)
    setMountKey((k) => k + 1)
  }

  useEffect(() => {
    if (loadingDemo) return
    const now = new Date()
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const s = VERSE_SAMPLES[sample]
    qc.setQueryData(['meditation', 'today', dateKey, deriveTimeOfDay(now.getHours()), null], {
      ...MOCK,
      verse: { ...MOCK.verse, reference: s.reference, text: s.text },
    })
  }, [qc, sample, loadingDemo])

  // 캐시가 채워지기 전 첫 프레임은 카드 자체의 스켈레톤이 받는다
  return (
    <div className="home" style={{ maxWidth: 480, margin: '0 auto', paddingTop: 12 }}>
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
        {VERSE_SAMPLES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setLoadingDemo(false)
              setSample(i)
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid var(--brand-soft-strong)',
              background: i === sample ? 'var(--brand)' : 'transparent',
              color: i === sample ? '#fff' : 'var(--brand)',
            }}
          >
            {s.key}
          </button>
        ))}
        <button
          type="button"
          onClick={replayLoading}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            border: '1px solid var(--brand-soft-strong)',
            color: 'var(--brand)',
          }}
        >
          로딩 재현
        </button>
      </div>
      <DailyMeditationCard key={mountKey} onWriteMeditation={() => {}} />
    </div>
  )
}

export default DailyMeditationCardPreview
