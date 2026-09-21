// 공지 채널 안내 배너 — "공지 팝업·알림"과 "교회소식 게시판" 역할 구분용.
// Single Responsibility: 이 화면이 담당하는 것 / 다른 화면으로 가야 하는 것을 한 줄로 알려준다.
//
// 둘은 테이블도 노출 경로도 별개인데 라벨만 보면 구분이 안 돼 관리자가
// 어디에 올려야 하는지 매번 망설였다 — 그 판단 기준을 화면 안에 둔다.
import { useNavigate } from 'react-router-dom'

interface ChannelGuideNoteProps {
  /** 이 화면이 맡은 일 */
  mine: string
  /** 저쪽 화면이 맡은 일 */
  theirs: string
  /** 저쪽 화면 경로 */
  to: string
  /** 저쪽 화면 이름 (버튼 문구) */
  toLabel: string
}

const ChannelGuideNote = ({ mine, theirs, to, toLabel }: ChannelGuideNoteProps) => {
  const navigate = useNavigate()

  return (
    <div className="px-4 pt-4 lg:px-5">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--brand-glow)] bg-[var(--brand-soft)] px-4 py-3">
        <div className="relative z-10 flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-brand">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9.5" />
              <line x1="12" y1="11" x2="12" y2="16.5" />
              <line x1="12" y1="7.8" x2="12" y2="7.9" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink-strong leading-[1.55]">
              여기는 <span className="text-brand">{mine}</span>
            </p>
            <p className="text-[11.5px] text-gray-600 dark:text-white/55 leading-[1.6] mt-0.5">
              {theirs}
            </p>
            <button
              type="button"
              onClick={() => navigate(to)}
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-brand hover:underline"
            >
              {toLabel} 열기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChannelGuideNote
