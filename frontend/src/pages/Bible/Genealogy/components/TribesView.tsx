import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CAMP_SIDES,
  CAMP_SIDE_OF,
  TRIBE_BY_ID,
  TRIBE_COLOR,
  TRIBE_LISTS,
  splitMeaning,
  tribeBadge,
  type Tribe,
  type TribeId,
  type TribeListId,
} from '../tribes'
import { DetailSheet, ListPicker, RefLink } from './twelveShared'
import { useIsDesktop } from './useIsDesktop'
import TribeCampMap from './tribes/TribeCampMap'
import { TribeStoryBody, TribeStoryHero } from './tribes/TribeStory'

// /bible/genealogy?view=tribes — 열두 지파.
// 기본은 민수기 2장 광야 진영 배치도(가운데 회막, 사방에 세 지파씩)에서 지파를 고르고,
// 지파 색 "이야기 카드"로 읽는다(모바일: 아래 미리보기 → 시트 / PC: 오른쪽 패널).
// 다른 목록(야곱의 아들·땅 분배·인 맞은 자)은 같은 카드 문법의 격자로 보여 준다.
// 가계도 노선(아담→예수 한 줄)에는 곁가지를 붙이지 않는다는 원칙이라 별도 보기로 둔다.

const LIST_ORDER: TribeListId[] = ['camp', 'sons', 'land', 'sealed']
const LISTS = LIST_ORDER.map((id) => TRIBE_LISTS.find((l) => l.id === id)!)

const CARD = 'rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08]'

interface Props {
  selectedId: TribeId | null
  onSelect: (id: TribeId | null) => void
}

/** 다음에 읽을 지파 — 진영 보기면 같은 진영 다음(끝이면 다음 진영 기수), 아니면 목록 순서 */
const nextOf = (tribe: Tribe, listId: TribeListId): { tribe: Tribe; label: string } | null => {
  if (listId === 'camp') {
    const side = CAMP_SIDE_OF.get(tribe.id)
    if (side) {
      const i = side.members.indexOf(tribe.id)
      if (i < side.members.length - 1) {
        return { tribe: TRIBE_BY_ID.get(side.members[i + 1])!, label: `같은 ${side.label} 진영 · 다음` }
      }
      const nextSide = CAMP_SIDES[(CAMP_SIDES.indexOf(side) + 1) % CAMP_SIDES.length]
      return { tribe: TRIBE_BY_ID.get(nextSide.members[0])!, label: `다음 진영 · ${nextSide.label} 기수` }
    }
  }
  const list = TRIBE_LISTS.find((l) => l.id === listId)!
  const i = list.members.indexOf(tribe.id)
  const nextId = list.members[(i + 1) % list.members.length]
  return { tribe: TRIBE_BY_ID.get(nextId)!, label: `다음 · ${list.label}` }
}

const TribesView = ({ selectedId, onSelect }: Props) => {
  const [listId, setListId] = useState<TribeListId>('camp')
  const list = LISTS.find((l) => l.id === listId)!
  const isDesktop = useIsDesktop()

  // 선택이 없으면 유다(목록에 없으면 목록 첫 지파)를 보여 준다 — 빈 카드 대신 바로 읽을 거리
  const fallbackId: TribeId = list.members.includes('judah') ? 'judah' : list.members[0]
  const shown = TRIBE_BY_ID.get(selectedId ?? fallbackId)!
  const next = useMemo(() => nextOf(shown, listId), [shown, listId])

  // 모바일 시트: 배치도에서 고르면 아래 미리보기만 바뀌고, "이야기 펼치기"로 연다.
  // 사전 칩처럼 주소(?tribe=)로 들어온 선택은 바로 시트를 연다.
  const [sheetOpen, setSheetOpen] = useState(() => selectedId !== null)
  const [tapped, setTapped] = useState<TribeId | null>(null)
  const [seenId, setSeenId] = useState(selectedId)
  if (selectedId !== seenId) {
    setSeenId(selectedId)
    if (selectedId && selectedId !== tapped) setSheetOpen(true)
  }
  const pick = (id: TribeId) => {
    setTapped(id)
    onSelect(id)
  }

  // PC 패널은 다른 지파로 바뀌면 맨 위부터
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 })
  }, [shown.id])

  const closeSheet = () => setSheetOpen(false)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 min-w-0 flex flex-col gap-4">
          <ListPicker
            title={listId === 'camp' ? '하나님을 가운데 두고 사방으로 진을 친 열두 지파' : '"열두 지파"는 목록마다 조금씩 달라요'}
            subtitle="요셉은 두 아들로 나뉘고, 레위는 땅 대신 성막을 섬겨요. 목록을 골라 보세요."
            lists={LISTS}
            value={listId}
            onChange={setListId}
          />

          {listId === 'camp' ? (
            <CampCard selectedId={shown.id} onPick={pick} />
          ) : (
            <TribeGrid members={list.members} selectedId={shown.id} onPick={pick} />
          )}

          <div className="lg:hidden">
            <TribeStoryHero tribe={shown} variant="peek" onOpen={() => setSheetOpen(true)} />
          </div>
        </div>

        <aside className="hidden lg:block lg:col-span-2 min-w-0">
          <div
            ref={panelRef}
            className={`${CARD} sticky lg:top-[4.5rem] max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain !rounded-[28px]`}
          >
            <TribeStoryHero tribe={shown} variant="full" />
            <TribeStoryBody tribe={shown} next={next} onSelect={pick} />
          </div>
        </aside>
      </div>

      {sheetOpen && !isDesktop && (
        <DetailSheet onClose={closeSheet} scrollKey={shown.id}>
          <div className="relative">
            <TribeStoryHero tribe={shown} variant="full" onNavigate={closeSheet} />
            <button
              type="button"
              onClick={closeSheet}
              aria-label="닫기"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/15 text-white flex items-center justify-center"
            >
              <span className="material-icons-round" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
          <TribeStoryBody tribe={shown} next={next} onSelect={pick} onNavigate={closeSheet} />
        </DetailSheet>
      )}
    </>
  )
}

