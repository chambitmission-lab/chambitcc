import { Link } from 'react-router-dom'
import { SproutIcon } from '../EduIcons'

// ── 작은 조각들 ───────────────────────────────────────
const AV_TONES = ['#3182f6', '#0ea5e9', '#14b8a6', '#6366f1', '#8b5cf6', '#38bdf8']

/** 레거시 '교사:' 명단을 이름 첫 글자 아바타 묶음으로 */
export const TeacherStack = ({ names, max }: { names: string[]; max: number }) => (
  <span className="edu-avs" aria-label={names.join(', ')}>
    {names.slice(0, max).map((n, i) => (
      <span key={`${n}-${i}`} className="edu-av" style={{ background: AV_TONES[i % AV_TONES.length] }} aria-hidden="true">
        {n[0]}
      </span>
    ))}
    {names.length > max && <span className="edu-av-more">+{names.length - max}</span>}
  </span>
)

const META_PATHS = {
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
} as const

export const MetaRow = ({ icon, text }: { icon: keyof typeof META_PATHS; text: string }) => (
  <span className="edu-meta">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={META_PATHS[icon]} />
    </svg>
    <span>{text}</span>
  </span>
)

export const CalendarGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-brand">
    <rect x="4" y="5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </svg>
)

export const HiddenBadge = () => (
  <span className="ml-2 align-middle text-[10px] lg:text-[12.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60">
    숨김
  </span>
)

export const QuickLink = ({ to, icon, label }: { to: string; icon: 'clock' | 'note'; label: string }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1.5 h-9 px-3.5 lg:h-11 lg:px-5 lg:text-[15px] rounded-full text-[12.5px] font-semibold text-gray-700 dark:text-white/75 bg-white/80 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] hover:text-brand hover:border-[var(--brand-glow)] transition-colors"
  >
    {icon === 'clock' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </svg>
    )}
    {label}
  </Link>
)

export const Skeleton = () => (
  <div className="space-y-4 pt-2">
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <div className="col-span-2 h-56 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse lg:row-span-2 lg:h-auto" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ))}
    </div>
    <div className="h-48 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
  </div>
)

export const EmptyState = ({
  title,
  hint,
  isAdmin,
  ko,
  onGoAdmin,
}: {
  title: string
  hint: string
  isAdmin: boolean
  ko: boolean
  onGoAdmin: () => void
}) => (
  <div className="text-center py-16">
    <SproutIcon width={38} height={38} className="mx-auto mb-3 text-brand opacity-70" />
    <p className="text-[15px] lg:text-[18px] font-bold text-ink-strong">{title}</p>
    <p className="text-[12.5px] lg:text-[15px] text-gray-500 dark:text-white/50 lg:text-gray-600 lg:dark:text-white/65 mt-1">{hint}</p>
    {isAdmin && (
      <button
        type="button"
        onClick={onGoAdmin}
        className="mt-5 inline-flex items-center h-10 px-5 lg:h-12 lg:text-[15.5px] rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)]"
      >
        {ko ? '부서 등록하러 가기' : 'Add departments'}
      </button>
    )}
  </div>
)
