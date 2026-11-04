import type { KeyboardEvent } from 'react'
import { APOSTLE_RELATIONS, INNER_THREE, type ApostleId, type ApostleRelationKind } from '../../apostles'
import { CARD } from '../twelveShared'
import { TONE_COLOR, initialOf, shortName, toneOf } from './apostleTheme'

// 열두 제자 관계도 — 예수님을 가운데 두고 세 겹 원.
// 안쪽: 가까운 세 제자(INNER_THREE) / 가운데: 나머지 아홉 / 점선 바깥: 떠난 자리(유다)·채운 자리(맛디아).
// 각도는 관계 선이 짧고 겹치지 않게 손으로 맞춘 배치(데이터가 아니라 화면 배치라 여기 둔다).

const C = 180
const R_INNER = 58
const R_MID = 114
const R_OUTER = 160

/** 0° = 위, 시계 방향 */
const LAYOUT: Record<ApostleId, [radius: number, deg: number]> = {
  peter: [R_INNER, -12],
  john: [R_INNER, 108],
  james: [R_INNER, 228],
  andrew: [R_MID, 24],
  philip: [R_MID, 66],
  thomas: [R_MID, 106],
  bartholomew: [R_MID, 146],
  matthew: [R_MID, 186],
  simonZealot: [R_MID, 228],
  jamesAlphaeus: [R_MID, 276],
  thaddaeus: [R_MID, 320],
  judas: [R_OUTER, 346],
  matthias: [R_OUTER, 198],
}

const POS = Object.fromEntries(
  (Object.entries(LAYOUT) as [ApostleId, [number, number]][]).map(([id, [r, deg]]) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [id, [C + r * Math.cos(a), C + r * Math.sin(a)]]
  }),
) as Record<ApostleId, [number, number]>

const ORDER = Object.keys(LAYOUT) as ApostleId[]

const RELATION_DASH: Record<ApostleRelationKind, string | undefined> = {
  record: undefined,
  view: '2 3',
  contrast: '7 4',
}

interface Props {
  selectedId: ApostleId | null
  onSelect: (id: ApostleId) => void
}

