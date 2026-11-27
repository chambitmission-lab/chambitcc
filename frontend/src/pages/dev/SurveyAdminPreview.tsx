// /dev/surveys-admin — 설문 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 SurveyDesk 를 표본으로 띄운다. 상태 바꾸기·삭제는 이 화면 안에서만 바뀌고
// (서버 호출 없음), 수정·새 설문은 토스트로만 알린다. 결과 통계·응답은 React Query 캐시에 미리 심는다.
// 마감일 지난 '진행' 설문·작성 중·응답 0건 표본 포함.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import SurveyDesk from '../Admin/components/SurveyDesk'
import SurveyResultsPanel from '../Admin/components/SurveyResultsPanel'
import { filterSurveys } from '../Admin/components/surveyDeskUtils'
import { surveyKeys } from '../../hooks/useSurvey'
import type { SurveyResponseResult, SurveyStats, SurveySummary } from '../../types/survey'
import { showToast } from '../../utils/toast'

const iso = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}

let seq = 0
const sv = (title: string, p: Partial<SurveySummary> = {}): SurveySummary => ({
  id: ++seq,
  title,
  description: null,
  status: 'open',
  starts_at: null,
  ends_at: null,
  is_result_public: false,
  allow_edit: true,
  show_on_home: false,
  display_order: seq,
  question_count: 5,
  response_count: 0,
  created_at: iso(-14),
  ...p,
})

const SEED: SurveySummary[] = [
  sv('2027 여름 수련회 장소 투표', { description: '세 곳 중 가장 가고 싶은 곳을 골라 주세요.', ends_at: iso(5), show_on_home: true, is_result_public: true, response_count: 48, question_count: 3 }),
  sv('주일 점심 식단 만족도', { ends_at: iso(0), response_count: 112, question_count: 6 }),
  sv('성탄 칸타타 참여 신청', { ends_at: iso(-3), show_on_home: true, response_count: 27 }),
  sv('새가족 환영회 의견', { status: 'draft', question_count: 4 }),
  sv('주차장 이용 실태 조사', { status: 'draft', question_count: 0 }),
  sv('2026 가을 바자회 후기', { status: 'closed', ends_at: iso(-40), response_count: 63, is_result_public: true }),
]

const STATS = (s: SurveySummary): SurveyStats => ({
  survey_id: s.id,
  title: s.title,
  status: s.status,
  response_count: s.response_count,
  questions: [
    {
      question_id: 1,
      type: 'single',
      title: '가장 가고 싶은 곳은?',
      is_required: true,
      answered_count: s.response_count,
      options: [
        { id: 'a', label: '가평 청소년수련원', count: Math.round(s.response_count * 0.5), percent: 50 },
        { id: 'b', label: '양평 기도원', count: Math.round(s.response_count * 0.3), percent: 30 },
        { id: 'c', label: '속초 콘도', count: Math.round(s.response_count * 0.2), percent: 20 },
      ],
      texts: [],
    },
    {
      question_id: 2,
      type: 'long',
      title: '바라는 점',
      is_required: false,
      answered_count: 2,
      options: [],
      texts: [
        { response_id: 1, user_name: '김은혜', value: '아이들과 함께 갈 수 있으면 좋겠어요.' },
        { response_id: 2, user_name: '박소망', value: '물놀이 시간이 있으면 좋겠습니다!' },
      ],
    },
  ],
})

const RESPONSES = (s: SurveySummary): SurveyResponseResult[] =>
  ['김은혜', '박소망', '이믿음', '최사랑'].slice(0, Math.min(4, s.response_count)).map((user_name, i) => ({
    id: s.id * 100 + i,
    survey_id: s.id,
    user_name,
    created_at: iso(-i - 1),
    answers: [{ question_id: 1, option_ids: ['a'] }],
  }))

const SurveyAdminPreview = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [surveys, setSurveys] = useState(SEED)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // 결과 패널이 서버로 가지 않게 캐시를 먼저 채운다(마운트 전 한 번)
  useState(() => {
    for (const s of SEED) {
      qc.setQueryData(surveyKeys.stats(s.id), STATS(s))
      qc.setQueryData(surveyKeys.responses(s.id), RESPONSES(s))
    }
    return null
  })

  const filtered = useMemo(() => filterSurveys(surveys, q), [surveys, q])

  return (
    <SurveyDesk
      surveys={surveys}
      filtered={filtered}
      loading={false}
      searchTerm={q}
      onSearchChange={setQ}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 새 설문 작성 창이 열려요', 'info')}
      onBack={() => navigate(-1)}
      editingId={null}
      renderResults={(s) => <SurveyResultsPanel key={s.id} survey={s} />}
      onEdit={(s) => showToast(`미리보기 — '${s.title}' 수정 창이 열려요`, 'info')}
      onSetStatus={(s, status) => setSurveys((l) => l.map((x) => (x.id === s.id ? { ...x, status } : x)))}
      onDelete={(s) => setSurveys((l) => l.filter((x) => x.id !== s.id))}
      onView={(s) => showToast(`미리보기 — /survey/${s.id} 로 가요`, 'info')}
    />
  )
}

export default SurveyAdminPreview
