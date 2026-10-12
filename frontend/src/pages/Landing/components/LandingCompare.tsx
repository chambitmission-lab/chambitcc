import { useNavigate } from 'react-router-dom'
import { useSurveys } from '../../../hooks/useSurvey'
import { tokenStore } from '../../../utils/tokenStore'

// 첫 화면 개편 비교(2026-10 시범) — 새 화면(/, /welcome)과 예전 화면(/welcome/classic)을 오가며
// 성도가 고르게 한다. 의견 수렴이 끝나면 이 파일·classic 폴더·/welcome/classic 라우트를 함께 정리한다.
//
// 의견은 기존 설문으로 받는다 — 제목에 이 말이 든 진행 중 설문이 있으면 그리로, 없으면 설문 목록으로
// (설문 id 를 코드에 박지 않기 위함, /sermon/new·/history/new 와 같은 방식)
const FEEDBACK_KEYWORD = '첫 화면'

export type LandingVariant = 'new' | 'classic'

const OTHER: Record<LandingVariant, string> = { new: '/welcome/classic', classic: '/welcome' }

/** 맨 위 안내 띠 — 새 화면엔 '예전 화면과 비교', 예전 화면엔 '새 화면 보기' */
export const CompareNotice = ({ variant, ko }: { variant: LandingVariant; ko: boolean }) => {
  const navigate = useNavigate()
  const isNew = variant === 'new'
  return (
    <div className="ld-compare-wrap">
      <button type="button" className="ld-compare" onClick={() => navigate(OTHER[variant])}>
        <span className="ld-compare-badge">{isNew ? (ko ? '시범 운영' : 'Beta') : (ko ? '예전 화면' : 'Classic')}</span>
        <span className="ld-compare-text">
          {isNew
            ? (ko ? '새로 바뀐 첫 화면이에요. 예전 화면과 비교해 보세요' : 'This is our new front page. Compare it with the old one')
            : (ko ? '개편 전 첫 화면을 보고 계세요' : "You're viewing the previous front page")}
        </span>
        <span className="ld-compare-go" aria-hidden="true">
          {isNew ? (ko ? '← 예전 화면' : '← Old page') : (ko ? '새 화면 →' : 'New page →')}
        </span>
      </button>
    </div>
  )
}

/** 화면 아래 의견 카드 — 설문은 로그인 성도만 참여하므로 로그인했을 때만 보인다 */
export const CompareFeedback = ({ variant, ko }: { variant: LandingVariant; ko: boolean }) => {
  const navigate = useNavigate()
  const loggedIn = !!tokenStore.getAccess()
  const { data: surveys } = useSurveys(loggedIn)
  if (!loggedIn) return null
  const survey = surveys?.find((s) => s.status === 'open' && s.title.includes(FEEDBACK_KEYWORD))
  const isNew = variant === 'new'
  return (
    <section className="ld-compare-feedback feed-card">
      <div className="min-w-0">
        <h2>{ko ? '두 첫 화면, 어느 쪽이 좋으세요?' : 'Which front page do you prefer?'}</h2>
        <p>
          {ko
            ? '처음 오시는 분이 가장 먼저 보는 화면이에요. 새 화면과 예전 화면을 모두 보시고 의견을 남겨 주세요. 여러분의 의견으로 첫 화면을 정합니다.'
            : "This is the first thing newcomers see. Look at both and tell us what you think — your votes decide."}
        </p>
      </div>
      <div className="ld-compare-actions">
        <button type="button" className="ld-compare-btn ld-compare-btn--solid" onClick={() => navigate(survey ? `/survey/${survey.id}` : '/survey')}>
          {ko ? '의견 남기기' : 'Share feedback'}
        </button>
        <button type="button" className="ld-compare-btn" onClick={() => navigate(OTHER[variant])}>
          {isNew ? (ko ? '예전 화면 보기' : 'See old page') : (ko ? '새 화면 보기' : 'See new page')}
        </button>
      </div>
    </section>
  )
}
