// 동행 화면 공용 조각 — 셸·아바타·바텀시트
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SheetGrabber } from '../../components/common/SheetGrabber'

export const CompanionShell = ({
  title,
  backTo,
  backLabel,
  rail,
  children,
}: {
  title: string
  backTo: string
  backLabel: string
  /** PC(lg+) 우측 312px 위젯 레일 — 다른 화면과 같은 2단 표준 규격 */
  rail?: ReactNode
  children: ReactNode
}) => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 1240px 컨테이너 안에 본문 카드(flex-1) + 우측 레일(312px sticky). 모바일 폰 프레임은 그대로 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-16 lg:pb-10 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        <div className="sticky top-14 lg:static z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            aria-label={`${backLabel}으로`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">{backLabel}</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10">{title}</h1>
        </div>
        {children}
      </div>
      {rail && (
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem] lg:max-h-[calc((100vh-5.5rem)/var(--az,1))] lg:overflow-y-auto scrollbar-hide lg:[&>*]:shrink-0">
          {rail}
        </aside>
      )}
      </div>
    </div>
  )
}

/** 우측 레일 카드 한 장 */
export const RailCard = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
    {title && <p className="mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">{title}</p>}
    {children}
  </section>
)

export const RailStat = ({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{label}</span>
    <span className={`text-[16px] font-bold tabular-nums ${accent ? 'text-brand' : 'text-ink-strong'}`}>{value}</span>
  </div>
)

export const Avatar = ({
  name,
  url,
  tone,
  size = 36,
}: {
  name: string
  url?: string | null
  tone: 'me' | 'you'
  size?: number
}) => {
  const ring = tone === 'me' ? 'var(--cp-me)' : 'var(--cp-you)'
  const style = { width: size, height: size, boxShadow: `0 0 0 2px var(--surface-container), 0 0 0 4px ${ring}` }
  return url ? (
    <img src={url} alt="" style={style} className="rounded-full object-cover shrink-0" />
  ) : (
    <span
      style={{ ...style, background: ring, fontSize: size * 0.38 }}
      className="rounded-full shrink-0 text-white font-bold flex items-center justify-center"
    >
      {name.slice(0, 1)}
    </span>
  )
}

export const Sheet = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => (
  <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center">
    <div className="absolute inset-0 bg-black/45" onClick={onClose} />
    <div className="relative w-full max-w-md max-h-[calc(88vh/var(--az,1))] overflow-y-auto rounded-t-[24px] lg:rounded-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl">
      <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4 lg:hidden" />
      {children}
    </div>
  </div>
)
