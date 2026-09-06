// 설문 목록 — 진행 중인 설문과, 내가 참여했던 지난 설문
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurveys } from '../../hooks/useSurvey'
import { isAuthenticated } from '../../utils/auth'
import type { SurveySummary } from '../../types/survey'
import { STATUS_META, cardCls, daysLeft, formatDate, isAcceptingResponses } from './surveyShared'

const DeadlineChip = ({ survey }: { survey: SurveySummary }) => {
  const left = daysLeft(survey.ends_at)
  if (left === null) return null
  if (left < 0) return null
  const urgent = left <= 2
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
        urgent
          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25'
          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/[0.08]'
      }`}
    >
      {left === 0 ? '오늘 마감' : `D-${left}`}
    </span>
  )
}

const SurveyCard = ({ survey, onOpen }: { survey: SurveySummary; onOpen: () => void }) => {
  const answered = Boolean(survey.my_response_id)
  const accepting = isAcceptingResponses(survey)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${cardCls} w-full text-left p-4 transition-colors hover:border-brand/40`}
    >
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span
          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[survey.status].badge}`}
        >
          {STATUS_META[survey.status].label}
        </span>
        <DeadlineChip survey={survey} />
        {answered ? (
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25">
            참여 완료
          </span>
        ) : null}
      </div>

      <h3 className="text-[16px] font-bold text-ink-strong leading-snug">{survey.title}</h3>
      {survey.description ? (
        <p className="mt-1 text-[13px] text-ink-muted leading-relaxed line-clamp-2">
          {survey.description}
        </p>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="text-[12px] text-ink-muted">
          문항 {survey.question_count}개
          {survey.ends_at ? ` · ${formatDate(survey.ends_at)}까지` : ''}
        </p>
        <span className={`text-[13px] font-semibold ${accepting && !answered ? 'text-brand' : 'text-ink-muted'}`}>
          {accepting ? (answered ? '응답 수정 →' : '참여하기 →') : answered ? '내 응답 보기 →' : '자세히 →'}
        </span>
      </div>
    </button>
  )
}

const SurveyList = () => {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useSurveys(loggedIn)

  const { ongoing, past } = useMemo(() => {
    const list = data ?? []
    return {
      ongoing: list.filter((s) => isAcceptingResponses(s)),
      past: list.filter((s) => !isAcceptingResponses(s)),
    }
  }, [data])

  const pending = ongoing.filter((s) => !s.my_response_id).length

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto min-h-screen pb-24 lg:max-w-none lg:mx-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden">
          <header className="px-4 pt-5 pb-3">
            <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
              SURVEY
            </p>
            <h1 className="text-ink-strong text-[26px] font-bold leading-none tracking-[-0.02em]">
              설문조사
            </h1>
            <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
              {pending > 0
                ? `참여를 기다리는 설문이 ${pending}개 있어요`
                : '성도님의 의견이 교회의 결정이 됩니다'}
            </p>
          </header>

          <div className="px-4 pt-2 space-y-3">
            {!loggedIn ? (
              <div className={`${cardCls} px-4 py-10 text-center`}>
                <p className="text-[14px] text-ink-muted">로그인 후 참여할 수 있습니다</p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mt-3 px-4 py-2 rounded-xl bg-brand text-white text-[13.5px] font-semibold"
                >
                  로그인하기
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : (ongoing.length === 0 && past.length === 0) ? (
              <div className={`${cardCls} px-4 py-12 text-center`}>
                <p className="text-[14px] text-ink-strong font-semibold">진행 중인 설문이 없습니다</p>
                <p className="mt-1 text-[13px] text-ink-muted">새 설문이 열리면 홈에서 알려드릴게요</p>
              </div>
            ) : (
              <>
                {ongoing.length > 0 ? (
                  <section className="space-y-2.5">
                    <p className="px-1 text-[11.5px] font-bold tracking-[0.05em] text-ink-muted">
                      진행 중
                    </p>
                    {ongoing.map((survey) => (
                      <SurveyCard
                        key={survey.id}
                        survey={survey}
                        onOpen={() => navigate(`/survey/${survey.id}`)}
                      />
                    ))}
                  </section>
                ) : null}

                {past.length > 0 ? (
                  <section className="space-y-2.5 pt-2">
                    <p className="px-1 text-[11.5px] font-bold tracking-[0.05em] text-ink-muted">
                      지난 설문
                    </p>
                    {past.map((survey) => (
                      <SurveyCard
                        key={survey.id}
                        survey={survey}
                        onOpen={() => navigate(`/survey/${survey.id}`)}
                      />
                    ))}
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyList
