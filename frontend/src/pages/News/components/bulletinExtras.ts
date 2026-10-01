// 디지털 주보 '교회 소식' 아래 자유 안내 블록 — 보기(DigitalBulletin)와 PC 편집기가 같이 쓴다.
import type { BulletinData, ExtraBlock, ExtraBlockKind } from '../../../types/digitalBulletin'

export const EXTRA_KIND_LABEL: Record<ExtraBlockKind, string> = {
  list: '번호 목록',
  table: '표',
  note: '안내 글',
}

export const extrasOf = (data: BulletinData): ExtraBlock[] => data.extras ?? []

export const newExtraBlock = (kind: ExtraBlockKind, patch: Partial<ExtraBlock> = {}): ExtraBlock => ({
  kind,
  title: '',
  items: kind === 'list' ? [''] : [],
  columns: kind === 'table' ? ['', ''] : [],
  rows: kind === 'table' ? [['', '']] : [],
  content: '',
  ...patch,
})

/** 종이 주보 하단에 늘 오던 것들 — 빈 칸 대신 틀을 깔아 주는 시작점 */
export const EXTRA_PRESETS: { label: string; make: () => ExtraBlock }[] = [
  {
    label: '정기당회 결정사항',
    make: () => newExtraBlock('list', { title: '정기당회 결정사항' }),
  },
  {
    label: '다음 주 예배 기도 / 주방 봉사',
    make: () =>
      newExtraBlock('table', {
        title: '다음 주 예배 기도 / 주방 봉사',
        columns: ['주일 아침예배', '주일 밤예배', '주일 열린예배', '수요예배', '주방봉사'],
        rows: [['', '', '', '', '']],
      }),
  },
  {
    label: '헌금 계좌 안내',
    make: () => newExtraBlock('note', { title: '헌금 계좌 안내' }),
  },
  {
    label: '주차 안내',
    make: () => newExtraBlock('note', { title: '주차 안내' }),
  },
]

/** 표 행 길이를 열 수에 맞춘다 — 열을 늘리거나 줄인 뒤, 붙여넣기 뒤 */
export const fitRows = (rows: string[][], width: number): string[][] =>
  rows.map(r => Array.from({ length: width }, (_, i) => r[i] ?? ''))

/** 목록 붙여넣기 — 줄마다 항목, 앞의 "1." "①" "-" "•" 같은 머리표는 뗀다. 머리표 없는 줄은 앞 항목에 이어 붙인다 */
export const parseListItems = (text: string): string[] => {
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
  const bullet = /^(\d+\s*[.)]|[①-⑳]|[-•·*])\s*/
  const hasBullets = lines.some(l => bullet.test(l))
  if (!hasBullets) return lines
  const out: string[] = []
  for (const line of lines) {
    if (bullet.test(line) || out.length === 0) out.push(line.replace(bullet, ''))
    else out[out.length - 1] += ' ' + line
  }
  return out
}
