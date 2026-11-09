// 디지털 주보 PC 편집기 — 붙여넣기·요일 정규화 등 순수 함수
import type { AnnouncementItem } from '../../../../types/digitalBulletin'

export const DAYS = ['월', '화', '수', '목', '금', '토', '주일'] as const

export const normalizeDay = (raw: string) => {
  const s = raw.replace(/[()\s]/g, '').replace(/요일$/, '')
  if (s === '일' || s === '주일') return '주일'
  return (DAYS as readonly string[]).includes(s) ? s : raw.trim()
}
export const dayOrder = (day: string) => {
  const i = (DAYS as readonly string[]).indexOf(normalizeDay(day))
  return i === -1 ? 99 : i
}

/** 클립보드 표 → 셀 2차원 배열. 엑셀·한글·구글시트는 탭 구분, 그 외엔 | 나 2칸 이상 공백도 받아준다 */
export const parseTable = (text: string): string[][] => {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '')
  if (text.includes('\t')) return lines.map(l => l.split('\t').map(c => c.trim()))
  if (text.includes('|')) return lines.map(l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim()))
  return lines.map(l => l.trim().split(/ {2,}/))
}

/** 소식 글 붙여넣기 → "1. 제목" 으로 시작하는 줄마다 새 항목, 번호가 없으면 빈 줄로 나눈다. 첫 줄 = 제목 */
export const parseAnnouncements = (text: string): AnnouncementItem[] => {
  const lines = text.replace(/\r/g, '').split('\n')
  const numbered = lines.some(l => /^\s*\d+\s*[.)]\s*\S/.test(l))
  const blocks: string[][] = []
  let cur: string[] = []
  for (const line of lines) {
    const startsNew = numbered ? /^\s*\d+\s*[.)]\s*\S/.test(line) : line.trim() === ''
    if (startsNew && cur.some(l => l.trim())) {
      blocks.push(cur)
      cur = []
    }
    if (numbered || line.trim()) cur.push(line)
  }
  if (cur.some(l => l.trim())) blocks.push(cur)
  return blocks.map(b => {
    const ls = b.map(l => l.trim())
    const first = ls.findIndex(l => l !== '')
    return { title: ls[first], content: ls.slice(first + 1).join('\n').trim() }
  })
}

export const move = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
