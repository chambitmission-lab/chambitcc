// 설문조사 관리 — 설문을 만들고, 진행/마감을 켜고, 통계와 개별 응답을 본다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSurvey, downloadSurveyCsv } from '../../api/survey'
import {
  useAdminSurveys,
  useDeleteSurvey,
  useDeleteSurveyResponse,
  useSurveyResponses,
  useSurveyStats,
  useUpdateSurveyStatus,
} from '../../hooks/useSurvey'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import { can } from '../../utils/access'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import SurveyStatsView from '../Survey/SurveyStatsView'
import SurveyComposer from './components/SurveyComposer'
import {
  STATUS_META,
  cardCls,
  formatDate,
  formatDateTime,
} from '../Survey/surveyShared'
import type { SurveyDetail, SurveyStatus, SurveySummary } from '../../types/survey'

const SurveyManagement = () => {
  const navigate = useNavigate()
  const { data: surveys, isLoading } = useAdminSurveys()

  const [composerTarget, setComposerTarget] = useState<SurveyDetail | null | undefined>(undefined)
  const [resultsFor, setResultsFor] = useState<SurveySummary | null>(null)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const setStatus = useUpdateSurveyStatus(toastFeedback({ success: '상태를 변경했습니다' }))
  const remove = useDeleteSurvey(toastFeedback({ success: '설문을 삭제했습니다' }))

  const openEdit = async (survey: SurveySummary) => {
    try {
      setLoadingEdit(survey.id)
      // 목록에는 문항이 없으므로 편집 전에 상세를 받아온다
      setComposerTarget(await getSurvey(survey.id))
    } catch {
      showToast('설문을 불러오지 못했습니다', 'error')
    } finally {
      setLoadingEdit(null)
    }
  }

  const confirmDelete = async (survey: SurveySummary) => {
    const ok = await confirmDialog({
      title: '설문을 삭제할까요?',
      message: `'${survey.title}'`,
      description:
        survey.response_count > 0
          ? `이미 들어온 응답 ${survey.response_count}건도 함께 사라집니다. 복구할 수 없습니다.`
          : '복구할 수 없습니다.',
      confirmText: '삭제',
      tone: 'danger',
    })
    if (ok) remove.mutate(survey.id)
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-24">
        <header className="mb-4">
          <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
          <h1 className="text-ink-strong text-[24px] font-bold tracking-[-0.02em]">설문조사 관리</h1>
          <p className="text-[13px] text-ink-muted mt-1">
            문항을 자유롭게 만들고, 참여 현황과 통계를 확인하세요
          </p>
        </header>

        <button
          type="button"
          onClick={() => setComposerTarget(null)}
          className="w-full mb-4 py-3 rounded-2xl bg-brand text-white text-[14.5px] font-bold"
        >
          + 새 설문 만들기
        </button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : !surveys?.length ? (
          <div className={`${cardCls} px-4 py-12 text-center`}>
            <p className="text-[14px] font-semibold text-ink-strong">등록된 설문이 없습니다</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              새 설문을 만들면 성도 홈에 참여 카드가 뜹니다
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {surveys.map((survey) => (
              <div key={survey.id} className={`${cardCls} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[survey.status].badge}`}
                      >
                        {STATUS_META[survey.status].label}
                      </span>
                      {survey.is_result_public ? (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/[0.08]">
                          결과 공개
                        </span>
                      ) : null}
                      {survey.show_on_home && survey.status === 'open' ? (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]">
                          홈 노출
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-[15.5px] font-bold text-ink-strong leading-snug">
                      {survey.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      문항 {survey.question_count}개 · 응답 {survey.response_count}명
                      {survey.ends_at ? ` · ${formatDate(survey.ends_at)} 마감` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[22px] font-bold text-brand tabular-nums leading-none">
                      {survey.response_count}
                    </p>
                    <p className="text-[10.5px] text-ink-muted mt-0.5">응답</p>
                  </div>
                </div>

                {/* 상태 전환 */}
                <div className="mt-3 flex gap-1.5">
                  {(['draft', 'open', 'closed'] as SurveyStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus.mutate({ id: survey.id, status: s })}
                      className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                        survey.status === s
                          ? 'bg-brand text-white border-transparent'
                          : 'border-gray-200 dark:border-white/[0.08] text-ink-muted hover:border-brand hover:text-brand'
                      }`}
                    >
                      {s === 'draft' ? '작성 중' : s === 'open' ? '진행' : '마감'}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setResultsFor(survey)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors"
                  >
                    결과 보기
                  </button>
                  <button
                    type="button"
                    onClick={() => void openEdit(survey)}
                    disabled={loadingEdit === survey.id}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                  >
                    {loadingEdit === survey.id ? '여는 중…' : '수정'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDelete(survey)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink-muted hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {composerTarget !== undefined ? (
        <SurveyComposer
          survey={composerTarget}
          onClose={() => setComposerTarget(undefined)}
          onSaved={() => setComposerTarget(undefined)}
        />
      ) : null}

      {resultsFor ? (
        <SurveyResultsModal survey={resultsFor} onClose={() => setResultsFor(null)} />
      ) : null}
    </div>
  )
}

// ── 결과 모달 ─────────────────────────────────────────────────────────

const SurveyResultsModal = ({
  survey,
  onClose,
}: {
  survey: SurveySummary
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  const [tab, setTab] = useState<'stats' | 'responses'>('stats')
  const { data: stats, isLoading } = useSurveyStats(survey.id, tab === 'stats')
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(
    survey.id,
    tab === 'responses'
  )
  const removeResponse = useDeleteSurveyResponse(
    toastFeedback({ success: '응답을 삭제했습니다' })
  )
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await downloadSurveyCsv(survey.id, `${survey.title}.csv`)
    } catch {
      showToast('CSV 내려받기에 실패했습니다', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="min-w-0">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">RESULT</p>
            <h2 className="text-ink-strong text-[16.5px] font-bold tracking-[-0.015em] truncate">
              {survey.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
          {(['stats', 'responses'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                tab === key
                  ? 'bg-brand text-white border-transparent'
                  : 'border-gray-200 dark:border-white/[0.08] text-ink-muted hover:border-brand'
              }`}
            >
              {key === 'stats' ? '통계' : `개별 응답 ${survey.response_count}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="ml-auto text-[12.5px] font-semibold text-brand disabled:opacity-50"
          >
            {downloading ? '내려받는 중…' : 'CSV 내려받기'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'stats' ? (
            isLoading ? (
              <div className="flex justify-center py-14">
                <div className="w-7 h-7 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : stats ? (
              <SurveyStatsView stats={stats} showNames />
            ) : null
          ) : responsesLoading ? (
            <div className="flex justify-center py-14">
              <div className="w-7 h-7 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : !responses?.length ? (
            <p className="text-[13.5px] text-ink-muted text-center py-14">아직 응답이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/[0.08] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink-strong truncate">
                      {response.user_name ?? '이름 없음'}
                    </p>
                    <p className="text-[11.5px] text-ink-muted">
                      {formatDateTime(response.created_at)} · 답변 {response.answers.length}개
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: '이 응답을 삭제할까요?',
                        message: `${response.user_name ?? '이름 없음'} 님의 응답`,
                        description: '복구할 수 없습니다.',
                        confirmText: '삭제',
                        tone: 'danger',
                      })
                      if (ok)
                        removeResponse.mutate({ surveyId: survey.id, responseId: response.id })
                    }}
                    className="shrink-0 text-[12px] font-semibold text-ink-muted hover:text-red-500 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveyManagement
