// 회원 관리(UserManagement)의 부분 컴포넌트 — B안 '목록 + 상세 고정 2단'.
// 왼쪽 목록(MemberListItem) · 오른쪽 상세(MemberDetail) · 임시 비밀번호 안내(TempPasswordDialog).
import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { User } from '../../api/user'
import { CHURCH_TITLES, CLERGY_TITLES } from '../../utils/churchTitles'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'

export type MemberStatus = 'pending' | 'rejected' | 'active' | 'inactive'

export const memberStatus = (u: User): MemberStatus =>
  u.approval_status === 'pending'
    ? 'pending'
    : u.approval_status === 'rejected'
      ? 'rejected'
      : u.is_active
        ? 'active'
        : 'inactive'

const STATUS_META: Record<MemberStatus, { label: string; dot: string; pill: string }> = {
  pending: {
    label: '승인 대기',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  },
  rejected: {
    label: '가입 거절',
    dot: 'bg-red-500',
    pill: 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-300',
  },
  active: {
    label: '활성',
    dot: 'bg-green-500',
    pill: 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/75',
  },
  inactive: {
    label: '비활성',
    dot: 'bg-gray-400 dark:bg-white/30',
    pill: 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50',
  },
}

const displayName = (u: User) => u.full_name || u.username

/** 명부에서 직접 입력한 '시무권사' 같은 값도 교역자 여부를 같은 기준으로 */
const isClergyTitle = (t: string) => CLERGY_TITLES.includes(t) || t.endsWith('목사') || t.endsWith('전도사')

// ── 공용 조각 ─────────────────────────────────────────────
const CARD =
  'relative isolate overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]'
const CARD_SHEEN = (
  <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-[inherit]" />
)

