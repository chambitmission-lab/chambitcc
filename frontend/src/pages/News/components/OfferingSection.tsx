// 온라인 헌금 안내 섹션 (/news 의 '헌금' 탭 본문)
// Single Responsibility: 안내 문구 · 입금 방법 · 계좌 목록(복사) 렌더링
//
// 레거시 홈페이지의 "교회소식 > 온라인 헌금 안내" 한 장짜리 이미지형 페이지를
// 데이터로 옮긴 화면. 문구·계좌는 offering_* 테이블(/admin/offering 에서 편집).
// 레거시가 못 하던 것 하나 — 계좌번호를 눌러 바로 복사한다(모바일 이체 동선).
// 빈 값('')은 '미확인' — 그 줄을 숨기고 지어내지 않는다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useOffering } from '../../../hooks/useOffering'
import { isAdmin } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import { accountText, guideText, plainAccountNumber } from '../../../types/offering'
import type { OfferingAccount } from '../../../types/offering'
import { BankIcon, CheckIcon, CopyIcon, OfferingBoxIcon, SignalIcon } from './NewsIcons'
import '../offering.css'

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 권한 거부·비보안 컨텍스트 — 아래 폴백으로 넘어간다
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

const OfferingSection = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const admin = isAdmin()
  const { guide, accounts, isLoading, isError } = useOffering()

  // 방금 복사한 계좌 — 버튼이 체크로 잠깐 바뀐다
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const title = guideText(guide, 'title', language) || '온라인 헌금'
  const intro = guideText(guide, 'intro', language)
  const methodTitle = guideText(guide, 'method_title', language)
  const depositFormat = guideText(guide, 'deposit_format', language)
  const depositDesc = guideText(guide, 'deposit_desc', language)
  const note = guideText(guide, 'note', language)
  const verseText = guideText(guide, 'verse_text', language)
  const verseRef = guideText(guide, 'verse_ref', language)
  const hasMethod = !!(methodTitle || depositFormat || depositDesc || note)

  const handleCopy = async (account: OfferingAccount) => {
    const plain = plainAccountNumber(account.account_number)
    const ok = await copyToClipboard(plain || account.account_number)
    if (!ok) {
      showToast('계좌번호를 복사하지 못했어요', 'error')
      return
    }
    setCopiedId(account.id)
    showToast(`${accountText(account, 'label', language)} 계좌번호를 복사했어요`, 'success')
    window.setTimeout(() => setCopiedId((prev) => (prev === account.id ? null : prev)), 1800)
  }

  if (isLoading) return <SkeletonSection />

  return (
    <div className="px-4 pt-3 pb-8">
      {/* Hero — 배경 삽화는 offering.css(.off-hero). 장면이 오른쪽 아래에 몰려 있어
          왼쪽에 카드색 워시가 깔리고 그 위로 제목·안내가 지나간다 */}
      <div className="off-hero relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4">
        {/* 글줄이 삽화의 양·헌금함 위로 넘어가지 않게 폭을 잡는다 —
            삽화는 오른쪽 끝에 높이맞춤으로 서고, 왼쪽 46%는 알파로 카드에 녹는다 */}
        <div className="relative z-10 max-w-[70%] lg:max-w-[64%]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <OfferingBoxIcon width={23} height={23} />
            </div>
            <div>
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
                OFFERING
              </p>
              <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">{title}</h2>
            </div>
          </div>

          {intro && (
            <p className="text-gray-600 dark:text-white/60 text-[13px] leading-[1.7] whitespace-pre-line">
              {intro}
            </p>
          )}

          {accounts.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand text-[11.5px] font-bold">
              <BankIcon width={13} height={13} />
              계좌 {accounts.length}곳
            </p>
          )}
        </div>
      </div>

      {/* 헌금 방법 */}
      {hasMethod && (
        <section className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-3">
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-[var(--brand-light,#4593fc)]" />

          <div className="relative z-10 pl-1">
            {methodTitle && (
              <h3 className="text-ink-strong text-[15px] font-bold tracking-[-0.015em] mb-3">
                {methodTitle}
              </h3>
            )}

            {(depositFormat || depositDesc) && (
              <div className="rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] px-4 py-3.5">
                <p className="text-[10.5px] font-bold tracking-[0.08em] text-gray-400 dark:text-white/40 mb-2">
                  입금자명
                </p>
                {depositFormat && (
                  <p className="inline-flex items-center px-3 py-1.5 rounded-xl bg-brand text-white text-[13px] font-bold shadow-[0_6px_16px_-8px_var(--brand-glow)]">
                    {depositFormat}
                  </p>
                )}
                {depositDesc && (
                  <p className="text-gray-600 dark:text-white/60 text-[12.5px] leading-[1.7] mt-2.5 whitespace-pre-line">
                    {depositDesc}
                  </p>
                )}
              </div>
            )}

            {note && (
              <p className="mt-3 text-gray-600 dark:text-white/60 text-[12.5px] leading-[1.7] whitespace-pre-line">
                {note}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 계좌 목록 */}
      {isError && accounts.length === 0 ? (
        <ErrorState />
      ) : accounts.length === 0 ? (
        <EmptyState admin={admin} onGoAdmin={() => navigate('/admin/offering')} />
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)] p-5">
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          <div className="relative z-10">
            <h3 className="flex items-center gap-1.5 text-ink-strong text-[15px] font-bold tracking-[-0.015em] mb-1">
              <BankIcon width={16} height={16} className="text-brand shrink-0" />
              계좌번호
            </h3>
            <p className="text-gray-500 dark:text-white/50 text-[12px] mb-3.5">
              카드를 누르면 계좌번호가 복사됩니다
            </p>

            {/* lg+: 본문이 넓어지므로 2열 */}
            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  language={language}
                  copied={copiedId === account.id}
                  onCopy={() => handleCopy(account)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 말씀 한 구절 */}
      {verseText && (
        <blockquote className="relative overflow-hidden rounded-3xl bg-[var(--brand-soft)] border border-[var(--brand-glow)] px-5 py-4 mt-3">
          <p className="text-ink-strong text-[13px] leading-[1.8] tracking-[-0.01em]">
            &ldquo;{verseText}&rdquo;
          </p>
          {verseRef && (
            <cite className="not-italic block mt-2 text-brand text-[12px] font-bold">
              {verseRef}
            </cite>
          )}
        </blockquote>
      )}

      {admin && (
        <button
          type="button"
          onClick={() => navigate('/admin/offering')}
          className="mt-3 w-full h-11 rounded-2xl border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold transition-colors"
        >
          온라인 헌금 안내 관리 →
        </button>
      )}
    </div>
  )
}

// ── 계좌 카드 ─────────────────────────────────────────
const AccountCard = ({
  account,
  language,
  copied,
  onCopy,
}: {
  account: OfferingAccount
  language: 'ko' | 'en'
  copied: boolean
  onCopy: () => void
}) => {
  const label = accountText(account, 'label', language)
  const bank = accountText(account, 'bank', language)
  const holder = accountText(account, 'holder', language)
  const note = accountText(account, 'note', language)

  return (
    <button
      type="button"
      onClick={onCopy}
      className="w-full text-left group rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-gray-50/70 dark:bg-white/[0.03] hover:border-[var(--brand-soft-strong)] active:scale-[0.995] transition-all px-3.5 py-3"
      aria-label={`${label} 계좌번호 복사`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 h-[22px] rounded-lg bg-brand text-white text-[11px] font-bold shrink-0">
              {label}
            </span>
            {bank && (
              <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55">
                {bank}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[15px] font-bold tabular-nums tracking-[-0.01em] text-ink-strong break-all">
            {account.account_number}
          </p>
          {(holder || note) && (
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-white/50 truncate">
              {[holder && `예금주 ${holder}`, note].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <span
          className={[
            'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
            copied
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 group-hover:text-brand',
          ].join(' ')}
        >
          {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
        </span>
      </div>
    </button>
  )
}

// ── Skeleton / Empty / Error ──────────────────────────
const SkeletonSection = () => (
  <div className="px-4 pt-3 pb-8 space-y-3">
    <div className="h-[148px] rounded-3xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
    <div className="h-[176px] rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    <div className="h-[240px] rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
  </div>
)

const ErrorState = () => (
  <div className="rounded-3xl bg-white/80 dark:bg-card-dark border border-[var(--card-border)] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
      <SignalIcon width={28} height={28} />
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">헌금 안내를 불러오지 못했어요</p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      네트워크 상태를 확인한 뒤 다시 열어 주세요
    </p>
  </div>
)

const EmptyState = ({ admin, onGoAdmin }: { admin: boolean; onGoAdmin: () => void }) => (
  <div className="rounded-3xl bg-white/80 dark:bg-card-dark border border-[var(--card-border)] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
      <BankIcon width={28} height={28} />
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">아직 등록된 계좌가 없어요</p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      {admin ? '관리자 화면에서 헌금 계좌를 등록해 주세요' : '교회 사무실로 문의해 주세요'}
    </p>
    {admin && (
      <button
        type="button"
        onClick={onGoAdmin}
        className="mt-4 inline-flex items-center gap-1.5 px-5 h-10 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] active:scale-[0.98] transition-all"
      >
        계좌 등록하러 가기
      </button>
    )}
  </div>
)

export default OfferingSection
