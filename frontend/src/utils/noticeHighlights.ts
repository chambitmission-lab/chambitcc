/**
 * 홈 팝업 공지의 "포스터 밖으로 꺼낼 정보" 추출.
 *
 * 관리자는 지금처럼 본문에 `일시: 11월 8일(주일) 오후 2시` / `장소: 본당` 을 쓰고,
 * 성구는 인용으로 `> 하나님이 보시기에 심히 좋았더라 (창 1:31)` 처럼 쓰면 된다 —
 * 새 입력 칸·스키마 없이 본문 문법에서 그대로 읽는다.
 *
 * - rows: 본문의 첫 정보 줄 묶음(일시·장소·대상…) → 팝업 윗단 핵심 표
 * - verse: 출처(책 장:절)로 끝나는 첫 인용 → 제목 아래 성구 한 줄
 * - rest: 위 둘을 뺀 나머지 본문 → 기존 NoticeContent 로 렌더(같은 줄이 두 번 안 보이게)
 * - when: 일시/날짜 줄에서 읽은 날짜(+시각) → D-day, 캘린더 담기
 */
import { matchInfoRow, stripInline, type InfoRow } from './noticeMarkup'

export interface NoticeWhen {
  year: number
  month: number // 1~12
  day: number
  /** 시각을 못 읽으면 null → 종일 일정 */
  hour: number | null
  minute: number
}

export interface NoticeHighlights {
  rows: InfoRow[]
  verse: { text: string; ref: string } | null
  rest: string
  when: NoticeWhen | null
  place: string | null
}

const MAX_ROWS = 4

const QUOTE_RE = /^>\s?(.*)$/
const CALLOUT_RE = /^\[!\s*[A-Za-z가-힣]+\s*\]/
// 끝에 붙은 성경 출처 — (창 1:31) · 창세기 1장 31절 · 요 3:16-17
const VERSE_REF_RE =
  /[(（[]?\s*((?:[1-3]\s?)?[가-힣]{1,6}(?:\s?[1-3]서)?\s*\d{1,3}\s*(?::|장\s*)\s*\d{1,3}(?:\s*[-~]\s*\d{1,3})?\s*절?)\s*[)）\]]?\s*$/

/** KST 오늘 (연·월·일) — 기기 시간대와 무관하게 교회 기준 날짜로 센다 */
const kstToday = () => {
  const d = new Date(Date.now() + 9 * 3600 * 1000)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }
}

const dayNumber = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m - 1, d) / 86400000)

