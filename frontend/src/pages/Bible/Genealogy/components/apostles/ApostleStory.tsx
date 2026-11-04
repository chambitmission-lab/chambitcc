import type { ReactNode } from 'react'
import { APOSTLE_LISTS, INNER_THREE, INNER_THREE_REF, relationsOf, type Apostle, type ApostleId } from '../../apostles'
import { NoteBox, RefLink } from '../twelveShared'
import { ApostleIcon } from './ApostleIcon'
import { TONE_COLOR, TONE_HERO, TONE_LABEL, initialOf, shortName, toneOf } from './apostleTheme'

// 인물 이야기 — PC 오른쪽 패널 / 모바일 전체 시트 공용.
// 머리(묶음 색면+사물 아이콘) → 어떤 사람 → 부르심 → 장면 타임라인 → 함께 엮인 사람 → 네 목록에서의 자리 → 견해.

interface Props {
  apostle: Apostle
  onSelect: (id: ApostleId) => void
  onClose: () => void
  /** 말씀 링크로 떠날 때 — 시트·선택을 모두 닫는다(없으면 onClose) */
  onNavigate?: () => void
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h4 className="text-[12px] font-bold text-gray-500 dark:text-white/50 tracking-[0.04em]">{title}</h4>
    <div className="mt-1.5">{children}</div>
  </section>
)

const ApostleStory = ({ apostle: a, onSelect, onClose, onNavigate = onClose }: Props) => {
  const tone = toneOf(a.id)
  const fallen = tone === 'fallen'
  const rels = relationsOf(a.id)
  const places = APOSTLE_LISTS.map((l) => {
    const k = l.members.indexOf(a.id)
    return { id: l.id, book: l.label.split(' ')[0].replace('복음', ''), place: k < 0 ? null : k + 1 }
  })

  return (
    <article>
      <header
        className={[
          'relative px-5 pt-5 pb-5',
          fallen ? 'bg-gray-50 dark:bg-white/[0.04] border-b border-dashed border-gray-300 dark:border-white/15 text-ink' : 'text-white',
        ].join(' ')}
        style={fallen ? undefined : { background: TONE_HERO[tone] }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={[
            'absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            fallen ? 'text-gray-500 dark:text-white/55 hover:bg-black/5 dark:hover:bg-white/[0.06]' : 'text-white/90 hover:bg-white/15',
          ].join(' ')}
        >
          <span className="material-icons-round" style={{ fontSize: 20 }}>close</span>
        </button>
        <ApostleIcon icon={a.icon} size={52} className={fallen ? 'text-gray-400 dark:text-white/40' : 'text-white'} />
        <p className={`mt-2 text-[12px] font-semibold ${fallen ? 'text-gray-500 dark:text-white/50' : 'text-white/85'}`}>
          {a.badge} · {TONE_LABEL[tone]}
        </p>
        <h3 className="mt-0.5 text-[28px] font-bold tracking-[-0.02em] leading-[1.25]">{a.name}</h3>
        <p className={`mt-0.5 text-[13.5px] break-keep ${fallen ? 'text-gray-600 dark:text-white/60' : 'text-white/90'}`}>{a.tagline}</p>
        {a.otherNames && (
          <p className={`mt-1.5 text-[12px] break-keep ${fallen ? 'text-gray-500 dark:text-white/50' : 'text-white/80'}`}>
            다른 이름 · {a.otherNames}
          </p>
        )}
      </header>

      <div className="px-5 pt-4 pb-6 flex flex-col gap-5 text-[13.5px] text-ink leading-[1.65] break-keep">
        <Section title="어떤 사람이었나">
          <p>{a.background}</p>
        </Section>

        {a.calling && (
          <Section title={a.special === 'replacement' ? '세워짐' : '부르심'}>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-400/[0.08] px-3.5 py-3">
              <p>{a.calling.summary}</p>
              <RefLink refText={a.calling.ref} onNavigate={onNavigate} />
            </div>
          </Section>
        )}

        {a.scenes.length > 0 && (
          <Section title={`성경에 기록된 장면 ${a.scenes.length}`}>
            <ol>
              {a.scenes.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[16px_1fr] gap-2.5">
                  <span className="flex flex-col items-center" aria-hidden>
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${fallen ? 'bg-gray-400 dark:bg-white/35' : 'bg-brand'}`} />
                    {i < a.scenes.length - 1 && <span className="flex-1 w-0.5 my-1 bg-gray-200 dark:bg-white/10" />}
                  </span>
                  <div className="pb-3.5 text-gray-600 dark:text-white/65">
                    <span className="block text-ink-strong text-[14px] font-bold">{s.title}</span>
                    {s.note}
                    <div className="mt-0.5">
                      <RefLink refText={s.ref} onNavigate={onNavigate} className="" />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {rels.length > 0 && (
          <Section title="함께 엮인 사람">
            <ul className="flex flex-col gap-1.5">
              {rels.map((r) => {
                const other = r.a === a.id ? r.b : r.a
                return (
                  <li key={`${r.a}-${r.b}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(other)}
                      className="w-full flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07] px-3 py-2.5 text-left transition-colors"
                    >
                      <span
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[11.5px] font-extrabold"
                        style={{ background: TONE_COLOR[toneOf(other)] }}
                        aria-hidden
                      >
                        {initialOf(other)}
                      </span>
                      <span className="min-w-0 flex-1 text-[13px]">
                        <b className="text-ink-strong">{shortName(other)}</b> · {r.label}
                        {r.kind === 'view' && <span className="ml-1 text-[11px] font-bold text-gray-500 dark:text-white/45">견해</span>}
                        <span className="block text-[11.5px] font-semibold text-brand">{r.ref}</span>
                      </span>
                      <span className="material-icons-round text-gray-400 dark:text-white/35" style={{ fontSize: 18 }}>chevron_right</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Section>
        )}

        <Section title="네 목록에서의 자리">
          <div className="grid grid-cols-4 gap-1.5">
            {places.map((p) => (
              <div key={p.id} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] py-2 text-center">
                <span className={`block font-bold tabular-nums ${p.place ? 'text-ink-strong text-[18px]' : 'text-gray-400 dark:text-white/35 text-[14px] leading-[27px]'}`}>
                  {p.place ? `${p.place}번` : '없음'}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-white/50">{p.book}</span>
              </div>
            ))}
          </div>
        </Section>

        {INNER_THREE.includes(a.id) && (
          <NoteBox label="가장 가까운 세 제자" refText={INNER_THREE_REF} onNavigate={onNavigate}>
            베드로·야고보·요한은 야이로의 딸을 살리실 때, 변화산에서, 겟세마네에서 예수님 곁에 따로 있었어요.
          </NoteBox>
        )}

        {a.view && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/15 px-3.5 py-3 text-[13px] text-gray-600 dark:text-white/65">
            <span className="mr-1.5 text-[11px] font-bold text-gray-500 dark:text-white/45">견해</span>
            {a.view}
          </div>
        )}
      </div>
    </article>
  )
}

export default ApostleStory
