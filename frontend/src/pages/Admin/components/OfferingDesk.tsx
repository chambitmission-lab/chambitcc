// 온라인 헌금 안내 관리 — 관리 데스크(2026-11-27, 교회소식·교육·공지·말씀 데스크와 같은 문법)
//
// 예전 화면은 안내 문구 요약 카드 + 계좌 카드 줄(↑↓·눈·휴지통 아이콘)이라, 고친 결과가 성도
// 화면에서 어떻게 보이는지·계좌번호가 어떻게 복사되는지 알 수 없었다. 헌금 안내는 한 장짜리
// 페이지라 '목록'보다 '문서 + 부품'에 가깝다 — 그래서
//   PC(lg+)  왼쪽 개요(안내 문구 한 줄 + 계좌 목록) / 오른쪽 상세(안내 문구: 칸별 내용·빈 칸 /
//            계좌: 공개·순서·복사 확인) + 아래에 성도 화면(OfferingSection) 그대로 — ↑↓ 이동
//   모바일   개요 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 기존 OfferingComposer(2단 모달). 데이터·액션은 OfferingManagement 가 쥔다.
import { useMemo, useState, type ReactNode } from 'react'
import type { OfferingAccount, OfferingGuide } from '../../../types/offering'
import { plainAccountNumber } from '../../../types/offering'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { formatDotDateTime } from '../../../utils/dateUtils'
import { BankIcon, OfferingBoxIcon } from '../../News/components/NewsIcons'
import OfferingSection from '../../News/components/OfferingSection'
import { GUIDE_FIELDS, accountMissing, guideMissing, type OfferingSel } from './offeringDeskUtils'
import { I, TextBtn, Switch } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const selKey = (s: OfferingSel) => (s.kind === 'guide' ? 'guide' : `account-${s.id}`)

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  up: <path d="M18 15l-6-6-6 6" />,
}

// ── 작은 조각 ────────────────────────────────────────────

const Badge = ({ tone, children }: { tone: 'hidden' | 'pending'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'pending'
        ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200'
        : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const EditBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
  >
    <I d={IC.edit} size={15} />
    수정
  </button>
)

const OrderPair = ({ onMove, first, last }: { onMove: (d: 'up' | 'down') => void; first: boolean; last: boolean }) => (
  <span className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shrink-0">
    <button type="button" onClick={() => onMove('up')} disabled={first} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.07] disabled:opacity-30" aria-label="위로">
      <I d={IC.up} size={15} />
    </button>
    <button type="button" onClick={() => onMove('down')} disabled={last} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.07] border-l border-gray-200 dark:border-white/10 disabled:opacity-30" aria-label="아래로">
      <I d={IC.down} size={15} />
    </button>
  </span>
)

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">{children}</h3>
)

/** 성도 화면 그대로 — /news?tab=offering 의 OfferingSection(공개 데이터, 저장 즉시 갱신) */
const PublicPreview = () => (
  <section>
    <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
      <I d={IC.eye} size={15} />
      성도 화면에 지금 이렇게 보여요
    </div>
    <div className="max-w-[640px] rounded-3xl bg-[var(--app-canvas)] dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/[0.06] overflow-hidden [&>div]:!px-3 [&>div]:!pb-3">
      <OfferingSection />
    </div>
  </section>
)

// ── 왼쪽 행 ──────────────────────────────────────────────

const GuideRow = ({ guide, active, onClick }: { guide: OfferingGuide | null; active: boolean; onClick: () => void }) => {
  const missing = guideMissing(guide)
  return (
    <button
      id="offering-row-guide"
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className="shrink-0 w-11 h-11 rounded-[14px] bg-brand text-white flex items-center justify-center shadow-[0_6px_16px_-6px_var(--brand-glow)]">
        <OfferingBoxIcon width={21} height={21} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15.5px] font-bold text-ink-strong">안내 문구</span>
          {missing.length > 0 && <Badge tone="pending">{missing.join('·')} 비어 있음</Badge>}
        </span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
          {guide?.deposit_format_ko ? `입금자명 · ${guide.deposit_format_ko}` : (guide?.title_ko ?? '제목·입금 방법·유의사항·말씀')}
        </span>
      </span>
    </button>
  )
}

