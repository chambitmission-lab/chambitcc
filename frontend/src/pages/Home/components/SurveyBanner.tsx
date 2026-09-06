// 홈 설문 배너 — 아직 참여하지 않은 진행 중 설문이 있을 때만 뜬다.
// 참여하면 서버가 더 이상 내려주지 않으므로(응답 제출 시 홈배너 쿼리 무효화) 자연히 사라진다.
import { useNavigate } from 'react-router-dom'
import { useSurveyHomeBanner } from '../../../hooks/useSurvey'
import { isAuthenticated } from '../../../utils/auth'
import { preloadRoute } from '../../../utils/routePreload'
import { daysLeft } from '../../Survey/surveyShared'
import { ClipboardIcon } from '../../Survey/surveyUi'

const SurveyBanner = () => {
  const navigate = useNavigate()
  const { data: survey } = useSurveyHomeBanner(isAuthenticated())

  if (!survey) return null

  const left = daysLeft(survey.ends_at)
  const deadline =
    left === null ? null : left === 0 ? '오늘 마감' : left > 0 ? `D-${left}` : null

  return (
    <section className="px-4 pt-3">
      <button
        type="button"
        onClick={() => navigate(`/survey/${survey.id}`)}
        onMouseEnter={() => void preloadRoute(`/survey/${survey.id}`)}
        onTouchStart={() => void preloadRoute(`/survey/${survey.id}`)}
        className="w-full text-left rounded-2xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-3.5 flex items-center gap-3 transition-transform active:scale-[0.99]"
      >
        {/* 체크리스트 — 설문지 한 장 */}
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/[0.08] text-brand flex items-center justify-center">
          <ClipboardIcon size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-brand uppercase">
              SURVEY
            </span>
            {deadline ? (
              <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-white/[0.1] text-brand">
                {deadline}
              </span>
            ) : null}
          </div>
          <p className="text-[14.5px] font-bold text-ink-strong truncate">{survey.title}</p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            문항 {survey.question_count}개 · 성도님의 의견을 들려주세요
          </p>
        </div>

        <span className="shrink-0 text-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </span>
      </button>
    </section>
  )
}

export default SurveyBanner
