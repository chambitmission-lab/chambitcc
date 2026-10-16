// 발자취 여행 준비 중 화면 — 지도 배경·탭·상단 띠·옆 패널의 틀을 먼저 깔고 숫자 자리만 비워 둔다.
// 예전엔 /state 응답이 올 때까지 "준비하고 있어요…" 한 줄만 떠서 첫 진입이 통째로 비어 보였다.
// 틀은 JourneyView 와 같은 클래스(.qj-bar/.qj-chapters/.qj-layout/.qj-panel)를 써 응답이 오면 제자리에서 채워진다.
import type { ReactNode } from 'react'
import BmIcon from '../components/BluemarbleIcons'
import { useQuestBgStyle } from './useQuestBg'

interface Props {
  header?: ReactNode
  /** 실패했을 때 — 안내 문구와 다시 시도 버튼을 옆 패널에 띄운다 */
  error?: { message: string; onRetry: () => void } | null
}

export default function JourneySkeleton({ header, error }: Props) {
  const bgStyle = useQuestBgStyle()
  return (
    <div className="qj qj--skeleton" style={bgStyle} aria-busy={!error}>
      <div className="qj-backdrop" aria-hidden />
      <div className="qj-stage">
        {header}
        <div className="qj-bar">
          <div className="qj-bar-text">
            <p className="qj-bar-kicker">예수님의 발자취</p>
            <p className="qj-bar-title">
              <span className="qj-sk qj-sk--title" aria-hidden />
            </p>
          </div>
          <div className="qj-steps" aria-hidden>
            <span className="qj-steps-label">오늘의 걸음</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="qj-step">
                <BmIcon name="footprints" size={14} strokeWidth={1.8} />
              </span>
            ))}
          </div>
          <span className="qj-icon-btn" aria-hidden>
            <span className="material-icons-round">more_horiz</span>
          </span>
        </div>

        <div className="qj-chapters" aria-hidden>
          {[84, 72, 96, 64, 80].map((w, i) => (
            <span key={i} className="qj-chip qj-sk" style={{ width: w }} />
          ))}
        </div>

        <div className="qj-layout">
          <div className="qj-map-col">
            <div className="qj-sk-map" aria-hidden>
              {/* 길 위 발자취 자리 — 지도 그림 위에 점선 길과 빈 칸 몇 개만 어렴풋이 */}
              {[
                [18, 78],
                [38, 58],
                [58, 66],
                [76, 40],
              ].map(([x, y], i) => (
                <span key={i} className="qj-sk-node" style={{ left: `${x}%`, top: `${y}%` }} />
              ))}
            </div>
          </div>
          <aside className="qj-side">
            <div className="qj-panel qj-today">
              {error ? (
                <>
                  <p className="qj-panel-kicker">발자취를 불러오지 못했어요</p>
                  <h3>잠시 뒤 다시 시도해 주세요</h3>
                  <p className="qj-panel-sub">{error.message}</p>
                  <button type="button" className="qj-go" onClick={error.onRetry}>
                    다시 불러오기
                  </button>
                </>
              ) : (
                <>
                  <p className="qj-panel-kicker">다음 장면</p>
                  <h3>
                    <span className="qj-sk qj-sk--h3" aria-hidden />
                  </h3>
                  <p className="qj-panel-sub">
                    <span className="qj-sk qj-sk--line" aria-hidden />
                  </p>
                  <span className="qj-go is-skeleton" aria-hidden>
                    발자취를 준비하고 있어요…
                  </span>
                </>
              )}
            </div>
            <div className="qj-panel qj-stats" aria-hidden>
              <div className="qj-score">
                <span className="qj-score-label">총 점수</span>
                <span className="qj-sk qj-sk--score" />
              </div>
              <div className="qj-progress">
                <span style={{ width: '0%' }} />
              </div>
              <p className="qj-progress-label">
                <span className="qj-sk qj-sk--line qj-sk--short" />
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
