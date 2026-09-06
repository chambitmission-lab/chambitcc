// 설문 참여 화면 — 문항에 답하고 제출한다.
// 제출한 뒤에는 '내 응답' / '결과' 두 탭으로 바뀐다(결과는 공개 설문일 때만).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSubmitSurvey, useSurvey, useSurveyStats } from '../../hooks/useSurvey'
import { isAuthenticated } from '../../utils/auth'
import { showToast, toastFeedback } from '../../utils/toast'
import QuestionField from './QuestionField'
import SurveyStatsView from './SurveyStatsView'
import {
  cardCls,
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
import {
  CenterNote,
  CheckIcon,
  Spinner,
  SurveyShell,
  SurveyStateChip,
} from './surveyUi'

type Tab = 'answer' | 'stats'

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

  // 참여 이력이 있으면 '내 응답'으로 열고, 아직이면 바로 답할 수 있게 폼으로 연다.
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<Tab>('answer')
  const answered = Boolean(survey?.my_response_id)
  const accepting = survey ? isAcceptingResponses(survey) : false
  const formMode = !answered || editing

  // 필수 문항을 비우고 제출하면 그 문항으로 데려가 잠깐 테두리를 밝힌다
  const [flashId, setFlashId] = useState<number | null>(null)
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({})
  useEffect(() => {
    if (flashId === null) return
    const t = window.setTimeout(() => setFlashId(null), 1800)
    return () => window.clearTimeout(t)
  }, [flashId])

  const statsEnabled = tab === 'stats' && !editing && Boolean(survey?.is_result_public)
  const { data: stats, isLoading: statsLoading } = useSurveyStats(surveyId, statsEnabled)

  const submit = useSubmitSurvey(
    toastFeedback({
      success: '참여해 주셔서 감사합니다',
      error: '응답을 제출하지 못했습니다',
    })
  )

  const answeredCount = useMemo(() => {
    if (!survey) return 0
    return draftsToAnswers(survey.questions, drafts).length
  }, [survey, drafts])

  const handleSubmit = () => {
    if (!survey) return
    const missing = findMissingRequired(survey.questions, drafts)
    if (missing) {
      showToast(missing.message, 'error')
      setFlashId(missing.question.id)
      questionRefs.current[missing.question.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
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
          setEditing(false)
          setEdits(null)
          setTab('answer')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
      }
    )
  }

  if (!loggedIn) {
    return (
      <SurveyShell onBack={() => navigate('/survey')} title="설문조사">
        <CenterNote
          title="로그인 후 참여할 수 있습니다"
          hint="설문은 한 분이 한 번만 참여할 수 있어, 로그인이 필요해요."
          actionLabel="로그인하기"
          onAction={() => navigate('/login')}
        />
      </SurveyShell>
    )
  }

  if (isLoading) {
    return (
      <SurveyShell onBack={() => navigate('/survey')} title="설문조사">
        <Spinner />
      </SurveyShell>
    )
  }

  if (isError || !survey) {
    return (
      <SurveyShell onBack={() => navigate('/survey')} title="설문조사">
        <CenterNote
          title="설문을 찾을 수 없습니다"
          hint="이미 삭제되었거나 주소가 바뀌었을 수 있어요."
          actionLabel="목록으로"
          onAction={() => navigate('/survey')}
        />
      </SurveyShell>
    )
  }

  const showTabs = answered && !editing && survey.is_result_public
  const readOnly = !formMode

  return (
    <SurveyShell onBack={() => navigate('/survey')} title={survey.title}>
      <div className="px-4 pt-4 space-y-3">
        {/* 설문 안내 — 무엇을 묻는 설문인지, 언제까지인지 */}
        <header className={`${cardCls} px-4 py-4`}>
          <div className="flex items-start gap-2">
            <h2 className="flex-1 min-w-0 text-[19px] font-extrabold text-ink-strong leading-snug tracking-[-0.02em]">
              {survey.title}
            </h2>
            <span className="shrink-0 mt-0.5">
              <SurveyStateChip survey={survey} />
            </span>
          </div>
          {survey.description ? (
            <p className="mt-2 text-[13.5px] text-ink-muted leading-relaxed whitespace-pre-wrap">
              {survey.description}
            </p>
          ) : null}
          <p className="mt-2.5 text-[12px] text-gray-400 dark:text-white/45">
            문항 {survey.questions.length}개
            {survey.response_count > 0 ? ` · ${survey.response_count}명 참여` : ''}
            {survey.ends_at ? ` · ${formatDate(survey.ends_at)}까지` : ''}
          </p>
        </header>

        {/* 참여 완료 — 낸 답이 잘 접수됐다는 확인과, 다음에 할 수 있는 일 */}
        {answered && !editing ? (
          <div className={`${cardCls} px-4 py-4 flex items-start gap-3`}>
            <span className="shrink-0 w-10 h-10 rounded-full bg-[var(--brand-soft)] text-brand flex items-center justify-center">
              <CheckIcon size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-bold text-ink-strong">참여해 주셔서 감사합니다</p>
              <p className="mt-0.5 text-[12.5px] text-ink-muted whitespace-pre-wrap leading-relaxed">
                {survey.thank_you_message ?? '보내주신 의견은 소중히 살펴 반영하겠습니다'}
              </p>
              {survey.my_responded_at ? (
                <p className="mt-1 text-[11.5px] text-gray-400 dark:text-white/40">
                  {formatDateTime(survey.my_responded_at)} 제출
                </p>
              ) : null}
              {accepting && survey.allow_edit ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true)
                    setTab('answer')
                  }}
                  className="mt-2.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors"
                >
                  응답 수정하기
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 마감 안내 — 아직 참여하지 않았는데 받을 수 없는 설문일 때 */}
        {!accepting && !answered ? (
          <div className={`${cardCls} px-4 py-8 text-center`}>
            <p className="text-[14.5px] font-semibold text-ink-strong">
              {survey.status === 'closed' || (survey.ends_at && new Date(survey.ends_at) < new Date())
                ? '마감된 설문입니다'
                : '아직 시작되지 않은 설문입니다'}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">다음 설문에서 만나요</p>
          </div>
        ) : null}

        {/* 탭 — 낸 답과 전체 결과를 오간다 (결과 공개 설문일 때만) */}
        {showTabs ? (
          <div className="flex gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.06]">
            {([
              ['answer', '내 응답'],
              ['stats', '결과'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative flex-1 py-2 rounded-xl text-[13.5px] font-bold transition-colors ${
                  tab === key
                    ? 'bg-brand text-white seal-chip [--seal-radius:0.75rem] [--seal-drop:none]'
                    : 'text-gray-500 dark:text-white/55'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {/* 결과 */}
        {showTabs && tab === 'stats' ? (
          statsLoading ? (
            <Spinner size={28} />
          ) : stats ? (
            <SurveyStatsView stats={stats} />
          ) : null
        ) : null}

        {/* 문항 — 제출 뒤에는 내가 고른 답만 읽기 전용으로 보여준다 */}
        {(!showTabs || tab === 'answer') && (accepting || answered) ? (
          <div className={`${cardCls} p-4 space-y-5`}>
            {readOnly ? (
              <p className="text-[11.5px] font-bold tracking-[0.05em] text-ink-muted">내 응답</p>
            ) : null}
            {survey.questions.map((question, i) => (
              <div
                key={question.id}
                ref={(el) => {
                  questionRefs.current[question.id] = el
                }}
                className={`${i > 0 ? 'pt-5 border-t border-gray-100 dark:border-white/[0.06]' : ''} ${
                  flashId === question.id
                    ? '-mx-2 px-2 rounded-xl ring-2 ring-red-400/70 dark:ring-red-400/50'
                    : ''
                }`}
              >
                <QuestionField
                  question={question}
                  index={i + 1}
                  value={drafts[question.id] ?? emptyDraft()}
                  view={readOnly}
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

      {/* 제출 바 — 모바일은 화면 아래 고정, PC는 본문 끝에 붙는다 */}
      {formMode && accepting && survey.questions.length > 0 ? (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark lg:static lg:mt-4 lg:px-4 lg:pb-6 lg:pt-0 lg:bg-transparent lg:dark:bg-transparent lg:backdrop-blur-none lg:border-0">
          <div className="max-w-md mx-auto lg:max-w-none">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[12px] font-semibold text-ink-muted tabular-nums">
                {answeredCount} / {survey.questions.length} 문항 응답
              </span>
              {answered ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setEdits(null)
                  }}
                  className="text-[12.5px] font-semibold text-gray-400 dark:text-white/45 hover:text-brand transition-colors"
                >
                  수정 취소
                </button>
              ) : null}
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{
                  width: `${Math.round((answeredCount / survey.questions.length) * 100)}%`,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submit.isPending}
              className="relative w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-60 transition-opacity seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]"
            >
              {submit.isPending ? '제출 중…' : answered ? '수정한 내용 제출' : '제출하기'}
            </button>
          </div>
        </div>
      ) : null}

      {/* 고정 제출 바에 본문이 가리지 않게 — PC에선 바가 흐름에 들어가므로 필요 없다 */}
      {formMode && accepting && survey.questions.length > 0 ? (
        <div className="h-32 lg:hidden" aria-hidden />
      ) : null}
    </SurveyShell>
  )
}

export default SurveyDetail
