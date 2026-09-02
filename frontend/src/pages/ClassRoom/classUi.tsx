// 우리반 알림장 공용 소품 — 아바타·부서 배지·시간 표기·페이지 셸

export const DEPARTMENTS = ['유치부', '유년부', '초등부', '중등부', '고등부', '청년부']

// 부서별 틴트 — 브랜드 블루 톤을 해치지 않는 소프트 팔레트
const DEPT_STYLES: Record<string, string> = {
  유치부: 'bg-amber-400/15 text-amber-600 dark:text-amber-300',
  유년부: 'bg-rose-400/15 text-rose-500 dark:text-rose-300',
  초등부: 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300',
  중등부: 'bg-violet-500/[0.12] text-violet-600 dark:text-violet-300',
  고등부: 'bg-sky-500/[0.12] text-sky-600 dark:text-sky-300',
  청년부: 'bg-[var(--brand-soft)] text-brand',
}

export const DeptBadge = ({ department }: { department: string }) => (
  <span
    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
      DEPT_STYLES[department] ?? 'bg-[var(--brand-soft)] text-brand'
    }`}
  >
    {department}
  </span>
)

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 멤버 라벨 — 자녀 이름이 있으면 "이름 (다솔)" 처럼 붙인다 */
export const memberLabel = (name: string, childName?: string | null): string =>
  childName ? `${name} (${childName})` : name

const AVATAR_COLORS = ['#3182f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9']

export const Avatar = ({
  name,
  avatarUrl,
  size,
}: {
  name: string
  avatarUrl?: string | null
  size: number
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-card-dark"
      />
    )
  }
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
  return (
    <span
      style={{ width: size, height: size, backgroundColor: `${color}22`, color }}
      className="shrink-0 rounded-full flex items-center justify-center text-[12px] font-extrabold ring-2 ring-white dark:ring-card-dark"
    >
      {name.slice(0, 1)}
    </span>
  )
}

// rail 을 주면 lg+ 에서 2단(본문 + 우측 위젯 레일)이 되고, 없으면 기존 좁은 셸 그대로다.
// 앨범·리포트·출석부처럼 레일이 없는 화면의 폭이 바뀌지 않게 하기 위한 분기.
export const Shell = ({
  onBack,
  title,
  actions,
  rail,
  children,
}: {
  onBack: () => void
  title: React.ReactNode
  actions?: React.ReactNode
  rail?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
    <div
      className={
        rail ? 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12' : ''
      }
    >
    <div
      className={`max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0 ${
        rail
          ? 'lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0'
          : 'lg:max-w-xl lg:mt-2 lg:mb-12'
      }`}
    >
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-ink-strong truncate">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </div>

    {rail && (
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        {rail}
      </aside>
    )}
    </div>
  </div>
)
