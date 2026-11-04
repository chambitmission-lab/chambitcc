import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseBibleReference } from '../../../Sermon/utils/sermonMeta'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { SheetGrabber } from '../../../../components/common/SheetGrabber'
import { useIsDesktop } from './useIsDesktop'

// 열두 지파(TribesView)·열두 제자(ApostlesView)가 함께 쓰는 조각들.

export type TwelveSide = 'tribes' | 'apostles'


const CARD = 'rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08]'

/**
 * 맨 위 "지파 | 제자" 전환 + 두 열둘을 잇는 말씀(계 21:12-14).
 * 새 예루살렘의 열두 문에는 지파의 이름이, 열두 기초석에는 사도의 이름이 있다.
 */
export const TwelveSwitch = ({ side, onChange }: { side: TwelveSide; onChange: (s: TwelveSide) => void }) => (
  <section className={`${CARD} p-4 md:p-5`}>
    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]" role="tablist" aria-label="열둘 보기">
      {([
        ['tribes', '열두 지파'],
        ['apostles', '열두 제자'],
      ] as const).map(([id, label]) => {
        const active = side === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={[
              'px-4 h-9 rounded-lg text-[13.5px] font-bold transition-all',
              active
                ? 'bg-white dark:bg-[var(--brand-soft-strong)] text-brand shadow-sm'
                : 'text-gray-500 dark:text-white/55 hover:text-gray-700 dark:hover:text-white/80',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
    <p className="mt-3 text-[13.5px] text-ink leading-[1.7] break-keep">
      새 예루살렘의 <b className="text-brand">열두 문</b>에는 이스라엘 열두 지파의 이름이,{' '}
      <b className="text-brand">열두 기초석</b>에는 어린 양의 열두 사도의 이름이 있어요. 구약의 백성과 신약의 교회가 한 하나님의 백성이에요.
    </p>
    <div className="mt-1.5 flex flex-wrap gap-x-3">
      <RefLink refText="요한계시록 21:12" />
      <RefLink refText="마태복음 19:28" />
      <RefLink refText="에베소서 2:20" />
    </div>
  </section>
)

/** 목록 고르기 — 고른 목록에서 빠지는 항목이 흐려진다 */
export const ListPicker = <T extends string>({
  title,
  subtitle,
  lists,
  value,
  onChange,
}: {
  title: string
  subtitle: string
  lists: { id: T; label: string; ref: string; note: string }[]
  value: T
  onChange: (id: T) => void
}) => {
  const list = lists.find((l) => l.id === value)!
  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <h2 className="text-ink-strong text-[16px] md:text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 leading-[1.6]">{subtitle}</p>
      <div className="mt-3 flex gap-1.5 overflow-x-auto -mx-1 px-1 scrollbar-hide" role="tablist" aria-label={title}>
        {lists.map((l) => {
          const active = l.id === value
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(l.id)}
              className={[
                'inline-flex items-center px-3 h-8 rounded-full text-[12.5px] font-semibold whitespace-nowrap flex-shrink-0 transition-all',
                active
                  ? 'bg-[var(--brand-soft)] text-brand border border-[var(--brand-soft-strong)]'
                  : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border border-transparent hover:bg-gray-100 dark:hover:bg-white/[0.08]',
              ].join(' ')}
            >
              {l.label}
            </button>
          )
        })}
      </div>
      <div className="mt-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3.5 py-3">
        <p className="text-[13px] text-ink leading-[1.65] break-keep">{list.note}</p>
        <RefLink refText={list.ref} className="mt-1.5" />
      </div>
    </section>
  )
}

/** 카드 한 장 — 이름·윗줄 라벨·한 줄 소개, 목록에서 빠지면 흐리게 */
export const TwelveCard = ({
  badge,
  name,
  tagline,
  inList,
  selected,
  onClick,
}: {
  badge: string
  name: string
  tagline: string
  inList: boolean
  selected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={[
      'relative text-left rounded-2xl border px-3.5 py-3 transition-all',
      selected
        ? 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)]'
        : 'bg-white dark:bg-card-dark border-gray-200 dark:border-white/[0.08] hover:border-[var(--brand-soft-strong)]',
      inList ? '' : 'opacity-40',
    ].join(' ')}
  >
    <span className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 truncate pr-6">{badge}</span>
    <span className="mt-0.5 block text-ink-strong text-[18px] font-bold tracking-[-0.02em]">{name}</span>
    <span className="mt-1 block text-[12px] text-gray-600 dark:text-white/60 leading-[1.5] break-keep">{tagline}</span>
    {!inList && (
      <span className="absolute top-2.5 right-2.5 text-[10.5px] font-semibold text-gray-500 dark:text-white/50">빠짐</span>
    )}
  </button>
)

