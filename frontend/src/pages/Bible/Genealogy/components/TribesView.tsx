import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MOTHERS,
  TRIBES,
  TRIBE_BY_ID,
  TRIBE_LISTS,
  type Tribe,
  type TribeId,
  type TribeListId,
} from '../tribes'
import { parseBibleReference } from '../../../Sermon/utils/sermonMeta'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { SheetGrabber } from '../../../../components/common/SheetGrabber'

// /bible/genealogy?view=tribes — 열두 지파 카드 모음.
// 가계도 노선(아담→예수 한 줄)에는 곁가지를 붙이지 않는다는 원칙이라 별도 보기로 둔다.

const ORDINAL = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째', '열한째', '열두째']

const useIsDesktop = () => {
  const query = '(min-width: 1024px)'
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

const tribeBadge = (t: Tribe) => (t.parent ? '요셉의 아들' : t.order ? `${ORDINAL[t.order - 1]} 아들` : '')

interface Props {
  selectedId: TribeId | null
  onSelect: (id: TribeId | null) => void
}

const TribesView = ({ selectedId, onSelect }: Props) => {
  const [listId, setListId] = useState<TribeListId>('sons')
  const list = TRIBE_LISTS.find((l) => l.id === listId)!
  const members = useMemo(() => new Set(list.members), [list])
  const selected = selectedId ? TRIBE_BY_ID.get(selectedId) ?? null : null
  const isDesktop = useIsDesktop()

  const groups = useMemo(
    () => MOTHERS.map((m) => ({ mother: m, tribes: TRIBES.filter((t) => t.mother === m.id) })),
    [],
  )

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-w-0 flex flex-col gap-4">
          {/* 어느 목록의 열둘인지 — 목록을 바꾸면 빠지는 지파가 흐려진다 */}
          <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] p-4 md:p-5">
            <h2 className="text-ink-strong text-[16px] md:text-[17px] font-bold tracking-[-0.01em]">
              "열두 지파"는 목록마다 조금씩 달라요
            </h2>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 leading-[1.6]">
              요셉은 두 아들로 나뉘고, 레위는 땅 대신 성막을 섬겨요. 목록을 골라 보세요.
            </p>
            <div className="mt-3 flex gap-1.5 overflow-x-auto -mx-1 px-1 scrollbar-hide" role="tablist" aria-label="지파 목록">
              {TRIBE_LISTS.map((l) => {
                const active = l.id === listId
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setListId(l.id)}
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

          {groups.map(({ mother, tribes }) => (
            <section key={mother.id}>
              <h3 className="mb-2 flex items-baseline gap-2 px-1">
                <span className="text-ink-strong text-[14px] font-bold">{mother.name}의 아들</span>
                <span className="text-[12px] text-gray-500 dark:text-white/50">{mother.note}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tribes.map((t) => (
                  <TribeCard
                    key={t.id}
                    tribe={t}
                    inList={members.has(t.id)}
                    selected={t.id === selectedId}
                    onClick={() => onSelect(t.id === selectedId ? null : t.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* lg+: 우측 sticky 상세 */}
        <aside className="hidden lg:block lg:col-span-1 min-w-0">
          <div className="sticky lg:top-[4.5rem]">
            {selected ? (
              <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain">
                <TribeDetail tribe={selected} onClose={() => onSelect(null)} onSelect={onSelect} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.12] px-5 py-10 text-center">
                <span className="material-icons-round text-brand" style={{ fontSize: 28 }}>groups</span>
                <p className="mt-2 text-[13.5px] text-gray-500 dark:text-white/55 leading-[1.6]">
                  지파를 누르면 이름 뜻, 야곱과 모세의 축복,
                  <br />
                  받은 땅과 그 지파의 사람들을 볼 수 있어요.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 모바일/태블릿: 슬라이드업 시트 */}
      <AnimatePresence>
        {selected && !isDesktop && (
          <TribeSheet key="tribe-sheet" onClose={() => onSelect(null)}>
            <TribeDetail tribe={selected} onClose={() => onSelect(null)} onSelect={onSelect} />
          </TribeSheet>
        )}
      </AnimatePresence>
    </>
  )
}

const TribeCard = ({
  tribe,
  inList,
  selected,
  onClick,
}: {
  tribe: Tribe
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
    <span className="block text-[11px] font-semibold text-gray-500 dark:text-white/50">{tribeBadge(tribe)}</span>
    <span className="mt-0.5 block text-ink-strong text-[18px] font-bold tracking-[-0.02em]">{tribe.name}</span>
    <span className="mt-1 block text-[12px] text-gray-600 dark:text-white/60 leading-[1.5] break-keep">{tribe.tagline}</span>
    {!inList && (
      <span className="absolute top-2.5 right-2.5 text-[10.5px] font-semibold text-gray-500 dark:text-white/50">빠짐</span>
    )}
  </button>
)

const TribeDetail = ({
  tribe,
  onClose,
  onSelect,
}: {
  tribe: Tribe
  onClose: () => void
  onSelect: (id: TribeId) => void
}) => {
  const mother = MOTHERS.find((m) => m.id === tribe.mother)!
  const sons = tribe.id === 'joseph' ? (['ephraim', 'manasseh'] as TribeId[]) : null
  return (
    <div className="px-5 pt-5 pb-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.08em]">
            {tribeBadge(tribe)} · 어머니 {mother.name}
          </p>
          <h3 className="mt-0.5 text-ink-strong text-[24px] font-bold tracking-[-0.02em]">{tribe.name} 지파</h3>
          <p className="mt-0.5 text-[13px] text-gray-600 dark:text-white/60 break-keep">{tribe.tagline}</p>
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

      <DetailBlock title="이름의 뜻">
        <p>{tribe.meaning}</p>
        <RefLink refText={tribe.meaningRef} onNavigate={onClose} />
      </DetailBlock>

      {tribe.jacob && (
        <DetailBlock title={tribe.parent ? '야곱의 축복 (손자로서)' : '야곱의 축복'}>
          <p>{tribe.jacob.summary}</p>
          <RefLink refText={tribe.jacob.ref} onNavigate={onClose} />
        </DetailBlock>
      )}

      {tribe.moses ? (
        <DetailBlock title="모세의 축복">
          <p>{tribe.moses.summary}</p>
          <RefLink refText={tribe.moses.ref} onNavigate={onClose} />
        </DetailBlock>
      ) : (
        tribe.id === 'simeon' && (
          <DetailBlock title="모세의 축복">
            <p className="text-gray-500 dark:text-white/55">신명기 33장 모세의 축복에는 시므온의 이름이 나오지 않아요.</p>
          </DetailBlock>
        )
      )}

      <DetailBlock title="받은 땅">
        <p>{tribe.land.summary}</p>
        <RefLink refText={tribe.land.ref} onNavigate={onClose} />
      </DetailBlock>

      {sons && (
        <div className="mt-3 flex gap-2">
          {sons.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="flex-1 inline-flex items-center justify-center gap-1 h-10 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
            >
              {TRIBE_BY_ID.get(id)!.name} 보기
              <span className="material-icons-round" style={{ fontSize: 16 }}>chevron_right</span>
            </button>
          ))}
        </div>
      )}

      {tribe.people.length > 0 && (
        <DetailBlock title="이 지파의 사람들">
          <ul className="flex flex-col gap-2">
            {tribe.people.map((p) => (
              <li key={p.name} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5">
                <span className="block text-ink-strong text-[13.5px] font-bold">{p.name}</span>
                <span className="block mt-0.5">{p.note}</span>
                <RefLink refText={p.ref} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      {tribe.redemptive && (
        <div className="mt-4 rounded-xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-3.5 py-3">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.08em]">구속사의 흐름에서</p>
          <p className="mt-1 text-[13.5px] text-ink leading-[1.65] break-keep">{tribe.redemptive.summary}</p>
          <RefLink refText={tribe.redemptive.ref} onNavigate={onClose} />
        </div>
      )}
    </div>
  )
}

const DetailBlock = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-4">
    <h4 className="text-[12px] font-bold text-gray-500 dark:text-white/50 tracking-[0.04em]">{title}</h4>
    <div className="mt-1 text-[13.5px] text-ink leading-[1.65] break-keep">{children}</div>
  </section>
)

/** "창세기 49:10" → 해당 장·절로 이동하는 작은 링크 */
const RefLink = ({
  refText,
  onNavigate,
  className = 'mt-1',
}: {
  refText: string
  onNavigate?: () => void
  className?: string
}) => {
  const navigate = useNavigate()
  const parsed = useMemo(() => parseBibleReference(refText), [refText])
  if (!parsed?.bookNumber) return <span className={`${className} block text-[12px] text-gray-500`}>{refText}</span>
  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.()
        navigate(`/bible/${parsed.bookNumber}/${parsed.chapter}${parsed.verse ? `?verse=${parsed.verse}` : ''}`)
      }}
      className={`${className} inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand hover:underline`}
    >
      <span className="material-icons-round" style={{ fontSize: 14 }}>auto_stories</span>
      {refText}
    </button>
  )
}

/** 모바일 시트 — 뒤로가기로 시트만 닫힌다(useModalBackButton) */
const TribeSheet = ({ children, onClose }: { children: ReactNode; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="max-h-[88vh] rounded-t-[28px] bg-background-light dark:bg-card-dark border-t border-x border-gray-200 dark:border-white/[0.08] flex flex-col overflow-hidden shadow-[0_-20px_60px_-10px_var(--brand-glow)]">
          <div className="flex-shrink-0 flex justify-center py-2.5">
            <SheetGrabber onClose={onClose} className="w-10 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
          </div>
          <div className="overflow-y-auto overscroll-contain">{children}</div>
        </div>
      </motion.div>
    </>
  )
}

export default TribesView
