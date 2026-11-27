// 설문 관리 — 상세 안의 결과(통계·개별 응답·CSV). 예전 '결과 보기' 모달을 상세 화면 안으로 옮겼다(2026-11-27)
import { useState } from 'react'
import { downloadSurveyCsv } from '../../../api/survey'
import { useDeleteSurveyResponse, useSurveyResponses, useSurveyStats } from '../../../hooks/useSurvey'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../../utils/toast'
import SurveyStatsView from '../../Survey/SurveyStatsView'
import { formatDateTime } from '../../Survey/surveyShared'
import type { SurveySummary } from '../../../types/survey'

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-7 h-7 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
  </div>
)

const SurveyResultsPanel = ({ survey }: { survey: SurveySummary }) => {
  const [tab, setTab] = useState<'stats' | 'responses'>('stats')
  const { data: stats, isLoading } = useSurveyStats(survey.id, tab === 'stats' && survey.response_count > 0)
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(survey.id, tab === 'responses')
  const removeResponse = useDeleteSurveyResponse(toastFeedback({ success: '응답을 지웠어요' }))
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
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
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div role="tablist" className="inline-grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
          {(['stats', 'responses'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`h-8 px-4 rounded-lg text-[13.5px] font-semibold transition ${
                tab === k ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
              }`}
            >
              {k === 'stats' ? '통계' : `개별 응답 ${survey.response_count}`}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void download()}
          disabled={downloading || survey.response_count === 0}
          className="h-9 px-3 rounded-xl text-[13.5px] font-semibold text-brand hover:bg-[var(--brand-soft)] disabled:opacity-40 transition"
        >
          {downloading ? '내려받는 중…' : 'CSV 내려받기'}
        </button>
      </div>

      {survey.response_count === 0 && tab === 'stats' ? (
        <p className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-10 text-center text-[14px] text-gray-500 dark:text-white/55">
          아직 응답이 없어요. 응답이 들어오면 여기에 문항별 통계가 쌓여요.
        </p>
      ) : tab === 'stats' ? (
        isLoading ? <Spinner /> : stats ? <SurveyStatsView stats={stats} showNames /> : null
      ) : responsesLoading ? (
        <Spinner />
      ) : !responses?.length ? (
        <p className="py-12 text-center text-[14px] text-gray-500 dark:text-white/55">아직 응답이 없어요</p>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
          {responses.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold text-ink-strong truncate">{r.user_name ?? '이름 없음'}</p>
                <p className="text-[13px] text-gray-500 dark:text-white/55">
                  {formatDateTime(r.created_at)} · 답 {r.answers.length}개
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: '이 응답을 지울까요?',
                    message: `${r.user_name ?? '이름 없음'} 님의 응답`,
                    description: '되돌릴 수 없어요. 지우면 이분이 다시 응답할 수 있어요.',
                    confirmText: '지우기',
                    tone: 'danger',
                  })
                  if (ok) removeResponse.mutate({ surveyId: survey.id, responseId: r.id })
                }}
                className="shrink-0 h-8 px-2.5 rounded-lg text-[13px] font-semibold text-gray-500 dark:text-white/55 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                지우기
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default SurveyResultsPanel