export const MemberAvatar = ({ user, size = 40 }: { user: User; size?: number }) => {
  const st = memberStatus(user)
  const dot = Math.max(10, Math.round(size * 0.28))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full bg-brand flex items-center justify-center text-white font-bold"
        style={{ fontSize: Math.round(size * 0.38) }}
      >
        {displayName(user).charAt(0).toUpperCase()}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-card-dark ${STATUS_META[st].dot}`}
        style={{ width: dot, height: dot }}
        aria-label={STATUS_META[st].label}
      />
    </div>
  )
}

export const StatusPill = ({ user }: { user: User }) => {
  const meta = STATUS_META[memberStatus(user)]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-[3px] rounded-full ${meta.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

/** 스위치 모양 — 상호작용은 감싸는 버튼이 맡고 이건 그림만 그린다 */
export const SwitchVisual = ({ on, small }: { on: boolean; small?: boolean }) => (
  <span
    aria-hidden
    className={`relative shrink-0 rounded-full transition-colors duration-200 ${
      small ? 'w-9 h-[22px]' : 'w-[46px] h-[27px]'
    } ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/[0.14]'}`}
  >
    <span
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200 ${
        small ? 'w-4 h-4' : 'w-[21px] h-[21px]'
      } ${on ? (small ? 'left-[17px]' : 'left-[22px]') : 'left-[3px]'}`}
    />
  </span>
)

// ── 스켈레톤 · 빈 상태 ─────────────────────────────────────
export const SkeletonRows = () => (
  <div className="px-4 pt-3 space-y-2">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="h-[56px] rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

export const EmptyList = ({ onReset }: { onReset: () => void }) => (
  <div className="text-center py-14 px-4">
    <span className="material-icons-outlined text-[36px] text-gray-300 dark:text-white/25">search</span>
    <p className="mt-2 text-[13.5px] font-semibold text-gray-600 dark:text-white/70">조건에 맞는 회원이 없어요</p>
    <p className="text-[12px] text-gray-400 dark:text-white/40 mt-1">검색어나 필터를 바꿔 보세요</p>
    <button type="button" onClick={onReset} className="mt-3 text-[13px] font-semibold text-brand">
      필터 초기화
    </button>
  </div>
)

// ── 왼쪽 목록 행 ─────────────────────────────────────────
interface MemberListItemProps {
  user: User
  selected: boolean
  onSelect: () => void
  formatRelative: (d?: string) => string
}

export const MemberListItem = ({ user, selected, onSelect, formatRelative }: MemberListItemProps) => {
  const st = memberStatus(user)
  const meta =
    st === 'pending' ? (
      <span className="text-amber-700 dark:text-amber-300 font-semibold">{formatRelative(user.created_at)} 가입 신청</span>
    ) : st === 'rejected' ? (
      <span className="text-red-600 dark:text-red-300">가입 거절됨</span>
    ) : st === 'inactive' ? (
      '비활성 계정'
    ) : user.last_login ? (
      `${formatRelative(user.last_login)} 접속`
    ) : (
      '로그인 기록 없음'
    )
  return (
    <button
      type="button"
      id={`member-row-${user.id}`}
      onClick={onSelect}
      aria-current={selected || undefined}
      className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        selected ? 'lg:bg-[var(--brand-soft)]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      {selected && <span className="hidden lg:block absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand" />}
      <MemberAvatar user={user} size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[14px] font-bold text-ink-strong tracking-[-0.01em] truncate">{displayName(user)}</span>
          {user.church_title && (
            <span className="text-[12px] font-medium text-gray-600 dark:text-white/65 shrink-0">{user.church_title}</span>
          )}
        </div>
        <div className="text-[12px] text-gray-500 dark:text-white/50 truncate mt-0.5">{meta}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {user.is_admin && (
          <span className="material-icons-outlined text-[17px] text-brand" title="관리자">admin_panel_settings</span>
        )}
        {user.is_pastor && (
          <span className="material-icons-outlined text-[17px] text-brand" title="목회자 권한">church</span>
        )}
        <span className="material-icons-outlined text-[20px] text-gray-300 dark:text-white/25 lg:hidden">chevron_right</span>
      </div>
    </button>
  )
}

// ── 오른쪽 상세 ─────────────────────────────────────────
interface MemberDetailProps {
  user: User
  onToggleAdmin: () => void
  onTogglePastor: () => void
  onChurchTitle: (title: string | null) => void
  onToggleStatus: () => void
  onApproval: (approve: boolean) => void
  onResetPassword: () => void
  formatDate: (d: string) => string
  formatRelative: (d?: string) => string
}

export const MemberDetail = ({
  user,
  onToggleAdmin,
  onTogglePastor,
  onChurchTitle,
  onToggleStatus,
  onApproval,
  onResetPassword,
  formatDate,
  formatRelative,
}: MemberDetailProps) => {
  const st = memberStatus(user)
  return (
    <div className="px-4 pt-4 pb-12 lg:px-8 lg:pt-6 max-w-[780px]">
      {/* 프로필 */}
      <div className={`${CARD} rounded-3xl p-5`}>
        {CARD_SHEEN}
        <div className="relative z-10 lg:flex lg:items-center lg:gap-5">
          <div className="flex items-center gap-4 lg:contents">
            <MemberAvatar user={user} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[22px] font-bold text-ink-strong tracking-[-0.02em]">{displayName(user)}</span>
                <span className="text-[14.5px] font-semibold text-gray-600 dark:text-white/65">
                  {user.church_title || '직분 미지정'}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[13px] text-gray-500 dark:text-white/50">
                <span>@{user.username}</span>
                <StatusPill user={user} />
              </div>
            </div>
          </div>
          <dl className="mt-4 lg:mt-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-[12.5px] shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-200/70 dark:border-white/[0.06]">
            <dt className="text-gray-500 dark:text-white/50">가입</dt>
            <dd className="text-ink-strong font-medium">{formatDate(user.created_at)}</dd>
            <dt className="text-gray-500 dark:text-white/50">최근 접속</dt>
            <dd className="text-ink-strong font-medium">{user.last_login ? formatRelative(user.last_login) : '기록 없음'}</dd>
          </dl>
        </div>
      </div>

      {/* 승인 처리 — 대기/거절 상태일 때만 */}
      {(st === 'pending' || st === 'rejected') && (
        <div
          className={`mt-4 rounded-2xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 border ${
            st === 'pending'
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-400/25'
              : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-400/25'
          }`}
        >
          <p
            className={`flex-1 text-[13.5px] font-semibold leading-relaxed ${
              st === 'pending' ? 'text-amber-800 dark:text-amber-200' : 'text-red-700 dark:text-red-200'
            }`}
          >
            {st === 'pending'
              ? `${formatRelative(user.created_at)} 가입을 신청했어요. 승인하면 바로 로그인할 수 있어요.`
              : '가입이 거절된 계정이에요. 같은 아이디로는 다시 가입할 수 없어요.'}
          </p>
          <div className="flex gap-2 shrink-0">
            {st === 'pending' && (
              <button
                type="button"
                onClick={() => onApproval(false)}
                className="h-10 px-4 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-red-600 dark:text-red-300 text-[13.5px] font-semibold"
              >
                거절
              </button>
            )}
            <button
              type="button"
              onClick={() => onApproval(true)}
              className="flex-1 lg:flex-none h-10 px-5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5"
            >
              <span className="material-icons-outlined text-[17px]">how_to_reg</span>
              {st === 'pending' ? '가입 승인' : '승인으로 되돌리기'}
            </button>
          </div>
        </div>
      )}

      {/* 권한과 계정 — 설명을 붙인 타일. 누르면 기존 확인창을 거쳐 바뀐다 */}
      <SectionTitle title="권한과 계정" hint="타일을 눌러 켜고 끄세요" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PermissionTile
          icon="admin_panel_settings"
          title="관리자"
          on={user.is_admin}
          onLabel="관리자"
          offLabel="일반 사용자"
          desc="모든 관리자 메뉴(회원·공지·주보 등)에 들어갈 수 있어요."
          onClick={onToggleAdmin}
        />
        <PermissionTile
          icon="church"
          title="목회자 권한"
          on={!!user.is_pastor}
          onLabel="열람 가능"
          offLabel="권한 없음"
          desc="성도 명부·심방 기록과 '목사님과 함께' 기도를 볼 수 있어요. 교역자에게만."
          onClick={onTogglePastor}
        />
        <PermissionTile
          icon="how_to_reg"
          title="계정 활성"
          on={user.is_active}
          onLabel="로그인 가능"
          offLabel="로그인 차단"
          desc="끄면 이 계정으로 로그인할 수 없어요. 기록은 그대로 남아요."
          onClick={onToggleStatus}
          danger
        />
      </div>

      {/* 직분 — 교역자/평신도로 나눠 목회자 권한이 함께 켜지는 쪽을 구분한다 */}
      <SectionTitle
        title="직분"
        action={
          user.church_title ? (
            <button
              type="button"
              onClick={() => onChurchTitle(null)}
              className="text-[12.5px] font-semibold text-gray-500 dark:text-white/50 hover:text-brand"
            >
              지우기
            </button>
          ) : null
        }
      />
      <ChurchTitlePicker current={user.church_title ?? null} onPick={onChurchTitle} />

      {/* 보안 */}
      <SectionTitle title="보안" />
      <div className={`${CARD} p-4`}>
        {CARD_SHEEN}
        <div className="relative z-10 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-[21px]">lock_reset</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink-strong">비밀번호 초기화</p>
            <p className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5">임시 비밀번호를 만들어 회원에게 전달해요</p>
          </div>
          <button
            type="button"
            onClick={onResetPassword}
            className="h-9 px-3.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-[13px] font-semibold text-gray-800 dark:text-white/85 hover:bg-gray-200 dark:hover:bg-white/[0.1] shrink-0"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}

const SectionTitle = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="mt-7 mb-2.5 flex items-center justify-between gap-2">
    <p className="text-[13.5px] font-bold text-ink-strong">
      {title}
      {hint && <span className="ml-1.5 font-normal text-[12px] text-gray-400 dark:text-white/40">{hint}</span>}
    </p>
    {action}
  </div>
)

interface PermissionTileProps {
  icon: string
  title: string
  on: boolean
  onLabel: string
  offLabel: string
  desc: string
  onClick: () => void
  /** 꺼진 상태가 '막힘'을 뜻하는 타일 — 꺼졌을 때 빨간 글씨로 */
  danger?: boolean
}

const PermissionTile = ({ icon, title, on, onLabel, offLabel, desc, onClick, danger }: PermissionTileProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={title}
    onClick={onClick}
    className={`text-left p-4 rounded-2xl border transition-colors ${
      on
        ? 'bg-[var(--brand-soft)] border-brand'
        : 'bg-white dark:bg-card-dark border-gray-200/70 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.18]'
    }`}
  >
    <div className="flex items-center justify-between">
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          on ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50'
        }`}
      >
        <span className="material-icons-outlined text-[21px]">{icon}</span>
      </span>
      <SwitchVisual on={on} small />
    </div>
    <p className="mt-3 text-[15px] font-bold text-ink-strong">{title}</p>
    <p
      className={`text-[12px] font-semibold mt-0.5 ${
        on ? 'text-brand' : danger ? 'text-red-600 dark:text-red-300' : 'text-gray-500 dark:text-white/50'
      }`}
    >
      {on ? onLabel : offLabel}
    </p>
    <p className="text-[12px] text-gray-500 dark:text-white/50 mt-2 leading-snug">{desc}</p>
  </button>
)

