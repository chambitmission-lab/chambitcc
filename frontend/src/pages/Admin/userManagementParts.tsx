// 회원 관리(UserManagement)의 부분 컴포넌트 — 통계 칩·스켈레톤·회원 행·직분 선택·행 버튼.
// 페이지 파일이 길어 자리만 옮겼다(동작 변경 없음).
import type { User } from '../../api/user'
import { CHURCH_TITLES } from '../../utils/churchTitles'

// ── 통계 칩 ─────────────────────────────────────────────
interface StatChipProps {
  label: string
  value: number
  accent?: boolean
  /** 처리 대기 중인 항목 — 앰버로 눈에 띄게 (브랜드 블루와 역할 구분) */
  warn?: boolean
}
export const StatChip = ({ label, value, accent, warn }: StatChipProps) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold '
  const tone = warn
    ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300'
    : accent
      ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
      : 'bg-gray-100 dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/75'
  return (
    <span className={base + tone}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  )
}

// ── 필터 행 ─────────────────────────────────────────────

// ── 스켈레톤 ─────────────────────────────────────────────
export const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 회원 행 ─────────────────────────────────────────────
interface UserRowProps {
  user: User
  expanded: boolean
  onToggleExpand: () => void
  onToggleAdmin: () => void
  onTogglePastor: () => void
  onChurchTitle: (title: string | null) => void
  onToggleStatus: () => void
  onApproval: (approve: boolean) => void
  onResetPassword: () => void
  formatDate: (d: string) => string
  formatRelative: (d?: string) => string
}

