// 발자취 120칸을 phase(장) 단위로 묶는다 — 지도는 한 번에 한 장만 그린다.
import type { Tile } from '../../../types/bluemarble'

export interface Chapter {
  index: number
  name: string
  tiles: Tile[]
  start: number
  end: number
}

/** 연속된 같은 phase 를 한 장으로. phase 가 비었거나 한 칸짜리 곁가지 이름이면 앞 장에 붙인다. */
export const buildChapters = (tiles: Tile[]): Chapter[] => {
  const sorted = [...tiles].sort((a, b) => a.position - b.position)
  const chapters: Chapter[] = []
  for (const t of sorted) {
    const last = chapters[chapters.length - 1]
    const name = t.phase?.trim() || last?.name || '여행의 시작'
    if (last && last.name === name) {
      last.tiles.push(t)
      last.end = t.position
      continue
    }
    chapters.push({ index: chapters.length, name, tiles: [t], start: t.position, end: t.position })
  }
  // 한 칸짜리 장(시드의 곁가지 phase 등)은 앞 장에 흡수 — 첫 장(여행의 시작)은 다음 장과 합친다
  const merged: Chapter[] = []
  for (const c of chapters) {
    const prev = merged[merged.length - 1]
    if (c.tiles.length === 1 && prev) {
      prev.tiles.push(...c.tiles)
      prev.end = c.end
    } else if (prev && prev.tiles.length === 1 && prev.index === 0) {
      c.tiles.unshift(...prev.tiles)
      c.start = prev.start
      merged[merged.length - 1] = c
    } else {
      merged.push(c)
    }
  }
  // 곁가지를 흡수하고 나면 같은 이름 장이 나란히 남을 수 있다 — 한 장으로 잇는다
  const joined: Chapter[] = []
  for (const c of merged) {
    const prev = joined[joined.length - 1]
    if (prev && prev.name === c.name) {
      prev.tiles.push(...c.tiles)
      prev.end = c.end
    } else {
      joined.push(c)
    }
  }
  return joined.map((c, i) => ({ ...c, index: i }))
}

export const chapterOf = (chapters: Chapter[], position: number): Chapter | undefined =>
  chapters.find((c) => position >= c.start && position <= c.end) ?? chapters[chapters.length - 1]