/** '11월 8일(주일) 오후 2시' · '2026.11.8 14:00' · '11/8' 같은 값에서 날짜·시각을 읽는다 */
export const parseNoticeWhen = (value: string): NoticeWhen | null => {
  const v = stripInline(value)
  let year: number | null = null
  let month: number
  let day: number
  const full = /(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/.exec(v)
  const korean = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(v)
  const slash = /(?:^|\D)(\d{1,2})\s*[./]\s*(\d{1,2})(?!\d|\s*[:시])/.exec(v)
  if (full) {
    year = Number(full[1])
    month = Number(full[2])
    day = Number(full[3])
  } else if (korean) {
    month = Number(korean[1])
    day = Number(korean[2])
  } else if (slash) {
    month = Number(slash[1])
    day = Number(slash[2])
  } else {
    return null
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  if (year == null) {
    // 연도가 없으면 올해 — 다만 한 달 넘게 지난 날짜면 내년 일정으로 본다(12월에 올린 1월 공지)
    const t = kstToday()
    year = t.y
    if (dayNumber(year, month, day) < dayNumber(t.y, t.m, t.d) - 30) year += 1
  }

  let hour: number | null = null
  let minute = 0
  // 날짜 부분을 지운 뒤 시각을 찾는다 — '11.8' 의 숫자를 시각으로 잘못 읽지 않게
  const timePart = v.replace(full?.[0] ?? korean?.[0] ?? slash?.[0] ?? '', ' ')
  const hm = /(오전|오후|낮|저녁|밤)?\s*(\d{1,2})\s*:\s*(\d{2})/.exec(timePart)
  const ko = /(오전|오후|낮|저녁|밤|새벽)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분|\s*(반))?/.exec(timePart)
  const t = hm ?? ko
  if (t) {
    let h = Number(t[2])
    const mer = t[1]
    if (mer && mer !== '오전' && mer !== '새벽' && h < 12) h += 12
    if (h <= 23) {
      hour = h
      minute = hm ? Number(hm[3]) : ko?.[3] ? Number(ko[3]) : ko?.[4] ? 30 : 0
    }
  }
  return { year, month, day, hour, minute }
}

/** D-day (오늘 0, 지난 일정은 음수) */
export const noticeDday = (w: NoticeWhen): number => {
  const t = kstToday()
  return dayNumber(w.year, w.month, w.day) - dayNumber(t.y, t.m, t.d)
}

export const extractNoticeHighlights = (source: string): NoticeHighlights => {
  const lines = (source ?? '').replace(/\r\n/g, '\n').split('\n')
  const drop = new Set<number>()

  // 첫 정보 줄 묶음 — 파서와 같은 규칙(빈 줄이 아닌 연속 줄)
  const rows: InfoRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const first = matchInfoRow(lines[i])
    if (!first) continue
    for (let j = i; j < lines.length; j++) {
      const row = matchInfoRow(lines[j])
      if (!row) break
      rows.push(row)
      drop.add(j)
    }
    break
  }
  // 너무 많으면 앞 몇 줄만 윗단으로, 나머지는 본문에 그대로 남긴다
  if (rows.length > MAX_ROWS) {
    const kept = [...drop].sort((a, b) => a - b)
    kept.slice(MAX_ROWS).forEach((i) => drop.delete(i))
    rows.length = MAX_ROWS
  }

  // 출처로 끝나는 첫 인용 묶음 → 성구
  let verse: NoticeHighlights['verse'] = null
  for (let i = 0; i < lines.length && !verse; i++) {
    const q = QUOTE_RE.exec(lines[i].trimEnd())
    if (!q || CALLOUT_RE.test(q[1].trim())) continue
    const idx: number[] = []
    const parts: string[] = []
    for (let j = i; j < lines.length; j++) {
      const m = QUOTE_RE.exec(lines[j].trimEnd())
      if (!m) break
      idx.push(j)
      parts.push(m[1].trim())
    }
    const joined = stripInline(parts.join(' ')).trim()
    const ref = VERSE_REF_RE.exec(joined)
    if (ref && ref.index > 0) {
      const text = joined
        .slice(0, ref.index)
        .trim()
        .replace(/^["“'‘]+|["”'’]+$/g, '')
        .replace(/[\s,—–-]+$/, '')
      if (text) {
        verse = { text, ref: ref[1].replace(/\s+/g, ' ').trim() }
        idx.forEach((k) => drop.add(k))
      }
    }
    i += idx.length - 1
  }

  const rest = lines
    .filter((_, i) => !drop.has(i))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const whenRow =
    rows.find((r) => ['일시', '날짜'].includes(r.label.replace(/\s+/g, ''))) ??
    rows.find((r) => r.label.replace(/\s+/g, '') === '시간')
  const when = whenRow ? parseNoticeWhen(whenRow.value) : null
  const placeRow = rows.find((r) => r.icon === 'place')

  return { rows, verse, rest, when, place: placeRow ? stripInline(placeRow.value) : null }
}

/* ------------------------------------------------------------------ */
/* 캘린더 담기 (.ics)                                                  */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0')
const icsText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** KST 벽시계 → UTC ics 시각 */
const kstToIcsUtc = (y: number, mo: number, d: number, h: number, mi: number) => {
  const dt = new Date(Date.UTC(y, mo - 1, d, h - 9, mi))
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** 기기 캘린더 앱에 바로 등록되는 .ics — 시각이 없으면 종일, 있으면 2시간짜리 */
export const downloadNoticeIcs = (
  notice: { id: number; title: string },
  when: NoticeWhen,
  place: string | null,
): void => {
  const { year: y, month: m, day: d } = when
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  const dates =
    when.hour == null
      ? [
          `DTSTART;VALUE=DATE:${y}${pad(m)}${pad(d)}`,
          `DTEND;VALUE=DATE:${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`,
        ]
      : [
          `DTSTART:${kstToIcsUtc(y, m, d, when.hour, when.minute)}`,
          `DTEND:${kstToIcsUtc(y, m, d, when.hour + 2, when.minute)}`,
        ]
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chambit Church//Notice//KO',
    'BEGIN:VEVENT',
    `UID:chambit-notice-${notice.id}@chambitcc`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    ...dates,
    `SUMMARY:${icsText(notice.title)}`,
    place ? `LOCATION:${icsText(`참빛교회 ${place}`)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${notice.title.replace(/[\\/:*?"<>|]/g, '')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
