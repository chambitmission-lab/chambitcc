// 설문 참여 화면 — 문항에 답하고 제출한다.
// 제출 뒤에는 완료 카드로 바뀌고, 결과 공개 설문이면 그 자리에서 통계까지 볼 수 있다.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSubmitSurvey, useSurvey, useSurveyStats } from '../../hooks/useSurvey'
import { isAuthenticated } from '../../utils/auth'
import { showToast, toastFeedback } from '../../utils/toast'
import QuestionField from './QuestionField'
import SurveyStatsView from './SurveyStatsView'
import {
  STATUS_META,
  cardCls,
  daysLeft,
  draftsFromAnswers,
  draftsToAnswers,
  emptyDraft,
  findMissingRequired,
  formatDate,
  formatDateTime,
  isAcceptingResponses,
  OTHER_OPTION_ID,
  type AnswerDraft,
} from './surveyShared'

type Mode = 'form' | 'done' | 'stats'

const BackBar = ({ onBack }: { onBack: () => void }) => (
  <div className="sticky top-0 z-20 flex items-center gap-2 px-2 py-2 bg-surface/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
    <button
      type="button"
      onClick={onBack}
      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:text-brand hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
      aria-label="뒤로"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <span className="text-[14px] font-semibold text-ink-strong">설문조사</span>
  </div>
)

