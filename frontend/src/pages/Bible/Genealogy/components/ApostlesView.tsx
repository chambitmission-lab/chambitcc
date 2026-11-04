import { useMemo, useState } from 'react'
import {
  APOSTLE_BY_ID,
  APOSTLE_GROUPS,
  APOSTLE_LISTS,
  INNER_THREE,
  INNER_THREE_REF,
  type Apostle,
  type ApostleId,
  type ApostleListId,
} from '../apostles'
import { DetailBlock, DetailHeader, ListPicker, NoteBox, RefLink, TwelveCard, TwelveLayout } from './twelveShared'

// /bible/genealogy?view=apostles — 열두 제자 카드 모음. 열두 지파(TribesView)와 같은 문법.


interface Props {
  selectedId: ApostleId | null
  onSelect: (id: ApostleId | null) => void
}

const ApostlesView = ({ selectedId, onSelect }: Props) => {
  const [listId, setListId] = useState<ApostleListId>('mt')
  const members = useMemo(() => new Set(APOSTLE_LISTS.find((l) => l.id === listId)!.members), [listId])
  const selected = selectedId ? APOSTLE_BY_ID.get(selectedId) ?? null : null

  return (
    <TwelveLayout
      onClose={() => onSelect(null)}
      detail={selected && <ApostleDetail apostle={selected} onClose={() => onSelect(null)} />}
      emptyText={
        <>
          제자를 누르면 부르심, 성경에 기록된 장면,
          <br />
          다른 이름을 볼 수 있어요.
        </>
      }
      main={
        <>
          <ListPicker
            title="열두 제자 목록은 네 번 나와요"
            subtitle="이름과 순서가 조금씩 달라요. 목록을 골라 보세요."
            lists={APOSTLE_LISTS}
            value={listId}
            onChange={setListId}
          />
          {APOSTLE_GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="mb-2 flex items-baseline gap-2 px-1">
                <span className="text-ink-strong text-[14px] font-bold">{g.title}</span>
                <span className="text-[12px] text-gray-500 dark:text-white/50">{g.note}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {g.members.map((id) => {
                  const a = APOSTLE_BY_ID.get(id)!
                  return (
                    <TwelveCard
                      key={id}
                      badge={a.badge}
                      name={a.name}
                      tagline={a.tagline}
                      inList={members.has(id)}
                      selected={id === selectedId}
                      onClick={() => onSelect(id === selectedId ? null : id)}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </>
      }
    />
  )
}

const ApostleDetail = ({ apostle: a, onClose }: { apostle: Apostle; onClose: () => void }) => {
  const isInner = INNER_THREE.includes(a.id)
  return (
    <div className="px-5 pt-5 pb-6">
      <DetailHeader eyebrow={a.badge} title={a.name} subtitle={a.tagline} onClose={onClose} />

      {a.otherNames && (
        <DetailBlock title="다른 이름">
          <p>{a.otherNames}</p>
        </DetailBlock>
      )}

      <DetailBlock title="어떤 사람이었나">
        <p>{a.background}</p>
      </DetailBlock>

      {a.calling && (
        <DetailBlock title={a.special === 'replacement' ? '세워짐' : '부르심'}>
          <p>{a.calling.summary}</p>
          <RefLink refText={a.calling.ref} onNavigate={onClose} />
        </DetailBlock>
      )}

      {a.scenes.length > 0 && (
        <DetailBlock title="성경에 기록된 장면">
          <ul className="flex flex-col gap-2">
            {a.scenes.map((s) => (
              <li key={s.title} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5">
                <span className="block text-ink-strong text-[13.5px] font-bold">{s.title}</span>
                <span className="block mt-0.5">{s.note}</span>
                <RefLink refText={s.ref} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </DetailBlock>
      )}

      {isInner && (
        <NoteBox label="가장 가까운 세 제자" refText={INNER_THREE_REF} onNavigate={onClose}>
          베드로·야고보·요한은 야이로의 딸을 살리실 때, 변화산에서, 겟세마네에서 예수님 곁에 따로 있었어요.
        </NoteBox>
      )}

      {a.view && <NoteBox label="견해">{a.view}</NoteBox>}
    </div>
  )
}

export default ApostlesView
