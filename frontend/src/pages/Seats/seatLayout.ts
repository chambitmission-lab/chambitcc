// 좌석 배치 규칙 — layout → 좌석 번호·격자.
//
// ★백엔드 app/services/seat_layout.py 와 같은 규칙이다. 한쪽을 바꾸면 반드시 함께 바꾼다.
// 행 r·열 c 는 0부터, 행 0 이 무대에 가장 가깝다. 구역은 무대에서 봤을 때 왼→오른쪽.
//   row_letter (극장식): 행이 알파벳, 번호는 구역을 가로질러 이어진다 → A1 … A16
//   col_letter (세로 줄): 열이 알파벳(구역을 가로질러 이어짐), 번호가 행 → A1 … A11
import type { SeatLabeling, SeatLayout } from '../../types/seatEvent'

export const MAX_SECTIONS = 6
export const MAX_ROWS = 40
export const MAX_COLS = 40

/** 0→A, 25→Z, 26→AA */
export const letters = (index: number): string => {
  let out = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

export const seatLabel = (labeling: SeatLabeling, row: number, colOffset: number): string =>
  labeling === 'col_letter' ? `${letters(colOffset)}${row + 1}` : `${letters(row)}${colOffset + 1}`

export interface SectionGrid {
  name: string
  rows: number
  cols: number
  /** 열 머리글 (col_letter 면 알파벳, row_letter 면 번호) */
  colHeads: string[]
  /** cells[r][c] = 좌석 번호 */
  cells: string[][]
}

export interface SeatGrid {
  sections: SectionGrid[]
  /** 왼쪽 축의 행 머리글 — 모든 구역에 같은 값이 쓰인다 */
  rowHeads: string[]
  maxRows: number
  totalCols: number
  /** 배치도의 모든 칸 (막힌 칸 포함) */
  allLabels: string[]
}

export const buildGrid = (layout: Pick<SeatLayout, 'sections' | 'labeling'>): SeatGrid => {
  const { labeling } = layout
  let offset = 0
  const sections: SectionGrid[] = []
  const allLabels: string[] = []
  for (const section of layout.sections) {
    const cells: string[][] = []
    for (let r = 0; r < section.rows; r++) {
      const row: string[] = []
      for (let c = 0; c < section.cols; c++) {
        const label = seatLabel(labeling, r, offset + c)
        row.push(label)
        allLabels.push(label)
      }
      cells.push(row)
    }
    const colHeads = Array.from({ length: section.cols }, (_, c) =>
      labeling === 'col_letter' ? letters(offset + c) : String(offset + c + 1)
    )
    sections.push({ name: section.name, rows: section.rows, cols: section.cols, colHeads, cells })
    offset += section.cols
  }
  const maxRows = Math.max(0, ...layout.sections.map((s) => s.rows))
  const rowHeads = Array.from({ length: maxRows }, (_, r) =>
    labeling === 'col_letter' ? String(r + 1) : letters(r)
  )
  return { sections, rowHeads, maxRows, totalCols: offset, allLabels }
}

/** 실제로 존재하는 좌석 (막힌 칸 제외) */
export const seatSet = (layout: SeatLayout): Set<string> => {
  const disabled = new Set(layout.disabled)
  return new Set(buildGrid(layout).allLabels.filter((l) => !disabled.has(l)))
}

const sortKey = (label: string): [number, string, number] => {
  const m = /^([A-Z]+)(\d+)$/.exec(label)
  if (!m) return [99, label, 0]
  return [m[1].length, m[1], Number(m[2])]
}

/** A2 < A10 < B1 — 사람이 읽는 순서 */
export const sortSeats = (labels: Iterable<string>): string[] =>
  [...labels].sort((a, b) => {
    const [la, ha, na] = sortKey(a)
    const [lb, hb, nb] = sortKey(b)
    return la - lb || ha.localeCompare(hb) || na - nb
  })

/** 좌석 번호의 "줄" 이름 — 예약 요약에서 "3번 줄 D·E·F" 처럼 묶을 때 */
export const seatLine = (labeling: SeatLabeling, label: string): string => {
  const m = /^([A-Z]+)(\d+)$/.exec(label)
  if (!m) return label
  return labeling === 'col_letter' ? `${m[2]}번 줄` : `${m[1]}열`
}

// ── 배치 프리셋 ───────────────────────────────────────────────────────

export interface LayoutPreset {
  key: string
  label: string
  hint: string
  layout: SeatLayout
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    key: 'two-blocks',
    label: '본당 좌우 2블록',
    hint: '가운데 통로를 두고 8줄씩 · A~P × 1~11 (기존 예약 사이트와 같은 번호)',
    layout: {
      sections: [
        { name: '왼쪽', rows: 11, cols: 8 },
        { name: '오른쪽', rows: 11, cols: 8 },
      ],
      labeling: 'col_letter',
      disabled: [],
      held: [],
      stage_label: '무대',
    },
  },
  {
    key: 'three-blocks',
    label: '극장식 3블록',
    hint: '가운데 넓게, 양옆 좁게 · A열 1번부터',
    layout: {
      sections: [
        { name: '왼쪽', rows: 12, cols: 4 },
        { name: '가운데', rows: 12, cols: 10 },
        { name: '오른쪽', rows: 12, cols: 4 },
      ],
      labeling: 'row_letter',
      disabled: [],
      held: [],
      stage_label: '무대',
    },
  },
  {
    key: 'one-block',
    label: '한 블록 (소예배실)',
    hint: '통로 없이 한 덩어리 · A열 1번부터',
    layout: {
      sections: [{ name: '좌석', rows: 8, cols: 10 }],
      labeling: 'row_letter',
      disabled: [],
      held: [],
      stage_label: '강단',
    },
  },
]

// ── 나란히 앉을 자리 찾기 ─────────────────────────────────────────────

/**
 * 같은 줄에서 통로를 넘지 않고 이어진 빈자리 count 개를 찾는다.
 * 무대에 가까울수록, 가운데에 가까울수록 좋은 자리로 본다.
 * 찾지 못하면 null.
 */
export const findTogether = (
  layout: Pick<SeatLayout, 'sections' | 'labeling'>,
  count: number,
  isFree: (label: string) => boolean
): string[] | null => {
  if (count < 1) return null
  const grid = buildGrid(layout)
  const center = (grid.totalCols - 1) / 2
  let best: { labels: string[]; score: number } | null = null
  let offset = 0
  for (const section of grid.sections) {
    for (let r = 0; r < section.rows; r++) {
      const row = section.cells[r]
      for (let c = 0; c + count <= section.cols; c++) {
        const window = row.slice(c, c + count)
        if (!window.every(isFree)) continue
        const mid = offset + c + (count - 1) / 2
        const score = r * 100 + Math.abs(mid - center)
        if (!best || score < best.score) best = { labels: window, score }
      }
    }
    offset += section.cols
  }
  return best?.labels ?? null
}
