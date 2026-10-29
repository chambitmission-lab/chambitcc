// 캡슐함 본문 — 검색 + 월별 그룹(접기) + 지난 캡슐 더 보기.
// 편지가 몇 통일 땐 평평한 목록이 가장 좋지만, 쌓이기 시작하면 '언제 도착한 편지'인지가
// 유일한 기억의 실마리가 된다. 그래서 도착한 달로 묶고, 오래된 달은 접어 둔다.
// 도착함은 서버가 한 페이지씩 내려준다 — 화면 맨 아래 [더 보기]로 이어 받는다.
// 도착한 편지는 '편지 도착 안내판'(station/CapsuleStation) 안에, 봉인 중인 편지는 그 아래 낮 영역에 놓인다.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CapsuleSummary } from '../../types/timeCapsule'
import type { CapsuleMailboxData } from '../../hooks/useTimeCapsule'
import { useCapsuleSearch } from '../../hooks/useTimeCapsule'
import { ArrivedRow, SealedRow } from './CapsuleMailRows'
import { defaultOpenKeys, groupByMonth, pickNextArrival } from './capsuleGroups'
import type { CapsuleGroup } from './capsuleGroups'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import CapsuleStation from './station/CapsuleStation'

// 이 수보다 적으면 검색창은 도움이 아니라 소음이다
const SEARCH_MIN_ITEMS = 4
const DEBOUNCE_MS = 250

/** 다음 페이지를 이어 받는 손잡이 — 검색 결과에도 같은 것을 쓴다 */
export interface CapsulePaging {
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
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
  eyebrow?: string
  description?: string
  /** 안내판 안에 들어갈 때 — 바깥 여백과 머리글은 안내판이 맡는다 */
  bare?: boolean
  badge?: React.ReactNode
  groups: CapsuleGroup[]
  kind: 'arrived' | 'sealed'
  footer?: React.ReactNode
  footnote?: string
}

const GroupedSection = ({
  eyebrow,
  description,
  bare,
  badge,
  groups,
  kind,
  footer,
  footnote,
}: SectionProps) => {
  const { openKeys, toggle, allOpen, toggleAll } = useGroupOpenState(groups)
  const grouped = groups.length > 1

  return (
    <section className={bare ? undefined : 'px-4 pt-7'}>
      {!bare && (
        <div className="px-1 mb-3 flex items-center gap-2.5">
          {/* 편지가 날아가는 중 — 안내판의 '도착'과 짝을 이루는 '출발' 표시 */}
          <svg className="w-7 h-7 shrink-0 text-brand" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              opacity=".9"
              d="M2.5 11.2 20.6 3.6c.7-.3 1.3.4 1 1.1l-7.6 18c-.3.8-1.4.7-1.6-.1l-1.8-7.1-7.1-1.8c-.8-.2-.9-1.3-.1-1.6z"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16.5px] font-extrabold tracking-[-0.01em] text-ink-strong">
              {eyebrow}
            </h3>
            <p className="text-[11.5px] mt-0.5 leading-[1.5] text-[var(--text-muted)] break-keep">
              {description}
            </p>
          </div>
          {badge}
        </div>
      )}

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
  const query = useDebouncedValue(rawQuery.trim(), DEBOUNCE_MS)
  const searching = query.length > 0

  const search = useCapsuleSearch(query)
  const searchPaging: CapsulePaging = {
    hasMore: !!search.hasNextPage,
    loadingMore: search.isFetchingNextPage,
    onLoadMore: () => void search.fetchNextPage(),
  }

  const arrivedGroups = useMemo(() => groupByMonth(arrived), [arrived])
  const sealedGroups = useMemo(() => groupByMonth(sealed), [sealed])

  const nextArrival = useMemo(() => pickNextArrival(sealed), [sealed])
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
          {/* 캡슐이 하나도 없으면 안내판 대신 CapsuleList 의 빈 상태가 나온다 */}
          {arrived.length + sealed.length > 0 && (
            <CapsuleStation
              next={nextArrival}
              arrivedTotal={arrivedTotal}
              unreadTotal={unreadTotal}
              sealedCount={sealed.length}
            >
              {arrived.length > 0 ? (
                <GroupedSection
                  bare
                  kind="arrived"
                  groups={arrivedGroups}
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
              ) : undefined}
            </CapsuleStation>
          )}

          {sealed.length > 0 && (
            <GroupedSection
              kind="sealed"
              eyebrow={`기다리는 편지 ${sealed.length}통`}
              description="도착할 날을 기다리는 중이에요. 그날까지 아무도 열어볼 수 없어요"
              groups={sealedGroups}
              footnote="선물 캡슐은 [초대 전달]로 받는 분께 링크를 보내주세요. 개봉일 아침이 되면 받는 분께 알림이 갑니다."
            />
          )}
        </>
      )}
    </>
  )
}

export default CapsuleMailbox