const ChurchTitlePicker = ({
  current,
  onPick,
}: {
  current: string | null
  onPick: (title: string | null) => void
}) => {
  // 명부에서 직접 입력한 값(예: 시무권사)은 목록에 없어도 선택된 버튼으로 보여 준다
  const options: string[] = [...CHURCH_TITLES]
  if (current && !options.includes(current)) options.push(current)
  // 원로목사는 목회자 권한이 켜지지 않지만 목사라 교역자 쪽에 둔다
  const clergy = options.filter(t => isClergyTitle(t))
  const lay = options.filter(t => !isClergyTitle(t))
  const btn = (t: string) => {
    const active = current === t
    return (
      <button
        key={t}
        type="button"
        onClick={() => !active && onPick(t)}
        aria-pressed={active}
        className={`px-3.5 h-9 rounded-xl border text-[13.5px] font-semibold transition-colors ${
          active
            ? 'bg-brand border-brand text-white'
            : 'border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-white/75 hover:border-brand hover:text-brand'
        }`}
      >
        {t}
      </button>
    )
  }
  return (
    <div className={`${CARD} p-4`}>
      {CARD_SHEEN}
      <div className="relative z-10">
        <p className="text-[11.5px] font-bold text-gray-500 dark:text-white/50 mb-2">
          교역자 <span className="font-normal">· 담임목사·부목사·강도사·전도사는 목회자 권한이 함께 켜져요</span>
        </p>
        <div className="flex flex-wrap gap-1.5">{clergy.map(btn)}</div>
        <p className="text-[11.5px] font-bold text-gray-500 dark:text-white/50 mt-4 mb-2">평신도</p>
        <div className="flex flex-wrap gap-1.5">{lay.map(btn)}</div>
      </div>
    </div>
  )
}