const ApostleMap = ({ selectedId, onSelect }: Props) => {
  const sel = selectedId
  const related = new Set<ApostleId>()
  if (sel)
    APOSTLE_RELATIONS.forEach((r) => {
      if (r.a === sel) related.add(r.b)
      if (r.b === sel) related.add(r.a)
    })

  const onKey = (id: ApostleId) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <h2 className="text-ink-strong text-[16px] md:text-[17px] font-bold tracking-[-0.01em]">예수님 곁의 열둘</h2>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 leading-[1.6] break-keep">
        안쪽일수록 가까이 따른 제자예요. 이름을 누르면 그 사람의 이야기가 열려요.
      </p>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_176px] gap-4 items-center">
        <svg viewBox="-8 -4 376 376" className="w-full max-w-[560px] mx-auto h-auto select-none" role="group" aria-label="열두 제자 관계도">
          <circle cx={C} cy={C} r={R_INNER + 26} fill="var(--brand-soft)" />
          <circle cx={C} cy={C} r={R_INNER} fill="none" stroke="var(--brand-soft-strong)" />
          <circle cx={C} cy={C} r={R_MID} fill="none" className="stroke-gray-200 dark:stroke-white/10" />
          <circle cx={C} cy={C} r={R_OUTER} fill="none" strokeDasharray="3 4" className="stroke-gray-200 dark:stroke-white/10" />

          {APOSTLE_RELATIONS.map((r) => {
            const on = !!sel && (r.a === sel || r.b === sel)
            const [x1, y1] = POS[r.a]
            const [x2, y2] = POS[r.b]
            return (
              <line
                key={`${r.a}-${r.b}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={on ? 'var(--brand)' : undefined}
                className={on ? '' : 'stroke-gray-400 dark:stroke-white/40'}
                strokeWidth={on ? 2.6 : 1.2}
                strokeDasharray={RELATION_DASH[r.kind]}
                strokeLinecap="round"
                opacity={on ? 1 : sel ? 0.25 : 0.6}
                style={{ transition: 'opacity .2s' }}
              />
            )
          })}

          <circle cx={C} cy={C} r={24} fill="var(--brand)" />
          <text x={C} y={C + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
            예수님
          </text>

          {ORDER.map((id) => {
            const [x, y] = POS[id]
            const on = id === sel
            const fade = !!sel && !on && !related.has(id)
            const tone = toneOf(id)
            return (
              <g
                key={id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`${shortName(id)}${INNER_THREE.includes(id) ? ', 가까운 세 제자' : ''}`}
                onClick={() => onSelect(id)}
                onKeyDown={onKey(id)}
                className="cursor-pointer outline-none [&:focus-visible>circle.dot]:stroke-[var(--brand)]"
                opacity={fade ? 0.45 : 1}
                style={{ transition: 'opacity .2s' }}
              >
                {/* 누르기 쉬운 투명 영역(이름 포함) */}
                <rect x={x - 26} y={y - 22} width={52} height={60} fill="transparent" />
                {on && <circle cx={x} cy={y} r={22} fill="none" stroke="var(--brand)" strokeWidth={2.5} />}
                {tone === 'replacement' && <circle cx={x} cy={y} r={19.5} fill="none" stroke={TONE_COLOR.replacement} strokeWidth={1.5} />}
                <circle
                  className="dot"
                  cx={x}
                  cy={y}
                  r={16.5}
                  fill={TONE_COLOR[tone]}
                  stroke="transparent"
                  strokeWidth={2}
                  strokeDasharray={tone === 'fallen' ? '3 2' : undefined}
                />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#fff">
                  {initialOf(id)}
                </text>
                <text
                  x={x}
                  y={y + 32}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={on ? 800 : 600}
                  className={on ? 'fill-brand' : 'fill-gray-600 dark:fill-white/65'}
                >
                  {shortName(id)}
                </text>
              </g>
            )
          })}
        </svg>

        <MapLegend />
      </div>
    </section>
  )
}

const Dot = ({ color, ring }: { color: string; ring?: boolean }) => (
  <span
    className="w-3 h-3 rounded-full shrink-0"
    style={ring ? { background: 'var(--brand-soft)', border: '1px solid var(--brand)' } : { background: color }}
  />
)

const LineSwatch = ({ dash }: { dash?: string }) => (
  <svg width="26" height="6" className="shrink-0 text-gray-500 dark:text-white/55" aria-hidden>
    <line x1="1" y1="3" x2="25" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray={dash} strokeLinecap="round" />
  </svg>
)

/** PC는 오른쪽 세로 범례, 모바일은 아래 두 줄로 접힌다 */
const MapLegend = () => (
  <div className="flex flex-wrap md:flex-col gap-x-4 gap-y-2 text-[12px] md:text-[12.5px] text-gray-600 dark:text-white/60 break-keep">
    <p className="hidden md:block text-[11.5px] font-bold text-gray-500 dark:text-white/45">원</p>
    <span className="flex items-center gap-2">
      <Dot color="" ring />
      가까운 세 제자
    </span>
    <span className="flex items-center gap-2">
      <Dot color={TONE_COLOR[1]} />
      첫째 묶음
    </span>
    <span className="flex items-center gap-2">
      <Dot color={TONE_COLOR[2]} />
      둘째 묶음
    </span>
    <span className="flex items-center gap-2">
      <Dot color={TONE_COLOR[3]} />
      셋째 묶음
    </span>
    <span className="flex items-center gap-2">
      <Dot color={TONE_COLOR.fallen} />
      떠난 자리
      <Dot color={TONE_COLOR.replacement} />
      채운 자리
    </span>
    <p className="hidden md:block mt-1 text-[11.5px] font-bold text-gray-500 dark:text-white/45">선</p>
    <span className="flex items-center gap-2">
      <LineSwatch />
      성경 기록
    </span>
    <span className="flex items-center gap-2">
      <LineSwatch dash={RELATION_DASH.view} />
      견해
    </span>
    <span className="flex items-center gap-2">
      <LineSwatch dash={RELATION_DASH.contrast} />
      대비(같은 일, 다른 길)
    </span>
  </div>
)

export default ApostleMap