const AccountRow = ({ account, active, onClick }: { account: OfferingAccount; active: boolean; onClick: () => void }) => (
  <button
    id={`offering-row-account-${account.id}`}
    type="button"
    onClick={onClick}
    aria-current={active}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
      active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
    } hover:bg-gray-50 dark:hover:bg-white/[0.04] ${account.is_active ? '' : 'opacity-55'}`}
  >
    <span className="shrink-0 w-11 h-11 rounded-[14px] bg-[var(--brand-soft)] text-brand flex items-center justify-center">
      <BankIcon width={20} height={20} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-1.5">
        <span className="truncate text-[15.5px] font-bold text-ink-strong">{account.label_ko}</span>
        {!account.is_active && <Badge tone="hidden">숨김</Badge>}
        {accountMissing(account) && <Badge tone="pending">예금주 비어 있음</Badge>}
      </span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55 tabular-nums">
        {account.bank_ko} · <span className="font-semibold text-gray-700 dark:text-white/75">{account.account_number}</span>
      </span>
    </span>
  </button>
)

// ── 상세: 안내 문구 ──────────────────────────────────────

export interface OfferingDeskActions {
  onEditGuide: (g: OfferingGuide) => void
  onEditAccount: (a: OfferingAccount) => void
  onToggleAccount: (a: OfferingAccount) => void
  onMoveAccount: (a: OfferingAccount, d: 'up' | 'down') => void
  onDeleteAccount: (a: OfferingAccount) => void
  onCopyTest: (a: OfferingAccount) => void
  onViewPublic: () => void
}

interface DetailCtx {
  guide: OfferingGuide | null
  accounts: OfferingAccount[]
  onClose?: () => void
}

const BackBtn = ({ onClose }: { onClose?: () => void }) =>
  onClose ? (
    <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
      <I d={IC.back} size={20} />
    </button>
  ) : null

const GuideDetail = ({ guide, onClose, ...a }: OfferingDeskActions & DetailCtx) => {
  const missing = guideMissing(guide)
  const enCount = GUIDE_FIELDS.filter(([k]) => String(guide?.[k.replace(/_ko$/, '_en') as keyof OfferingGuide] ?? '').trim()).length
  const koCount = GUIDE_FIELDS.filter(([k]) => String(guide?.[k] ?? '').trim()).length
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        <BackBtn onClose={onClose} />
        <span className="text-[15px] font-bold text-ink-strong">안내 문구</span>
        <div className="flex-1" />
        <span className="hidden sm:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
        </span>
        {guide && <EditBtn onClick={() => a.onEditGuide(guide)} />}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-5 pb-10 max-w-[720px] space-y-5">
          <dl className="grid grid-cols-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
            {(
              [
                ['채운 칸', `${koCount}/${GUIDE_FIELDS.length}`],
                ['영문', `${enCount}/${GUIDE_FIELDS.length}`],
                ['마지막 수정', guide?.updated_at ? formatDotDateTime(guide.updated_at).slice(2, 10) : '–'],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                <dd className="mt-0.5 text-[20px] lg:text-[22px] font-extrabold tabular-nums tracking-tight text-ink-strong whitespace-nowrap">{v}</dd>
              </div>
            ))}
          </dl>

          {missing.length > 0 && guide && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {missing.join('·')}이(가) 비어 있어요. 이체할 때 성도가 가장 먼저 찾는 칸이에요.
              </p>
              <button
                type="button"
                onClick={() => a.onEditGuide(guide)}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                채우기
              </button>
            </div>
          )}

          <section>
            <SectionTitle>칸별 내용 · 성도 화면 순서</SectionTitle>
            <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {GUIDE_FIELDS.map(([k, label]) => {
                const v = String(guide?.[k] ?? '').trim()
                return (
                  <div key={k} className="flex items-start gap-4 px-4 py-3">
                    <dt className="shrink-0 w-[96px] text-[14px] text-gray-500 dark:text-white/55">{label}</dt>
                    <dd className="flex-1 min-w-0 text-[14.5px] break-keep">
                      {v ? (
                        <span className={`whitespace-pre-line ${k === 'deposit_format_ko' ? 'inline-block px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-brand font-bold' : 'text-ink-strong font-medium'}`}>
                          {v}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-white/35">비어 있음 · 화면에서 이 줄은 숨겨져요</span>
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </section>

          <PublicPreview />
        </div>
      </div>
    </div>
  )
}

// ── 상세: 계좌 ───────────────────────────────────────────

const AccountDetail = ({ account, accounts, onClose, ...a }: OfferingDeskActions & DetailCtx & { account: OfferingAccount }) => {
  const idx = accounts.findIndex((x) => x.id === account.id)
  const plain = plainAccountNumber(account.account_number)
  const missing = accountMissing(account)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        <BackBtn onClose={onClose} />
        <div className="flex items-center gap-2.5 mr-1">
          <Switch on={account.is_active} onClick={() => a.onToggleAccount(account)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${account.is_active ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {account.is_active ? '공개 중' : '숨김'}
          </span>
        </div>
        <OrderPair onMove={(d) => a.onMoveAccount(account, d)} first={idx <= 0} last={idx === accounts.length - 1} />
        <div className="flex-1" />
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDeleteAccount(account)} />
        </span>
        <EditBtn onClick={() => a.onEditAccount(account)} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          {/* 통장 한 장 — 성도가 이체 화면에 옮겨 적는 값을 크게 */}
          <div className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-5">
            <div className="flex items-center gap-3">
              <span className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
                <BankIcon width={23} height={23} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
                  {idx + 1}번째 · {account.bank_ko}
                </p>
                <h2 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{account.label_ko}</h2>
              </div>
            </div>
            <p className="mt-4 text-[28px] lg:text-[32px] font-extrabold tabular-nums tracking-tight text-ink-strong break-all">{account.account_number}</p>
            <p className="mt-1 text-[14.5px] font-semibold">
              {missing ? (
                <span className="text-amber-700 dark:text-amber-300">예금주 비어 있음</span>
              ) : (
                <span className="text-gray-600 dark:text-white/65">예금주 {account.holder_ko}</span>
              )}
            </p>
            {account.note_ko && <p className="mt-3 text-[14px] leading-[1.65] text-gray-600 dark:text-white/60 whitespace-pre-line break-keep">{account.note_ko}</p>}

            {/* 복사 확인 — 성도 화면의 복사 버튼은 하이픈을 걷어낸다. 숫자가 맞는지 여기서 바로 본다 */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3">
              <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-semibold text-gray-500 dark:text-white/55">성도가 복사하면 이렇게 붙여넣어져요</span>
                <span className="block mt-0.5 text-[16px] font-bold tabular-nums text-ink-strong tracking-wide break-all">
                  {plain || account.account_number}
                </span>
              </span>
              <button
                type="button"
                onClick={() => a.onCopyTest(account)}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white dark:bg-white/10 text-[13.5px] font-bold text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/15 transition"
              >
                <I d={IC.copy} size={15} />
                복사해 보기
              </button>
            </div>
          </div>

          {(!account.is_active || missing) && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {!account.is_active
                  ? '숨김 상태라 성도 화면에 안 보여요. 위 스위치를 켜면 바로 올라가요.'
                  : '예금주가 비어 있어요. 성도가 이체 화면에서 받는 분 이름을 확인할 수 있게 채워 주세요.'}
              </p>
              {account.is_active && missing && (
                <button
                  type="button"
                  onClick={() => a.onEditAccount(account)}
                  className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
                >
                  채우기
                </button>
              )}
            </div>
          )}

          {account.updated_at && <p className="text-[13px] text-gray-500 dark:text-white/50">마지막 수정 {formatDotDateTime(account.updated_at)}</p>}

          <PublicPreview />

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDeleteAccount(account)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Detail = ({ sel, ...rest }: OfferingDeskActions & DetailCtx & { sel: OfferingSel }) => {
  if (sel.kind === 'guide') return <GuideDetail {...rest} />
  const account = rest.accounts.find((x) => x.id === sel.id)
  return account ? <AccountDetail account={account} {...rest} /> : null
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ onClose, ...rest }: OfferingDeskActions & DetailCtx & { sel: OfferingSel; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail {...rest} onClose={onClose} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface OfferingDeskProps extends OfferingDeskActions {
  guide: OfferingGuide | null
  accounts: OfferingAccount[]
  loading: boolean
  selected: OfferingSel | null
  onSelect: (s: OfferingSel) => void
  onCreateAccount: () => void
  onBack: () => void
}

const OfferingDesk = ({ guide, accounts, loading, selected, onSelect, onCreateAccount, onBack, ...actions }: OfferingDeskProps) => {
  const [sheetOpen, setSheetOpen] = useState(false)

  const order = useMemo<OfferingSel[]>(() => [{ kind: 'guide' }, ...accounts.map((x) => ({ kind: 'account' as const, id: x.id }))], [accounts])
  const active = order.find((s) => selected && selKey(s) === selKey(selected)) ?? order[0]
  const sheetSel = sheetOpen && selected && order.some((s) => selKey(s) === selKey(selected)) ? selected : null

  const hidden = accounts.filter((x) => !x.is_active).length
  const pending = accounts.filter(accountMissing).length + (guideMissing(guide).length > 0 ? 1 : 0)

  // ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useDeskHotkeys({
    onMove: (dir) => {
      const i = order.findIndex((s) => selKey(s) === selKey(active))
      const next = order[stepIndex(order.length, i, dir)]
      onSelect(next)
      document.getElementById(`offering-row-${selKey(next)}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (s: OfferingSel) => {
    onSelect(s)
    if (!isDesktop()) setSheetOpen(true)
  }

  const ctx = { guide, accounts }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 개요 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">온라인 헌금</h1>
                <button type="button" onClick={actions.onViewPublic} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors">
                  <I d={IC.ext} size={13} />
                  교회소식 › 헌금 탭에서 보기
                </button>
              </div>
              <button
                type="button"
                onClick={onCreateAccount}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                계좌
              </button>
            </div>

            <dl className="grid grid-cols-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
              {(
                [
                  ['공개 계좌', accounts.length - hidden, '개'],
                  ['숨김', hidden, '개'],
                  ['채울 곳', pending, '곳'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="px-3 py-2.5 min-w-0">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className={`mt-0.5 whitespace-nowrap ${k === '채울 곳' && v > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
                    {loading ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <div className="space-y-1.5 px-1">
                {[64, 64, 64, 64].map((h, i) => (
                  <div key={i} className="rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" style={{ height: h }} />
                ))}
              </div>
            ) : (
              <>
                <GuideRow guide={guide} active={active?.kind === 'guide'} onClick={() => select({ kind: 'guide' })} />
                <p className="px-3 pt-4 pb-1 text-[12.5px] font-bold text-gray-400 dark:text-white/40">헌금 계좌 · 성도 화면 순서</p>
                {accounts.length === 0 ? (
                  <button
                    type="button"
                    onClick={onCreateAccount}
                    className="mx-1 w-[calc(100%-0.5rem)] rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-8 text-center hover:border-brand transition-colors"
                  >
                    <p className="text-[14px] font-bold text-ink-strong">아직 계좌가 없어요</p>
                    <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55">눌러서 십일조·감사헌금 같은 계좌를 추가해요</p>
                  </button>
                ) : (
                  accounts.map((x) => (
                    <AccountRow
                      key={x.id}
                      account={x}
                      active={active?.kind === 'account' && active.id === x.id}
                      onClick={() => select({ kind: 'account', id: x.id })}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {!loading && active && <Detail key={selKey(active)} sel={active} {...ctx} {...actions} />}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetSel && <MobileDetailSheet sel={sheetSel} {...ctx} {...actions} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

export default OfferingDesk
