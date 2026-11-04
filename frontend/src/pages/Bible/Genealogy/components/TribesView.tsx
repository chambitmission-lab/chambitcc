import { useMemo, useState } from 'react'
import { MOTHERS, TRIBES, TRIBE_BY_ID, TRIBE_LISTS, type Tribe, type TribeId, type TribeListId } from '../tribes'
import { DetailBlock, DetailHeader, ListPicker, NoteBox, RefLink, TwelveCard, TwelveLayout } from './twelveShared'

// /bible/genealogy?view=tribes — 열두 지파 카드 모음.
// 가계도 노선(아담→예수 한 줄)에는 곁가지를 붙이지 않는다는 원칙이라 별도 보기로 둔다.

const ORDINAL = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째', '열한째', '열두째']

const tribeBadge = (t: Tribe) => (t.parent ? '요셉의 아들' : t.order ? `${ORDINAL[t.order - 1]} 아들` : '')

interface Props {
  selectedId: TribeId | null
  onSelect: (id: TribeId | null) => void
}

const TribesView = ({ selectedId, onSelect }: Props) => {
  const [listId, setListId] = useState<TribeListId>('sons')
  const members = useMemo(() => new Set(TRIBE_LISTS.find((l) => l.id === listId)!.members), [listId])
  const selected = selectedId ? TRIBE_BY_ID.get(selectedId) ?? null : null

  return (
    <TwelveLayout
      onClose={() => onSelect(null)}
      detail={selected && <TribeDetail tribe={selected} onClose={() => onSelect(null)} onSelect={onSelect} />}
      emptyText={
        <>
          지파를 누르면 이름 뜻, 야곱과 모세의 축복,
          <br />
          받은 땅과 그 지파의 사람들을 볼 수 있어요.
        </>
      }
      main={
        <>
          <ListPicker
            title={'"열두 지파"는 목록마다 조금씩 달라요'}
            subtitle="요셉은 두 아들로 나뉘고, 레위는 땅 대신 성막을 섬겨요. 목록을 골라 보세요."
            lists={TRIBE_LISTS}
            value={listId}
            onChange={setListId}
          />
          {MOTHERS.map((mother) => (
            <section key={mother.id}>
              <h3 className="mb-2 flex items-baseline gap-2 px-1">
                <span className="text-ink-strong text-[14px] font-bold">{mother.name}의 아들</span>
                <span className="text-[12px] text-gray-500 dark:text-white/50">{mother.note}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRIBES.filter((t) => t.mother === mother.id).map((t) => (
                  <TwelveCard
                    key={t.id}
                    badge={tribeBadge(t)}
                    name={t.name}
                    tagline={t.tagline}
                    inList={members.has(t.id)}
                    selected={t.id === selectedId}
                    onClick={() => onSelect(t.id === selectedId ? null : t.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      }
    />
  )
}

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
      <DetailHeader
        eyebrow={`${tribeBadge(tribe)} · 어머니 ${mother.name}`}
        title={`${tribe.name} 지파`}
        subtitle={tribe.tagline}
        onClose={onClose}
      />

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
        <NoteBox label="구속사의 흐름에서" refText={tribe.redemptive.ref} onNavigate={onClose}>
          {tribe.redemptive.summary}
        </NoteBox>
      )}
    </div>
  )
}

export default TribesView
