// 설문 통계 — 관리자 결과 화면과 성도용 결과 요약이 함께 쓴다.
// showNames=false 면 주관식 답변의 작성자 이름을 숨긴다(백엔드도 내려주지 않는다).
// 문항 카드의 머리말만 여기서 그리고, 종류별 본문은 레지스트리 전략의 Stats 에 맡긴다.
import type { SurveyQuestionStat, SurveyStats } from '../../types/survey'
import { QUESTION_TYPES } from './questionTypes'
import { cardCls } from './surveyStyles'

interface Props {
  stats: SurveyStats
  showNames?: boolean
  /** lg+ 에서 문항 카드를 두 단으로 — 본문이 넓은 성도용 결과 탭에서 쓴다 */
  grid?: boolean
}

const QuestionStatCard = ({
  stat,
  order,
  showNames,
}: {
  stat: SurveyQuestionStat
  order: number
  showNames: boolean
}) => {
  const { Stats } = QUESTION_TYPES[stat.type]
  return (
    <div className={`${cardCls} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-[3px] shrink-0 w-5 h-5 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold flex items-center justify-center tabular-nums">
            {order}
          </span>
          <p className="text-[14.5px] font-semibold text-ink-strong leading-snug">{stat.title}</p>
        </div>
        <span className="shrink-0 text-[11.5px] text-ink-muted tabular-nums">
          {stat.answered_count}명 응답
        </span>
      </div>

      {stat.answered_count === 0 ? (
        <p className="text-[13px] text-ink-muted py-2">아직 응답이 없습니다</p>
      ) : (
        <Stats stat={stat} showNames={showNames} />
      )}
    </div>
  )
}

const SurveyStatsView = ({ stats, showNames = false, grid = false }: Props) => (
  <div className="space-y-3">
    <div className={`${cardCls} px-4 py-3.5 flex items-center justify-between`}>
      <div>
        <p className="text-[11.5px] font-semibold text-ink-muted">참여 인원</p>
        <p className="text-[22px] font-bold text-brand tabular-nums leading-tight">
          {stats.response_count}
          <span className="text-[14px] text-ink-muted font-semibold ml-1">명</span>
        </p>
      </div>
      <p className="text-[12px] text-ink-muted text-right">
        문항 {stats.questions.length}개
      </p>
    </div>

    <div
      className={
        grid ? 'space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start' : 'space-y-3'
      }
    >
      {stats.questions.map((stat, i) => (
        <QuestionStatCard
          key={stat.question_id}
          stat={stat}
          order={i + 1}
          showNames={showNames}
        />
      ))}
    </div>
  </div>
)

export default SurveyStatsView
