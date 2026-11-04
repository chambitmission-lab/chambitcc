import type { KeyboardEvent } from 'react'
import { APOSTLE_LISTS, APOSTLE_LIST_NOTES, type ApostleId } from '../../apostles'
import { CARD, RefLink } from '../twelveShared'
import { TONE_COLOR, shortName, toneOf } from './apostleTheme'

// 네 목록 순서 흐름(bump chart) — 예전 목록 탭(ListPicker)을 대신한다.
// 같은 사람을 네 목록(마·막·눅·행)에 걸쳐 선으로 잇는다. 넷씩 세 묶음은 띠로 깔고,
// 유다의 선은 누가복음에서 끊기고 사도행전 12번 자리에 맛디아가 들어온다.

const ROW_H = 20.5
const TOP = 46
const Y = (i: number) => TOP + i * ROW_H
const GROUP_BANDS = [0, 4, 8]
const BAND_COLORS = [TONE_COLOR[1], TONE_COLOR[2], TONE_COLOR[3]]

/** 열 머리 — "마태복음 10장" → 넓으면 "마태복음", 좁으면 "마태" */
const colLabel = (label: string, wide: boolean) => {
  const book = label.split(' ')[0]
  return wide ? book : book.replace('복음', '')
}
/** "마태복음 10:2" → "10:2" */
const verseOnly = (ref: string) => ref.split(' ').pop() ?? ref

interface Props {
  selectedId: ApostleId | null
  onSelect: (id: ApostleId) => void
  wide: boolean
}

const ApostleListFlow = ({ selectedId, onSelect, wide }: Props) => {
  const W = wide ? 620 : 340
  const L = wide ? 120 : 82
  const R = wide ? 30 : 16
  const X = (i: number) => L + i * ((W - L - R) / (APOSTLE_LISTS.length - 1))
  const first = APOSTLE_LISTS[0].members
  const last = APOSTLE_LISTS[APOSTLE_LISTS.length - 1]
  const lineIds = Array.from(new Set(APOSTLE_LISTS.flatMap((l) => l.members)))

  const pointsOf = (id: ApostleId) =>
    APOSTLE_LISTS.map((l, i) => {
      const k = l.members.indexOf(id)
      return k < 0 ? null : ([X(i), Y(k), k + 1] as const)
    })

  const pathOf = (id: ApostleId) => {
    let d = ''
    let prev = false
    pointsOf(id).forEach((p) => {
      if (p) d += `${prev ? 'L' : 'M'}${p[0]} ${p[1]} `
      prev = !!p
    })
    return d
  }

  const onKey = (id: ApostleId) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  const nameLabel = (id: ApostleId, x: number, y: number, anchor: 'end' | 'middle', extra?: string) => {
    const on = id === selectedId
    return (
      <text
        key={`label-${id}`}
        x={x}
        y={y}
        textAnchor={anchor}
        fontSize={10.5}
        fontWeight={on ? 800 : 500}
        role="button"
        tabIndex={0}
        aria-pressed={on}
        onClick={() => onSelect(id)}
        onKeyDown={onKey(id)}
        className={['cursor-pointer outline-none focus-visible:underline', on ? 'fill-brand' : 'fill-gray-600 dark:fill-white/65'].join(' ')}
        style={!on && id === 'matthias' ? { fill: TONE_COLOR.replacement } : undefined}
      >
        {shortName(id)}
        {extra}
      </text>
    )
  }

  // 고른 사람의 선은 맨 위에 그려야 가려지지 않는다
  const ordered = selectedId ? [...lineIds.filter((id) => id !== selectedId), selectedId] : lineIds

  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <h2 className="text-ink-strong text-[16px] md:text-[17px] font-bold tracking-[-0.01em]">열두 제자 목록은 네 번 나와요</h2>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 leading-[1.6] break-keep">
        순서는 조금씩 달라도 넷씩 세 묶음은 그대로예요. 이름을 누르면 그 사람의 자리 변화가 보여요.
      </p>

      <svg viewBox={`0 0 ${W} ${Y(11) + 34}`} className="mt-3 w-full h-auto select-none" role="group" aria-label="네 목록 순서 비교">
        {GROUP_BANDS.map((s, k) => (
          <rect key={s} x={L - 14} y={Y(s) - 10} width={W - L - R + 28} height={ROW_H * 4} rx={10} fill={BAND_COLORS[k]} opacity={0.08} />
        ))}

        {APOSTLE_LISTS.map((l, i) => (
          <g key={l.id}>
            <text x={X(i)} y={15} textAnchor="middle" fontSize={wide ? 12 : 10.5} fontWeight={800} className="fill-gray-900 dark:fill-white/90">
              {colLabel(l.label, wide)}
            </text>
            <text x={X(i)} y={29} textAnchor="middle" fontSize={9.5} className="fill-brand">
              {verseOnly(l.ref)}
            </text>
          </g>
        ))}

        {ordered.map((id) => {
          const on = id === selectedId
          return (
            <g key={id} opacity={on ? 1 : selectedId ? 0.3 : 0.55} style={{ transition: 'opacity .2s' }}>
              <path
                d={pathOf(id)}
                fill="none"
                stroke={on ? 'var(--brand)' : undefined}
                className={on ? '' : 'stroke-gray-400 dark:stroke-white/40'}
                strokeWidth={on ? 3 : 1.2}
                strokeLinejoin="round"
                strokeDasharray={toneOf(id) === 'fallen' ? '4 3' : undefined}
              />
              {pointsOf(id).map(
                (p, i) =>
                  p && (
                    <g key={i}>
                      <circle cx={p[0]} cy={p[1]} r={on ? 7 : 3.2} fill={on ? 'var(--brand)' : TONE_COLOR[toneOf(id)]} />
                      {on && (
                        <text x={p[0]} y={p[1] + 3.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff">
                          {p[2]}
                        </text>
                      )}
                    </g>
                  ),
              )}
            </g>
          )
        })}

        {first.map((id, k) => nameLabel(id, L - 20, Y(k) + 3.5, 'end'))}
        {last.members
          .filter((id) => !first.includes(id))
          .map((id) => nameLabel(id, X(APOSTLE_LISTS.length - 1), Y(last.members.indexOf(id)) + 24, 'middle', ' ↑'))}
        <text x={(X(2) + X(3)) / 2} y={Y(11) - 8} textAnchor="middle" fontSize={9} className="fill-gray-400 dark:fill-white/40">
          유다 빠짐
        </text>
      </svg>

      <div className="mt-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3.5 py-3">
        <p className="text-[13px] text-ink leading-[1.65] break-keep">
          {selectedId
            ? APOSTLE_LIST_NOTES[selectedId]
            : '네 목록 모두 묶음의 첫 이름이 같아요 — 베드로, 빌립, 알패오의 아들 야고보.'}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3">
          {APOSTLE_LISTS.map((l) => (
            <RefLink key={l.id} refText={l.ref} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ApostleListFlow