export const UserRow = ({
  user,
  expanded,
  onToggleExpand,
  onToggleAdmin,
  onTogglePastor,
  onChurchTitle,
  onToggleStatus,
  onApproval,
  onResetPassword,
  formatDate,
  formatRelative,
}: UserRowProps) => (
  <div
    className={`relative isolate overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 ${
      user.approval_status === 'pending'
        ? 'border-amber-300 dark:border-amber-400/40'
        : 'border-gray-200/70 dark:border-white/[0.08]'
    }`}
  >
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

    {/* 컴팩트 헤더 — 행 전체 클릭으로 펼침 */}
    <button
      type="button"
      onClick={onToggleExpand}
      className="relative z-10 w-full flex items-center gap-3 px-3.5 py-3 text-left"
      aria-expanded={expanded}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-[15px] font-bold">
          {(user.full_name || user.username).charAt(0).toUpperCase()}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-background-light dark:ring-card-dark ${
            user.approval_status === 'pending'
              ? 'bg-amber-500'
              : user.approval_status === 'rejected'
                ? 'bg-red-500'
                : user.is_active
                  ? 'bg-green-500'
                  : 'bg-gray-400 dark:bg-white/30'
          }`}
          aria-label={
            user.approval_status === 'pending'
              ? '승인 대기'
              : user.approval_status === 'rejected'
                ? '가입 거절'
                : user.is_active
                  ? '활성'
                  : '비활성'
          }
        />
      </div>

      {/* PC 에선 행이 넓어 두 줄이 휑하다 — 이름과 메타를 한 줄에 좌우로 편다 */}
      <div className="flex-1 min-w-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
            {user.full_name || user.username}
          </span>
          {user.church_title && (
            <span className="text-[12px] font-semibold text-gray-600 dark:text-white/65 shrink-0">
              {user.church_title}
            </span>
          )}
          {user.is_admin && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.05em] shrink-0">
              ADMIN
            </span>
          )}
          {user.is_pastor && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand shrink-0">
              목회자 권한
            </span>
          )}
          {user.approval_status === 'pending' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 shrink-0">
              승인 대기
            </span>
          )}
          {user.approval_status === 'rejected' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-400/30 text-red-600 dark:text-red-300 shrink-0">
              거절됨
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate lg:shrink-0 lg:text-right">
          {/* 승인 대기 회원은 로그인 기록이 없으므로 가입 시점을 보여준다 */}
          @{user.username} ·{' '}
          {user.approval_status === 'pending'
            ? `${formatRelative(user.created_at)} 가입 신청`
            : formatRelative(user.last_login)}
        </div>
      </div>

      <span
        className={`material-icons-outlined text-[20px] text-gray-400 dark:text-white/40 transition-transform duration-200 ${
          expanded ? 'rotate-180' : ''
        }`}
      >
        expand_more
      </span>
    </button>

    {/* 확장 영역 */}
    {expanded && (
      <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-1.5 text-[12.5px]">
        {/* PC 에선 행이 넓어지므로 정보를 2열로 접어 세로 길이를 줄인다 */}
        <div className="space-y-1.5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-1.5 lg:space-y-0">
          <InfoRow label="아이디" value={user.username} />
          {user.full_name && <InfoRow label="이름" value={user.full_name} />}
          <InfoRow label="가입일" value={formatDate(user.created_at)} />
          <InfoRow
            label="최근 로그인"
            value={user.last_login ? formatDate(user.last_login) : '로그인 기록 없음'}
          />
        </div>

        {/* 승인 처리 — 대기/거절 상태일 때만 노출 */}
        {user.approval_status !== 'approved' && (
          <div className="flex gap-2 pt-3">
            <RowAction
              onClick={() => onApproval(true)}
              accent
              icon="how_to_reg"
              label={user.approval_status === 'pending' ? '가입 승인' : '승인으로 되돌리기'}
            />
            {user.approval_status === 'pending' && (
              <RowAction
                onClick={() => onApproval(false)}
                destructive
                icon="person_off"
                label="가입 거절"
              />
            )}
          </div>
        )}

        <div className="flex gap-2 pt-3">
          <RowAction
            onClick={onToggleAdmin}
            accent={!user.is_admin}
            icon={user.is_admin ? 'person' : 'shield_person'}
            label={user.is_admin ? '일반 사용자로' : '관리자로'}
          />
          <RowAction
            onClick={onToggleStatus}
            destructive={user.is_active}
            icon={user.is_active ? 'block' : 'check_circle'}
            label={user.is_active ? '비활성화' : '활성화'}
          />
        </div>

        {/* 직분 — 표시용(성도 명부·본인 프로필). 교역자 직분은 목회자 권한도 함께 켠다 */}
        <ChurchTitlePicker current={user.church_title ?? null} onPick={onChurchTitle} />

        {/* 목회자 권한 — 목회자 화면·'목사님과 함께' 기도 열람 (직분·관리자 권한과 별개) · 비밀번호 초기화 */}
        <div className="flex gap-2 pt-2">
          <RowAction
            onClick={onTogglePastor}
            accent={!user.is_pastor}
            icon="church"
            label={user.is_pastor ? '목회자 권한 해제' : '목회자 권한 주기'}
          />
          <RowAction
            onClick={onResetPassword}
            icon="lock_reset"
            label="비밀번호 초기화"
          />
        </div>
      </div>
    )}
  </div>
)

const ChurchTitlePicker = ({
  current,
  onPick,
}: {
  current: string | null
  onPick: (title: string | null) => void
}) => {
  // 명부에서 직접 입력한 값(예: 시무권사)은 목록에 없어도 선택된 pill 로 보여 준다
  const options: string[] = [...CHURCH_TITLES]
  if (current && !options.includes(current)) options.push(current)
  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-gray-500 dark:text-white/50">직분</span>
        {current && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="text-[12px] font-semibold text-gray-500 dark:text-white/50 hover:text-brand"
          >
            지우기
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(t => {
          const active = current === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => !active && onPick(t)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${
                active
                  ? 'bg-brand border-brand text-white'
                  : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-[12px] text-gray-500 dark:text-white/45 leading-relaxed">
        담임목사·부목사·강도사·전도사는 목회자 권한이 함께 켜집니다.
      </p>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate">{value}</span>
  </div>
)

interface RowActionProps {
  onClick: () => void
  accent?: boolean
  destructive?: boolean
  icon: string
  label: string
}

const RowAction = ({ onClick, accent, destructive, icon, label }: RowActionProps) => {
  // PC 에선 행이 넓어져 버튼이 과하게 늘어나므로 내용 폭으로 둔다
  let cls =
    'flex-1 lg:flex-none lg:px-5 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (accent) {
    cls += 'bg-brand hover:bg-brand-dim text-white'
  } else if (destructive) {
    cls +=
      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15'
  } else {
    cls +=
      'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className="material-icons-outlined text-[16px]">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
