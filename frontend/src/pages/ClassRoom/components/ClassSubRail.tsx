// 우리반 하위 화면(리포트·출석부·앨범) lg+ 우측 레일 — 반 요약 + 화면 이동
// 목록(/classes)·반 홈(/classes/:id)과 같은 1240 2단 폭을 쓰도록 Shell rail 로 넘긴다.
import { useNavigate } from 'react-router-dom'
import { useClassDetail } from '../../../hooks/useClassRoom'
import { isAuthenticated } from '../../../utils/auth'
import { DeptBadge } from '../classUi'
import { CameraIcon, ChartIcon, ClipboardIcon, MailboxIcon, type IconFn } from '../ClassIcons'

export type ClassSubPage = 'report' | 'attendance' | 'album'

export const RAIL_CARD =
  'rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none'

export const RAIL_LABEL =
  'mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50'

const NavRow = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: IconFn
  label: string
  active?: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
      active ? 'bg-[var(--brand-soft)]' : 'hover:bg-[var(--brand-soft)]'
    }`}
  >
    <span className="w-5 flex justify-center text-brand">
      <Icon width={15} height={15} />
    </span>
    <span
      className={`flex-1 min-w-0 truncate text-[12.5px] font-bold ${
        active ? 'text-brand' : 'text-ink-strong'
      }`}
    >
      {label}
    </span>
    {!active && (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400 dark:text-white/35">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    )}
  </button>
)

const ClassSubRail = ({
  classId,
  current,
  children,
}: {
  classId: number
  current: ClassSubPage
  children?: React.ReactNode
}) => {
  const navigate = useNavigate()
  const { data: cls } = useClassDetail(classId, isAuthenticated())
  const go = (page?: ClassSubPage) =>
    navigate(page ? `/classes/${classId}/${page}` : `/classes/${classId}`, { replace: !!page })

  return (
    <>
      <section className={RAIL_CARD}>
        <div className="flex items-center gap-2 min-w-0">
          {cls ? <DeptBadge department={cls.department} /> : <span className="w-12 h-4 rounded-full bg-gray-100 dark:bg-white/[0.06]" />}
          <p className="flex-1 min-w-0 truncate text-[14px] font-bold text-ink-strong">
            {cls?.name ?? ' '}
          </p>
        </div>
        <p className="mt-1.5 text-[11.5px] text-gray-400 dark:text-white/40 truncate">
          {cls
            ? `멤버 ${cls.member_count}명${cls.teacher_names.length ? ` · ${cls.teacher_names.join(', ')} 선생님` : ''}`
            : ' '}
        </p>
      </section>

      <section className={RAIL_CARD}>
        <p className={RAIL_LABEL}>바로가기</p>
        <div className="flex flex-col -mx-1">
          <NavRow icon={MailboxIcon} label="반 알림장" onClick={() => go()} />
          {cls?.is_teacher && (
            <>
              <NavRow icon={ChartIcon} label="리포트" active={current === 'report'} onClick={() => go('report')} />
              <NavRow icon={ClipboardIcon} label="출석부" active={current === 'attendance'} onClick={() => go('attendance')} />
            </>
          )}
          <NavRow icon={CameraIcon} label="앨범" active={current === 'album'} onClick={() => go('album')} />
        </div>
      </section>

      {children}
    </>
  )
}

export default ClassSubRail