// ── 임시 비밀번호 안내 — 놓치지 않게 큰 글씨 + 복사 버튼 ─────────
export const TempPasswordDialog = ({
  name,
  password,
  onClose,
}: {
  name: string
  password: string
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      showToast('임시 비밀번호를 복사했습니다', 'success')
    } catch {
      showToast('복사하지 못했습니다. 직접 적어 주세요', 'error')
    }
  }
  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] bg-black/45 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="비밀번호가 초기화되었습니다"
        className={`${CARD} w-full max-w-[380px] rounded-3xl p-6 text-center`}
      >
        {CARD_SHEEN}
        <div className="relative z-10">
          <span className="material-icons-outlined text-[34px] text-brand">lock_reset</span>
          <p className="mt-1 text-[18px] font-bold text-ink-strong">비밀번호가 초기화되었습니다</p>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 leading-relaxed">
            {name} 님에게 전달해 주세요.
            <br />
            로그인 후 직접 변경할 수 있습니다.
          </p>
          <div className="mt-5 flex items-center gap-2 p-1.5 pl-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]">
            <span className="flex-1 text-left font-mono text-[19px] font-bold tracking-wider text-ink-strong select-all break-all">
              {password}
            </span>
            <button
              type="button"
              onClick={copy}
              className="h-9 px-3 rounded-lg bg-brand hover:bg-brand-dim text-white text-[13px] font-semibold inline-flex items-center gap-1 shrink-0"
            >
              <span className="material-icons-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="mt-5 w-full h-12 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14.5px] font-semibold text-gray-800 dark:text-white/85"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
