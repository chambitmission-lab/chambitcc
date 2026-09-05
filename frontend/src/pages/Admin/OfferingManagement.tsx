// 온라인 헌금 안내 관리 (admin, /admin/offering)
//
// 위쪽 카드에서 안내 문구(입금자명 형식·유의사항·성구)를 고치고,
// 아래 목록에서 헌금 종류별 계좌를 추가·수정·순서 이동·숨김 처리한다.
// 레거시는 계좌가 바뀌면 HTML을 직접 고쳐야 했다 — 여기서는 화면에서 끝난다.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  useAdminOffering,
  useDeleteOfferingAccount,
  useMoveOfferingAccount,
  useUpdateOfferingAccount,
} from '../../hooks/useOffering'
import type { OfferingAccount } from '../../types/offering'
import OfferingComposer, { type OfferingComposerTarget } from './components/OfferingComposer'
import { BankIcon, OfferingBoxIcon } from '../News/components/NewsIcons'
import { FilterChip, FilterRow } from './components/FilterControls'
import { can } from '../../utils/access'

type VisibilityFilter = 'all' | 'active' | 'hidden'

const OfferingManagement = () => {
  const navigate = useNavigate()
  const admin = can('admin:access')

  const { data, isPending, isError, refetch } = useAdminOffering(admin)
  const guide = data?.guide ?? null
  const accounts = useMemo(() => data?.accounts ?? [], [data])
  const moveAccount = useMoveOfferingAccount()
  const updateAccount = useUpdateOfferingAccount()
  const deleteAccount = useDeleteOfferingAccount()

  const [searchTerm, setSearchTerm] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [composer, setComposer] = useState<OfferingComposerTarget | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('온라인 헌금 안내를 불러오지 못했습니다', 'error')
  }, [isError])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return accounts.filter((a) => {
      const matchesSearch =
        !q ||
        a.label_ko.toLowerCase().includes(q) ||
        a.bank_ko.toLowerCase().includes(q) ||
        a.account_number.toLowerCase().includes(q)
      const matchesVis =
        visibility === 'all' || (visibility === 'active' ? a.is_active : !a.is_active)
      return matchesSearch && matchesVis
    })
  }, [accounts, searchTerm, visibility])

  const hiddenCount = accounts.filter((a) => !a.is_active).length
  // 예금주가 비어 있는 계좌 — 이체 화면에서 확인하는 값이라 채워두면 좋다
  const pendingCount = accounts.filter((a) => !a.holder_ko).length
  const guideEmpty = !guide?.intro_ko && !guide?.deposit_format_ko && !guide?.note_ko

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      if (ok) showToast(ok, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '실패했습니다', 'error')
    }
  }

  const handleDelete = async (a: OfferingAccount) => {
    if (
      !(await confirmDialog({
        title: '계좌 삭제',
        message: `"${a.label_ko}" 계좌를 삭제할까요?`,
        description: '되돌릴 수 없습니다. 화면에서만 감추려면 "숨김"을 쓰세요.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    await run(() => deleteAccount.mutateAsync(a.id), '삭제되었습니다')
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">온라인 헌금 안내</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          {/* 우측 도구 */}
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            <button
              type="button"
              onClick={() => setComposer({ kind: 'account' })}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <PlusIcon /> 계좌 추가
            </button>

            <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="계좌" value={accounts.length} accent />
              <StatChip label="예금주 미확인" value={pendingCount} warn={pendingCount > 0} />
              <StatChip label="숨김" value={hiddenCount} />
            </div>

            <div className="px-4 py-3 lg:px-0 lg:py-0">
              <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
                <div className="relative z-10 space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="헌금 종류 · 은행 · 계좌번호 검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <FilterRow label="상태" align="center">
                    {([['all', '전체'], ['active', '공개'], ['hidden', '숨김']] as const).map(([v, l]) => (
                      <FilterChip key={v} active={visibility === v} onClick={() => setVisibility(v)}>
                        {l}
                      </FilterChip>
                    ))}
                  </FilterRow>
                </div>
              </div>
            </div>

            <div className="px-5 pb-2 lg:px-1">
              <button type="button" onClick={() => navigate('/news?tab=offering')} className="text-[12px] font-semibold text-brand hover:underline">
                온라인 헌금 안내 페이지에서 보기 →
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {/* 안내 문구 카드 */}
            <div className="px-4 pt-3 lg:px-0 lg:pt-0">
              <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                <div className="relative z-10 pl-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <OfferingBoxIcon width={18} height={18} className="text-brand shrink-0" />
                    <p className="text-[13.5px] font-bold text-ink-strong">안내 문구</p>
                    {guideEmpty && <Badge warn>미작성</Badge>}
                  </div>
                  {guide && !guideEmpty ? (
                    <dl className="space-y-1.5">
                      <GuideLine term="제목" value={guide.title_ko} />
                      <GuideLine term="안내" value={guide.intro_ko} />
                      <GuideLine term="입금자명" value={guide.deposit_format_ko} />
                      <GuideLine term="유의사항" value={guide.note_ko} />
                      <GuideLine term="말씀" value={guide.verse_ref_ko} />
                    </dl>
                  ) : (
                    <p className="text-[12px] text-gray-500 dark:text-white/50 leading-[1.6]">
                      아직 안내 문구가 없어요. 입금자명 형식과 유의사항을 채우면 /news 헌금 탭에 표시됩니다.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => guide && setComposer({ kind: 'guide', guide })}
                    disabled={!guide}
                    className="mt-3 w-full h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-glow)] text-brand text-[12.5px] font-bold hover:bg-[var(--brand-soft-strong)] disabled:opacity-40 transition-colors"
                  >
                    안내 문구 수정
                  </button>
                </div>
              </div>
            </div>

            {/* 계좌 목록 */}
            <p className="px-5 pt-4 pb-2 lg:px-1 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              헌금 계좌
            </p>

            <div className="px-4 pb-32 lg:px-0 lg:pb-8 space-y-2">
              {isPending && accounts.length === 0 ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <BankIcon width={36} height={36} className="mx-auto mb-3 text-gray-400 dark:text-white/40" />
                  <p className="text-[13px] text-gray-500 dark:text-white/55">
                    {searchTerm ? '조건에 맞는 계좌가 없습니다' : '아직 등록된 계좌가 없어요'}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                    {searchTerm
                      ? '검색어를 지워보세요'
                      : '＋ 계좌 버튼으로 시작하세요 (마이그레이션 시드가 있으면 자동으로 채워집니다)'}
                  </p>
                </div>
              ) : (
                filtered.map((a, index) => (
                  <AccountRow
                    key={a.id}
                    account={a}
                    isFirst={index === 0}
                    isLast={index === filtered.length - 1}
                    onEdit={() => setComposer({ kind: 'account', account: a })}
                    onMove={(d) => run(() => moveAccount.mutateAsync({ id: a.id, direction: d }))}
                    onToggle={() =>
                      run(
                        () => updateAccount.mutateAsync({ id: a.id, data: { is_active: !a.is_active } }),
                        a.is_active ? '숨김으로 전환했어요' : '공개로 전환했어요',
                      )
                    }
                    onDelete={() => handleDelete(a)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposer({ kind: 'account' })}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 lg:hidden inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_var(--brand-glow)] transition-all"
        >
          <PlusIcon />
          <span>계좌</span>
        </button>

        {composer && (
          <OfferingComposer
            key={composer.kind === 'guide' ? 'guide' : `a-${composer.account?.id ?? 'new'}`}
            target={composer}
            onClose={() => setComposer(null)}
            onSuccess={() => {
              setComposer(null)
              void refetch()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── 계좌 행 ───────────────────────────────────────────
const AccountRow = ({
  account,
  isFirst,
  isLast,
  onEdit,
  onMove,
  onToggle,
  onDelete,
}: {
  account: OfferingAccount
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onMove: (d: 'up' | 'down') => void
  onToggle: () => void
  onDelete: () => void
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm ${
      !account.is_active ? 'opacity-60' : ''
    }`}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${account.is_active ? 'bg-brand' : 'bg-gray-300 dark:bg-white/10'}`} />

    <div className="relative z-10 flex items-center gap-2 pl-3.5 pr-2 py-2.5">
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] flex items-center justify-center">
          <BankIcon width={20} height={20} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14.5px] font-bold text-ink-strong truncate">{account.label_ko}</span>
            <span className="text-[11px] text-gray-500 dark:text-white/50">{account.bank_ko}</span>
            {!account.is_active && <Badge>숨김</Badge>}
            {!account.holder_ko && <Badge warn>예금주 미확인</Badge>}
          </div>
          <p className="text-[12.5px] font-semibold tabular-nums text-gray-600 dark:text-white/60 truncate mt-0.5">
            {account.account_number}
          </p>
        </div>
      </button>
      <OrderButtons onUp={() => onMove('up')} onDown={() => onMove('down')} disableUp={isFirst} disableDown={isLast} />
      <IconBtn onClick={onToggle} label={account.is_active ? '숨김' : '공개'}>
        {account.is_active ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </IconBtn>
      <IconBtn onClick={onDelete} label="삭제" destructive>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
        </svg>
      </IconBtn>
    </div>
  </div>
)

// ── 작은 조각들 ───────────────────────────────────────
const GuideLine = ({ term, value }: { term: string; value?: string | null }) => {
  if (!value) return null
  return (
    <div className="flex gap-2 text-[12px] leading-[1.6]">
      <dt className="shrink-0 w-[52px] font-bold text-gray-400 dark:text-white/40">{term}</dt>
      <dd className="flex-1 min-w-0 text-gray-600 dark:text-white/65 line-clamp-2">{value}</dd>
    </div>
  )
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const Badge = ({ children, warn }: { children: string; warn?: boolean }) => (
  <span
    className={
      warn
        ? 'text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-amber-700 dark:text-amber-300 shrink-0'
        : 'text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0'
    }
  >
    {children}
  </span>
)

const OrderButtons = ({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void
  onDown: () => void
  disableUp: boolean
  disableDown: boolean
}) => (
  <div className="flex flex-col shrink-0">
    <button type="button" onClick={onUp} disabled={disableUp} className="w-7 h-4 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-brand disabled:opacity-25" aria-label="위로">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
    </button>
    <button type="button" onClick={onDown} disabled={disableDown} className="w-7 h-4 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-brand disabled:opacity-25" aria-label="아래로">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
  </div>
)

const IconBtn = ({
  onClick,
  label,
  destructive,
  children,
}: {
  onClick: () => void
  label: string
  destructive?: boolean
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
      destructive
        ? 'text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-400 dark:text-white/40 hover:text-brand hover:bg-[var(--brand-soft)]'
    }`}
  >
    {children}
  </button>
)

const StatChip = ({ label, value, accent, warn }: { label: string; value: number; accent?: boolean; warn?: boolean }) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-[12px] font-semibold text-brand'
        : warn
          ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-[12px] font-semibold text-amber-700 dark:text-amber-300'
          : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

export default OfferingManagement