/** 광야 진영 배치도 카드 + 행진 순서 띠 */
const CampCard = ({ selectedId, onPick }: { selectedId: TribeId; onPick: (id: TribeId) => void }) => {
  const side = CAMP_SIDE_OF.get(selectedId)
  const march: { label: string; side: string | null }[] = [
    { label: '① 유다', side: 'east' },
    { label: '② 르우벤', side: 'south' },
    { label: '회막·레위', side: null },
    { label: '③ 에브라임', side: 'west' },
    { label: '④ 단', side: 'north' },
  ]
  return (
    <section className={`${CARD} px-3 pt-3 pb-4 md:px-5 md:pt-4 md:pb-5`}>
      <div className="px-1 pb-2.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-gray-500 dark:text-white/50">민수기 2장 · 위가 북쪽</span>
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-brand">
          <span className="material-icons-round" style={{ fontSize: 15 }}>wb_sunny</span>
          해 뜨는 동쪽이 선두
        </span>
      </div>
      <TribeCampMap selectedId={selectedId} onPick={onPick} />
      <div className="mt-4 px-1">
        <p className="text-[12px] font-bold text-gray-500 dark:text-white/50">행진할 때는 이 순서로</p>
        <div className="mt-2 flex gap-1">
          {march.map((m) => {
            const on = m.side !== null && m.side === side?.id
            return (
              <span
                key={m.label}
                className={[
                  'flex-1 min-w-0 h-9 rounded-[10px] inline-flex items-center justify-center text-[12px] font-bold truncate px-1 transition-colors',
                  m.side === null
                    ? 'bg-gray-900 text-white dark:bg-white/[0.88] dark:text-gray-900'
                    : on
                      ? 'bg-brand text-white'
                      : 'bg-[var(--brand-soft)] text-brand',
                ].join(' ')}
              >
                {m.label}
              </span>
            )
          })}
        </div>
        <div className="mt-1 flex gap-3">
          <RefLink refText="민수기 2:9" />
          <RefLink refText="민수기 2:17" />
        </div>
      </div>
    </section>
  )
}

/** 진영 외 목록 — 같은 색 문법의 지파 격자 */
const TribeGrid = ({
  members,
  selectedId,
  onPick,
}: {
  members: TribeId[]
  selectedId: TribeId
  onPick: (id: TribeId) => void
}) => (
  <section className={`${CARD} p-3 md:p-4`}>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {members.map((id) => {
        const t = TRIBE_BY_ID.get(id)!
        const color = TRIBE_COLOR[id]
        const on = id === selectedId
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            aria-pressed={on}
            className={[
              'min-h-[84px] rounded-2xl px-2.5 py-2.5 text-left flex flex-col transition-[background-color,box-shadow] duration-200',
              on ? 'text-white' : 'bg-gray-100 dark:bg-white/[0.05] text-ink-strong hover:bg-gray-200/70 dark:hover:bg-white/[0.09]',
            ].join(' ')}
            style={on ? { backgroundColor: color, boxShadow: `0 8px 18px ${color}55` } : undefined}
          >
            <span className="inline-flex items-center gap-1 min-w-0">
              <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: on ? '#fff' : color }} />
              <span className={`text-[10.5px] font-bold truncate ${on ? 'text-white/85' : 'text-gray-500 dark:text-white/50'}`}>
                {tribeBadge(t)}
              </span>
            </span>
            <span className="mt-1 text-[16px] font-extrabold tracking-[-0.02em]">{t.name}</span>
            <span className={`mt-auto font-serif-kr text-[12px] font-bold truncate ${on ? 'text-white/85' : 'text-gray-500 dark:text-white/55'}`}>
              {splitMeaning(t.meaning).word}
            </span>
          </button>
        )
      })}
    </div>
  </section>
)

export default TribesView