const SurveyDetail = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const surveyId = Number(params.id)
  const loggedIn = isAuthenticated()

  const { data: survey, isLoading, isError } = useSurvey(surveyId, loggedIn)

  // 서버가 내려준 내 답이 폼의 출발점이고, 사용자가 손대면 그때부터 edits 가 이긴다.
  // (effect 로 state 를 채우면 응답이 도착할 때마다 렌더가 한 번 더 돈다)
  const serverDrafts = useMemo(() => {
    if (!survey) return {}
    const next = draftsFromAnswers(survey.questions, survey.my_answers)
    // '기타' 직접입력이 있으면 가상 보기를 다시 켜 준다
    for (const q of survey.questions) {
      if ((q.type === 'single' || q.type === 'multi') && q.settings?.allow_other) {
        const draft = next[q.id]
        if (draft?.text) draft.optionIds = [...draft.optionIds, OTHER_OPTION_ID]
      }
    }
    return next
  }, [survey])

  const [edits, setEdits] = useState<Record<number, AnswerDraft> | null>(null)
  const drafts = edits ?? serverDrafts

  // 참여 이력이 있으면 완료 화면으로 연다 — 사용자가 버튼을 누르기 전까지만 자동 판정
  const [modeOverride, setModeOverride] = useState<Mode | null>(null)
  const mode: Mode = modeOverride ?? (survey?.my_response_id ? 'done' : 'form')
  const setMode = setModeOverride

  const statsEnabled = mode === 'stats' && Boolean(survey?.is_result_public)
  const { data: stats, isLoading: statsLoading } = useSurveyStats(surveyId, statsEnabled)

  const submit = useSubmitSurvey(
    toastFeedback({
      success: '참여해 주셔서 감사합니다',
      error: '응답을 제출하지 못했습니다',
    })
  )

  const accepting = survey ? isAcceptingResponses(survey) : false
  const answeredCount = useMemo(() => {
    if (!survey) return 0
    return draftsToAnswers(survey.questions, drafts).length
  }, [survey, drafts])

  const handleSubmit = () => {
    if (!survey) return
    const missing = findMissingRequired(survey.questions, drafts)
    if (missing) {
      showToast(missing.message, 'error')
      return
    }
    const answers = draftsToAnswers(survey.questions, drafts)
    if (!answers.length) {
      showToast('한 문항 이상 답해주세요', 'error')
      return
    }
    submit.mutate(
      { id: survey.id, data: { answers } },
      {
        onSuccess: () => {
          setMode('done')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
      }
    )
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] flex items-center justify-center px-6">
        <div className={`${cardCls} px-5 py-10 text-center max-w-sm w-full`}>
          <p className="text-[14px] text-ink-muted">로그인 후 참여할 수 있습니다</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-3 px-4 py-2 rounded-xl bg-brand text-white text-[13.5px] font-semibold"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !survey) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] flex items-center justify-center px-6">
        <div className={`${cardCls} px-5 py-10 text-center max-w-sm w-full`}>
          <p className="text-[14px] text-ink-strong font-semibold">설문을 찾을 수 없습니다</p>
          <button
            type="button"
            onClick={() => navigate('/survey')}
            className="mt-3 px-4 py-2 rounded-xl bg-brand text-white text-[13.5px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </div>
    )
  }

  const left = daysLeft(survey.ends_at)
  const readOnly = mode === 'done' || !accepting

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="lg:max-w-[860px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto min-h-screen pb-32 lg:max-w-none lg:mx-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden">
          <BackBar onBack={() => (mode === 'stats' ? setMode('done') : navigate('/survey'))} />

          {/* 설문 안내 */}
          <header className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[survey.status].badge}`}
              >
                {STATUS_META[survey.status].label}
              </span>
              {left !== null && left >= 0 && accepting ? (
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/[0.08]">
                  {left === 0 ? '오늘 마감' : `D-${left}`}
                </span>
              ) : null}
            </div>
            <h1 className="text-[22px] font-bold text-ink-strong leading-snug tracking-[-0.02em]">
              {survey.title}
            </h1>
            {survey.description ? (
              <p className="mt-2 text-[13.5px] text-ink-muted leading-relaxed whitespace-pre-wrap">
                {survey.description}
              </p>
            ) : null}
            {survey.ends_at ? (
              <p className="mt-2 text-[12px] text-ink-muted">
                {formatDate(survey.ends_at)}까지 참여할 수 있습니다
              </p>
            ) : null}
          </header>

          <div className="px-4 space-y-3">
            {/* 참여 완료 카드 */}
            {mode !== 'form' && survey.my_response_id ? (
              <div className={`${cardCls} px-4 py-5 text-center`}>
                <div className="mx-auto w-12 h-12 rounded-full bg-[var(--brand-soft)] text-brand flex items-center justify-center mb-2.5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[15.5px] font-bold text-ink-strong">참여해 주셔서 감사합니다</p>
                <p className="mt-1 text-[13px] text-ink-muted whitespace-pre-wrap leading-relaxed">
                  {survey.thank_you_message ?? '보내주신 의견은 소중히 살펴 반영하겠습니다'}
                </p>
                {survey.my_responded_at ? (
                  <p className="mt-2 text-[11.5px] text-ink-muted">
                    {formatDateTime(survey.my_responded_at)} 제출
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {accepting && survey.allow_edit ? (
                    <button
                      type="button"
                      onClick={() => setMode('form')}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors"
                    >
                      응답 수정
                    </button>
                  ) : null}
                  {survey.is_result_public ? (
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'stats' ? 'done' : 'stats')}
                      className="px-4 py-2 rounded-xl bg-brand text-white text-[13.5px] font-semibold"
                    >
                      {mode === 'stats' ? '결과 닫기' : '결과 보기'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* 마감 안내 */}
            {!accepting && !survey.my_response_id ? (
              <div className={`${cardCls} px-4 py-8 text-center`}>
                <p className="text-[14.5px] font-semibold text-ink-strong">
                  {survey.status === 'closed' || (left !== null && left < 0)
                    ? '마감된 설문입니다'
                    : '아직 시작되지 않은 설문입니다'}
                </p>
                <p className="mt-1 text-[13px] text-ink-muted">다음 설문에서 만나요</p>
              </div>
            ) : null}

            {/* 통계 */}
            {mode === 'stats' ? (
              statsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
                </div>
              ) : stats ? (
                <SurveyStatsView stats={stats} />
              ) : null
            ) : null}

            {/* 문항 — 제출 뒤에는 내가 낸 답을 읽기 전용으로 보여준다 */}
            {mode !== 'stats' && (accepting || survey.my_response_id) ? (
              <div className={`${cardCls} p-4 space-y-5`}>
                {mode === 'done' ? (
                  <p className="text-[11.5px] font-bold tracking-[0.05em] text-ink-muted">내 응답</p>
                ) : null}
                {survey.questions.map((question, i) => (
                  <div
                    key={question.id}
                    className={i > 0 ? 'pt-5 border-t border-gray-100 dark:border-white/[0.06]' : ''}
                  >
                    <QuestionField
                      question={question}
                      index={i + 1}
                      value={drafts[question.id] ?? emptyDraft()}
                      disabled={readOnly}
                      onChange={(next) =>
                        setEdits((prev) => ({ ...(prev ?? serverDrafts), [question.id]: next }))
                      }
                    />
                  </div>
                ))}
                {survey.questions.length === 0 ? (
                  <p className="text-[13px] text-ink-muted text-center py-6">
                    아직 문항이 등록되지 않았습니다
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* 제출 바 — 답한 문항 수를 함께 보여줘 남은 분량이 보이게 한다 */}
          {mode === 'form' && accepting && survey.questions.length > 0 ? (
            <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-surface/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark">
              <div className="max-w-md mx-auto lg:max-w-[820px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-ink-muted">
                    {answeredCount} / {survey.questions.length} 문항 응답
                  </span>
                  <div className="flex-1 mx-3 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-300"
                      style={{
                        width: `${Math.round((answeredCount / survey.questions.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submit.isPending}
                  className="w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-60 transition-opacity"
                >
                  {submit.isPending
                    ? '제출 중…'
                    : survey.my_response_id
                      ? '수정한 내용 제출'
                      : '제출하기'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SurveyDetail
