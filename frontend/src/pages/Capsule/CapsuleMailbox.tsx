// 캡슐함 본문 — 검색 + 월별 그룹(접기) + 지난 캡슐 더 보기.
// 편지가 몇 통일 땐 평평한 목록이 가장 좋지만, 쌓이기 시작하면 '언제 도착한 편지'인지가
// 유일한 기억의 실마리가 된다. 그래서 도착한 달로 묶고, 오래된 달은 접어 둔다.
// 도착함은 서버가 한 페이지씩 내려준다 — 화면 맨 아래 [더 보기]로 이어 받는다.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CapsuleSummary } from '../../types/timeCapsule'
import type { CapsuleMailboxData } from '../../hooks/useTimeCapsule'
import { useCapsuleSearch } from '../../hooks/useTimeCapsule'
import { daysUntil } from './capsuleDates'
import { ArrivedRow, SealedRow } from './CapsuleMailRows'
import { defaultOpenKeys, groupByMonth } from './capsuleGroups'
import type { CapsuleGroup } from './capsuleGroups'

// 이 수보다 적으면 검색창은 도움이 아니라 소음이다
const SEARCH_MIN_ITEMS = 4
const DEBOUNCE_MS = 250

/** 다음 페이지를 이어 받는 손잡이 — 검색 결과에도 같은 것을 쓴다 */
export interface CapsulePaging {
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

const useDebounced = (value: string, ms: number) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`capsule-group__chevron${open ? ' is-open' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

/** 지난 캡슐 더 보기 — 남은 수를 밝혀서 '얼마나 더 있는지'를 먼저 알려준다 */
const LoadMore = ({
  remaining,
  loading,
  onClick,
}: {
  remaining: number
  loading: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="capsule-more"
    aria-busy={loading}
  >
    {loading ? (
      '불러오는 중…'
    ) : (
      <>
        지난 캡슐 더 보기
        {remaining > 0 && <i>{remaining}통 남음</i>}
      </>
    )}
  </button>
)

/** 접힌 그룹이 무엇을 감추고 있는지 한 줄로 — 헤더만 남으면 열어볼 이유가 없다 */
const peekLabel = (items: CapsuleSummary[]): string => {
  const first = items[0]
  const name =
    first.title ||
    (first.role === 'self'
      ? '미래의 나에게'
      : first.role === 'sender'
        ? `${first.recipient_name || '소중한 분'}에게`
        : `${first.sender_name}님의 편지`)
  return items.length > 1 ? `${name} 외 ${items.length - 1}통` : name
}

/**
 * 그룹 접기 상태. 달이 새로 생기거나 목록이 바뀌면 기본값(맨 위·안 읽음·다섯 통)으로
 * 다시 계산한다 — 사용자가 접어 둔 것을 억지로 유지하다 새 편지를 숨기는 편이 더 나쁘다.
 * 단, [더 보기]로 늘어난 그룹은 방금 사용자가 요청한 것이므로 언제나 펼쳐 준다.
 */
const useGroupOpenState = (groups: CapsuleGroup[]) => {
  const signature = groups.map((g) => `${g.key}:${g.items.length}:${g.unread}`).join('|')
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(defaultOpenKeys(groups)))
  const lastSignature = useRef(signature)
  const lastKeys = useRef(groups.map((g) => g.key))

  useEffect(() => {
    if (lastSignature.current === signature) return
    const keys = groups.map((g) => g.key)
    const current = new Set(keys)
    // 목록이 '늘어나기만' 했다면 [더 보기]를 누른 결과다 — 그때 사용자가 열어 둔
    // 서랍을 닫아 버리면 방금 요청한 것을 뺏는 셈이 된다. 새로 나타난 달만 열어 준다.
    const appendedOnly = lastKeys.current.every((k) => current.has(k))
    const added = keys.filter((k) => !lastKeys.current.includes(k))
    lastSignature.current = signature
    lastKeys.current = keys
    setOpenKeys((prev) =>
      appendedOnly ? new Set([...prev, ...added]) : new Set(defaultOpenKeys(groups)),
    )
    // groups는 signature가 같으면 내용도 같다 (파생 배열이라 참조만 매번 바뀐다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const allOpen = groups.every((g) => openKeys.has(g.key))
  const toggleAll = () => setOpenKeys(allOpen ? new Set() : new Set(groups.map((g) => g.key)))

  return { openKeys, toggle, allOpen, toggleAll }
}

interface SectionProps {
  eyebrow: string
  description: string
  badge?: React.ReactNode
  groups: CapsuleGroup[]
  kind: 'arrived' | 'sealed'
  footer?: React.ReactNode
  footnote?: string
}

const GroupedSection = ({
  eyebrow,
  description,
  badge,
  groups,
  kind,
  footer,
  footnote,
}: SectionProps) => {
  const { openKeys, toggle, allOpen, toggleAll } = useGroupOpenState(groups)
  const grouped = groups.length > 1

  return (
    <section className="px-4 pt-7">
      <div className="px-1 mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
          <p className="text-[12.5px] mt-1 leading-[1.6] text-[var(--text-body)] break-keep">
            {description}
          </p>
        </div>
        {badge}
      </div>

      {grouped && (
        <div className="px-1 mb-2 flex justify-end">
          <button type="button" onClick={toggleAll} className="capsule-group__all">
            {allOpen ? '모두 접기' : '모두 펼치기'}
          </button>
        </div>
      )}

      <div className={grouped ? 'space-y-2' : 'space-y-2.5'}>
        {groups.map((group) => {
          const open = !grouped || openKeys.has(group.key)
          const rows = (
            // PC(lg+)에서는 2열 — 편지 한 통은 좁아야 읽히는 카드라 넓히지 않고 늘린다
            <div className="capsule-list">
              {group.items.map((c) =>
                kind === 'arrived' ? (
                  <ArrivedRow key={c.id} capsule={c} />
                ) : (
                  <SealedRow key={c.id} capsule={c} />
                ),
              )}
            </div>
          )

          if (!grouped) return <div key={group.key}>{rows}</div>

          return (
            <div key={group.key} className={`capsule-group${open ? ' is-open' : ''}`}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                className="capsule-group__head"
                aria-expanded={open}
              >
                <span className="capsule-group__title">
                  <span className="capsule-group__label">
                    {group.label}
                    {group.hint && <i>{group.hint}</i>}
                  </span>
                  {!open && <span className="capsule-group__peek">{peekLabel(group.items)}</span>}
                </span>
                <span className="capsule-group__meta">
                  {group.unread > 0 && <b className="capsule-group__unread">{group.unread}</b>}
                  <span className="capsule-group__count">{group.items.length}통</span>
                  <Chevron open={open} />
                </span>
              </button>
              {open && <div className="capsule-group__body">{rows}</div>}
            </div>
          )
        })}
      </div>

      {footer}

      {footnote && (
        <p className="px-1 mt-2.5 text-[11px] text-[var(--text-muted)] leading-[1.6] break-keep">
          {footnote}
        </p>
      )}
    </section>
  )
}

const SearchResults = ({
  keyword,
  data,
  busy,
  paging,
  onClear,
}: {
  keyword: string
  data?: CapsuleMailboxData
  busy: boolean
  paging: CapsulePaging
  onClear: () => void
}) => {
  const arrived = data?.arrived ?? []
  const sealed = data?.sealed ?? []
  const arrivedTotal = data?.arrivedTotal ?? arrived.length
  const total = arrivedTotal + sealed.length

  // 첫 검색은 손에 든 결과가 없다 — 빈 결과와 구분해서 기다리는 티를 낸다
  if (total === 0 && busy) {
    return (
      <section className="px-4 pt-6" aria-busy>
        <div className="capsule-list">
          <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </section>
    )
  }

  if (total === 0) {
    return (
      <section className="px-4 pt-6">
        <div className="p-7 rounded-2xl bg-[var(--surface-container)] border border-[var(--card-border)] text-center">
          <p className="text-[13.5px] font-bold text-ink-strong break-keep">
            ‘{keyword}’와 맞는 편지가 없어요
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-[1.6] break-keep">
            제목·주고받은 분 이름·개봉 라벨로 찾아요.
            <br />
            편지 내용은 도착한 캡슐에서만 검색돼요.
          </p>
          <button type="button" onClick={onClear} className="capsule-group__all mt-3.5">
            검색 지우기
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 pt-6" aria-busy={busy}>
      <p className="px-1 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
        ‘{keyword}’ 검색 결과 {total}통
      </p>

      <div
        className={`mt-2.5 flex flex-col gap-2.5${busy ? ' opacity-60 transition-opacity' : ''}`}
      >
        {arrived.length > 0 && (
          <>
            <p className="px-1 pt-1 text-[11px] font-bold text-[var(--text-muted)]">
              도착한 캡슐 {arrivedTotal}통
            </p>
            <div className="capsule-list">
              {arrived.map((c) => (
                <ArrivedRow key={c.id} capsule={c} keyword={keyword} />
              ))}
            </div>
            {paging.hasMore && (
              <LoadMore
                remaining={arrivedTotal - arrived.length}
                loading={paging.loadingMore}
                onClick={paging.onLoadMore}
              />
            )}
          </>
        )}
        {sealed.length > 0 && (
          <>
            <p className="px-1 pt-2 text-[11px] font-bold text-[var(--text-muted)]">
              봉인 중인 캡슐 {sealed.length}통
            </p>
            <div className="capsule-list">
              {sealed.map((c) => (
                <SealedRow key={c.id} capsule={c} keyword={keyword} />
              ))}
            </div>
          </>
        )}
      </div>

      <p className="px-1 mt-3 text-[11px] text-[var(--text-muted)] leading-[1.6] break-keep">
        봉인 중인 캡슐은 제목·상대 이름만 찾을 수 있어요. 편지 내용은 도착한 뒤부터 검색돼요.
      </p>
    </section>
  )
}

const CapsuleMailbox = ({
  data,
  paging,
}: {
  data: CapsuleMailboxData
  paging: CapsulePaging
}) => {
  const { sealed, arrived, arrivedTotal, unreadTotal } = data
  const [rawQuery, setRawQuery] = useState('')
  const query = useDebounced(rawQuery.trim(), DEBOUNCE_MS)
  const searching = query.length > 0

  const search = useCapsuleSearch(query)
  const searchPaging: CapsulePaging = {
    hasMore: !!search.hasNextPage,
    loadingMore: search.isFetchingNextPage,
    onLoadMore: () => void search.fetchNextPage(),
  }

  const arrivedGroups = useMemo(() => groupByMonth(arrived), [arrived])
  const sealedGroups = useMemo(() => groupByMonth(sealed), [sealed])

  const nextOpenDday = sealed.length ? Math.min(...sealed.map((c) => daysUntil(c.open_at))) : null
  const showSearch = sealed.length + arrivedTotal >= SEARCH_MIN_ITEMS || searching

  return (
    <>
      {showSearch && (
        <div className="px-4 pt-5">
          <div className="capsule-search">
            <svg
              className="capsule-search__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.4-3.4" />
            </svg>
            <input
              type="search"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="편지 제목·보낸 분·내용으로 찾기"
              aria-label="캡슐 검색"
              className="capsule-search__input"
              maxLength={50}
              enterKeyHint="search"
            />
            {rawQuery && (
              <button
                type="button"
                onClick={() => setRawQuery('')}
                className="capsule-search__clear"
                aria-label="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {searching ? (
        <SearchResults
          keyword={query}
          data={search.data}
          busy={search.isFetching && !search.isFetchingNextPage}
          paging={searchPaging}
          onClear={() => setRawQuery('')}
        />
      ) : (
        <>
          {arrived.length > 0 && (
            <GroupedSection
              kind="arrived"
              eyebrow={`도착한 캡슐 ${arrivedTotal}통`}
              description="지난 날 봉인한 마음이 여기 도착해 있어요"
              groups={arrivedGroups}
              badge={
                unreadTotal > 0 ? (
                  <span className="shrink-0 mt-0.5 px-2.5 py-1 rounded-full bg-[var(--brand-soft-strong)] text-brand text-[11px] font-extrabold">
                    {unreadTotal}통 안 읽음
                  </span>
                ) : undefined
              }
              footer={
                paging.hasMore ? (
                  <LoadMore
                    remaining={arrivedTotal - arrived.length}
                    loading={paging.loadingMore}
                    onClick={paging.onLoadMore}
                  />
                ) : undefined
              }
            />
          )}

          {sealed.length > 0 && (
            <GroupedSection
              kind="sealed"
              eyebrow={`봉인 중인 캡슐 ${sealed.length}통`}
              description="아직 아무도 열어볼 수 없어요. 그날까지 조용히 기다립니다"
              groups={sealedGroups}
              badge={
                nextOpenDday !== null ? (
                  <span className="shrink-0 mt-0.5 px-2.5 py-1 rounded-full bg-[var(--surface-inset)] border border-[var(--card-border)] text-[11px] font-extrabold text-[var(--text-body)] tabular-nums">
                    {nextOpenDday > 0 ? `가장 가까운 개봉 D-${nextOpenDday}` : '오늘 열려요'}
                  </span>
                ) : undefined
              }
              footnote="선물 캡슐은 [초대 전달]로 받는 분께 링크를 보내주세요. 개봉일 아침이 되면 받는 분께 알림이 갑니다."
            />
          )}
        </>
      )}
    </>
  )
}

export default CapsuleMailbox