/** 2/3 카드 목록 + 1/3 sticky 상세(PC) / 슬라이드업 시트(모바일) */
export const TwelveLayout = ({
  main,
  detail,
  emptyText,
  onClose,
}: {
  main: ReactNode
  detail: ReactNode | null
  emptyText: ReactNode
  onClose: () => void
}) => {
  const isDesktop = useIsDesktop()
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-w-0 flex flex-col gap-4">{main}</div>
        <aside className="hidden lg:block lg:col-span-1 min-w-0">
          <div className="sticky lg:top-[4.5rem]">
            {detail ? (
              <div className={`${CARD} max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain`}>{detail}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.12] px-5 py-10 text-center">
                <span className="material-icons-round text-brand" style={{ fontSize: 28 }}>groups</span>
                <p className="mt-2 text-[13.5px] text-gray-500 dark:text-white/55 leading-[1.6]">{emptyText}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
      {detail && !isDesktop && <DetailSheet onClose={onClose}>{detail}</DetailSheet>}
    </>
  )
}

export const DetailHeader = ({
  eyebrow,
  title,
  subtitle,
  onClose,
}: {
  eyebrow: string
  title: string
  subtitle: string
  onClose: () => void
}) => (
  <div className="flex items-start gap-3">
    <div className="min-w-0 flex-1">
      <p className="text-brand text-[11.5px] font-bold tracking-[0.08em]">{eyebrow}</p>
      <h3 className="mt-0.5 text-ink-strong text-[24px] font-bold tracking-[-0.02em]">{title}</h3>
      <p className="mt-0.5 text-[13px] text-gray-600 dark:text-white/60 break-keep">{subtitle}</p>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="닫기"
      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
    >
      <span className="material-icons-round" style={{ fontSize: 20 }}>close</span>
    </button>
  </div>
)

export const DetailBlock = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-4">
    <h4 className="text-[12px] font-bold text-gray-500 dark:text-white/50 tracking-[0.04em]">{title}</h4>
    <div className="mt-1 text-[13.5px] text-ink leading-[1.65] break-keep">{children}</div>
  </section>
)

/** 브랜드 테두리 강조 상자 — "구속사의 흐름에서", "견해" 같은 덧붙임 */
export const NoteBox = ({ label, children, refText, onNavigate }: { label: string; children: ReactNode; refText?: string; onNavigate?: () => void }) => (
  <div className="mt-4 rounded-xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-3.5 py-3">
    <p className="text-brand text-[11.5px] font-bold tracking-[0.08em]">{label}</p>
    <p className="mt-1 text-[13.5px] text-ink leading-[1.65] break-keep">{children}</p>
    {refText && <RefLink refText={refText} onNavigate={onNavigate} />}
  </div>
)

/** "창세기 49:10" → 해당 장·절로 이동하는 작은 링크 */
export const RefLink = ({
  refText,
  onNavigate,
  className = 'mt-1',
  tone = 'brand',
}: {
  refText: string
  onNavigate?: () => void
  className?: string
  /** onColor — 지파 색 카드 위 흰 글씨 */
  tone?: 'brand' | 'onColor'
}) => {
  const navigate = useNavigate()
  const parsed = useMemo(() => parseBibleReference(refText), [refText])
  const color = tone === 'onColor' ? 'text-white/85 hover:text-white' : 'text-brand'
  if (!parsed?.bookNumber)
    return <span className={`${className} block text-[12px] ${tone === 'onColor' ? 'text-white/80' : 'text-gray-500'}`}>{refText}</span>
  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.()
        navigate(`/bible/${parsed.bookNumber}/${parsed.chapter}${parsed.verse ? `?verse=${parsed.verse}` : ''}`)
      }}
      className={`${className} inline-flex items-center gap-0.5 text-[12px] font-semibold ${color} hover:underline`}
    >
      <span className="material-icons-round" style={{ fontSize: 14 }}>auto_stories</span>
      {refText}
    </button>
  )
}

/** 모바일 시트 — 뒤로가기로 시트만 닫힌다(useModalBackButton) */
export const DetailSheet = ({
  children,
  onClose,
  scrollKey,
}: {
  children: ReactNode
  onClose: () => void
  /** 바뀌면 시트 안을 맨 위로 — 시트 안에서 다음 카드로 넘어갈 때 */
  scrollKey?: string
}) => {
  useModalBackButton(onClose)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [scrollKey])
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="max-h-[88vh] rounded-t-[28px] bg-background-light dark:bg-card-dark border-t border-x border-gray-200 dark:border-white/[0.08] flex flex-col overflow-hidden shadow-[0_-20px_60px_-10px_var(--brand-glow)]">
          <div className="flex-shrink-0 flex justify-center py-2.5">
            <SheetGrabber onClose={onClose} className="w-10 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
          </div>
          <div ref={scrollRef} className="overflow-y-auto overscroll-contain">{children}</div>
        </div>
      </motion.div>
    </>
  )
}
