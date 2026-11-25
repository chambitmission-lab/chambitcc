// 주보 소식 원고 → 항목 카드 데이터
// Single Responsibility: 관리자가 붙여 넣은 "1. 제목 / 본문 / * 일시·장소" 원고를 읽어
// 항목(제목·설명·날짜·시간·장소·대상·연락처·종류)으로 나눈다. 순수 함수 — 화면·서버와 무관.
//
// 형식이 맞지 않으면(번호 항목 3개 미만, 번호가 1부터 차례가 아님) null 을 돌려주고
// 화면은 지금처럼 원문을 그대로 보여 준다. 읽어 낸 값이 틀릴 수 있으니 원문은 늘 따로 열 수 있다.
import { formatMonthDay } from '../../../../utils/date'

export type DigestKind = 'worship' | 'prayer' | 'meet' | 'apply' | 'event' | 'share' | 'family' | 'notice'

export interface DigestDate {
  /** 로컬 자정 기준 Date */
  start: Date
  end: Date
  /** 화면용 "11월 2일(월) ~ 4일(수)" */
  label: string
}

/** 줄마다 한 건인 안내(① 일정 / 1) 교우 소식)의 한 줄 */
export interface DigestListEntry {
  /** "정책당회" · "김학순 집사의 시모상" */
  text: string
  /** 줄 머리의 날짜("① 12월 5일(토) : …") — 있으면 왼쪽 날짜 칸 */
  date: Date | null
  /** 기간이면 끝 날("11월 23~27일") */
  endDate: Date | null
  /** '*' 뒤 시간·장소, 또는 끝 괄호 속 소속("1교구 5지구 김영선 구역 · 12여") */
  sub: string | null
}

/** "입원 / 정용숙 집사 …"처럼 머리말로 갈리는 묶음. 머리말 없으면 label null */
export interface DigestListGroup {
  label: string | null
  entries: DigestListEntry[]
}

export interface DigestItem {
  no: number
  title: string
  kind: DigestKind
  /** 본문 중 '*' 앞쪽 설명(날짜·장소만 있던 줄이면 빈 문자열) */
  desc: string
  /** '*' 뒤 세부 안내 중 칩으로 다 옮기지 못한 문장 */
  notes: string[]
  date: DigestDate | null
  time: string | null
  place: string | null
  who: string | null
  contact: { name: string; phone: string } | null
  /** "등록번호 | 새가족 | 인도자" 같은 | 구분 표 — 첫 줄이 머리글 */
  table: string[][] | null
  /** 줄마다 한 건인 목록 — 있으면 desc 아래 목록으로 그린다(문단으로 뭉개지 않게) */
  groups: DigestListGroup[] | null
}

export interface NewsDigest {
  /** 첫 번호 항목 앞에 있던 머리말 */
  intro: string
  items: DigestItem[]
}

const HEADER_RE = /^\s*(\d{1,2})\s*[.)]\s*(\S.*)$/
// "1. 제목" 꼭지가 있는 원고에선 "1) …"은 꼭지 안 하위 줄 — 꼭지로 오인하면 뒤 꼭지들이 앞 항목 쪽지로 빨려 든다
const DOT_HEADER_RE = /^\s*(\d{1,2})\s*\.\s*(\S.*)$/
const MIN_ITEMS = 3

// "11월 2일(월)~4일(수)" · "11월 22일(주일)" · "11월 2일~14일"
const KO_DATE_RE =
  /(\d{1,2})월\s*(\d{1,2})일(?:\s*\([^)]{1,3}\))?(?:\s*[~∼–-]\s*(?:(\d{1,2})월\s*)?(\d{1,2})일(?:\s*\([^)]{1,3}\))?)?/
// "(11/8)" — 전화번호(하이픈)와 겹치지 않게 슬래시만
const SLASH_DATE_RE = /(?<![\d/])(\d{1,2})\/(\d{1,2})(?![\d/]|\s*분기)/
const TIME_RE =
  /(?:(?:오전|오후|새벽|저녁|밤)\s*)?\d{1,2}시(?:\s*\d{1,2}분|\s*반)?(?:\s*[~∼–-]\s*(?:(?:오전|오후|저녁|밤)\s*)?\d{1,2}시(?:\s*\d{1,2}분|\s*반)?)?/
const SERVICE_TIME_RE = /\d부(?:\s*(?:와|과|,)\s*\d부)?\s*예배\s*(?:후|전|시간)/
const PLACE_RE = /(?:\d층\s*)?(?:본당|대예배실|소예배실|당회실|교역자실|목양실|로비|교육관|친교실|식당|기도실|카페|비전홀|소그룹실)/
const WHO_RE = /([가-힣·&\s]{2,12}?)(?:들|분들)?은\s*(?:필히|꼭|반드시)\s*참석/
// 계좌번호(301-0252-3534-41) 속 숫자열을 전화로 오인하지 않게 앞뒤를 막는다
const PHONE_RE = /(?<![\d-])0\d{1,2}-\d{3,4}-\d{4}(?![\d-])/

const KIND_RULES: [DigestKind, RegExp][] = [
  ['family', /교우\s*소식|장례|부고|소천|입원|출산|결혼|혼인/],
  ['apply', /신청|접수|등록|모집/],
  ['prayer', /기도/],
  ['worship', /예배|주일 기념|기념 주일|설립|성찬|세례식/],
  ['event', /대회|야유회|수련회|캠프|음악회|바자|행사|축제|체육|여행|소풍/],
  ['meet', /당회|제직|구역|모임|회의|총회|공동의회|위원회/],
  ['share', /나눔|감사|헌금|노트|후원|봉사|섬김/],
]

const WEEKDAYS = ['주일', '월', '화', '수', '목', '금', '토']

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

// 봉사 순서·계좌·결정 사항처럼 일정이 아닌 안내 — 제목에 이 말이 있으면 '안내'
const NOTICE_TITLE_RE = /안내|봉사|순서|당번|결정|보고/

const kindOf = (title: string, body: string): DigestKind => {
  if (NOTICE_TITLE_RE.test(title)) return 'notice'
  // 제목을 먼저 본다 — 본문엔 "예배 후" 같은 말이 흔해서 본문만 보면 거의 다 '예배'가 된다
  for (const [kind, re] of KIND_RULES) if (re.test(title)) return kind
  for (const [kind, re] of KIND_RULES) if (re.test(body)) return kind
  return 'notice'
}

const dayLabel = (d: Date) => `${formatMonthDay(d)}(${WEEKDAYS[d.getDay()]})`

const makeDate = (year: number, postMonth: number, m: number, d: number): Date => {
  // 12월 주보에 1월 일정이 실리면 다음 해
  const y = postMonth >= 10 && m <= 3 ? year + 1 : year
  return new Date(y, m - 1, d)
}

interface Found {
  value: string
  raw: string
}

const findDate = (text: string, post: Date): (DigestDate & { raw: string }) | null => {
  const year = post.getFullYear()
  const pm = post.getMonth() + 1
  const ko = KO_DATE_RE.exec(text)
  const slash = SLASH_DATE_RE.exec(text)
  const pick = ko && (!slash || ko.index <= slash.index) ? 'ko' : slash ? 'slash' : null
  if (pick === 'ko' && ko) {
    const start = makeDate(year, pm, Number(ko[1]), Number(ko[2]))
    if (!ko[4]) return { start, end: start, label: dayLabel(start), raw: ko[0] }
    const end = makeDate(year, pm, Number(ko[3] ?? ko[1]), Number(ko[4]))
    const sameMonth = end.getMonth() === start.getMonth()
    const endLabel = sameMonth ? `${end.getDate()}일(${WEEKDAYS[end.getDay()]})` : dayLabel(end)
    return { start, end, label: `${dayLabel(start)} ~ ${endLabel}`, raw: ko[0] }
  }
  if (pick === 'slash' && slash) {
    const start = makeDate(year, pm, Number(slash[1]), Number(slash[2]))
    return { start, end: start, label: dayLabel(start), raw: slash[0] }
  }
  // 날짜가 안 적힌 "오늘 3부 예배 후" — 주보가 나온 날
  if (/오늘/.test(text)) {
    const start = new Date(post.getFullYear(), post.getMonth(), post.getDate())
    return { start, end: start, label: dayLabel(start), raw: '' }
  }
  if (/다음\s*주일/.test(text)) {
    const start = new Date(post.getFullYear(), post.getMonth(), post.getDate() + 7)
    return { start, end: start, label: dayLabel(start), raw: '' }
  }
  return null
}

const findTime = (text: string): Found | null => {
  const a = SERVICE_TIME_RE.exec(text)
  const b = TIME_RE.exec(text)
  const m = a && (!b || a.index <= b.index) ? a : b
  return m ? { value: clean(m[0]), raw: m[0] } : null
}

const findPlace = (body: string, dateRaw: string): Found | null => {
  // "11월 6일(금), 히스토리 캠퍼스(경기도 광주) * …" — 날짜 바로 뒤 쉼표 다음이 장소
  if (dateRaw) {
    const at = body.indexOf(dateRaw)
    if (at !== -1) {
      const after = /^\s*,\s*([^*\n,]+)/.exec(body.slice(at + dateRaw.length))
      if (after) {
        const v = clean(after[1])
        if (v && !TIME_RE.test(v) && v.length <= 30) return { value: v, raw: after[1].trim() }
      }
    }
  }
  const m = PLACE_RE.exec(body)
  return m ? { value: clean(m[0]), raw: m[0] } : null
}

const findContact = (text: string): { name: string; phone: string; raw: string } | null => {
  const m = PHONE_RE.exec(text)
  if (!m) return null
  const before = text.slice(0, m.index)
  const cut = Math.max(before.lastIndexOf(':'), before.lastIndexOf('('), before.lastIndexOf('\n'))
  const name = clean(before.slice(cut + 1)).replace(/^문의\s*/, '')
  // "(신청 및 문의: 배닛시 목사 010-…)" 괄호째 설명에서 걷어 낸다
  const paren = new RegExp(`\\s*\\([^()]*${m[0]}[^()]*\\)`).exec(text)
  return { name: name.length <= 14 ? name : '', phone: m[0], raw: paren ? paren[0] : m[0] }
}

/** 칩으로 옮긴 조각을 지우고 남는 글자 — 문장부호·공백 제외 */
const leftover = (s: string, parts: string[]) => {
  let rest = s
  for (const p of parts) if (p) rest = rest.split(p).join(' ')
  return clean(rest.replace(/[,.·:()~∼\-–]/g, ' '))
}

/** 줄 단위로 공백만 정리 — 원고의 줄바꿈(① ② 목록 등)은 살린다 */
const cleanLines = (s: string) =>
  s
    .split('\n')
    .map(clean)
    .filter(Boolean)
    .join('\n')

// 목록 줄 머리: ① · 1) · - · •
const LIST_MARK_RE = /^(?:[①-⑳]|\d{1,2}\)|[-·•])\s*(\S.*)$/
// "입원 / 정용숙 집사 …" — 짧은 머리말 + 빗금
const GROUP_LINE_RE = /^([가-힣]{1,6})\s*\/\s*(\S.*)$/
const LEAD_DATE_RE = new RegExp(`^(${KO_DATE_RE.source})\\s*[:：]?\\s*(.*)$`)
// "11월 23~27일(월~금) : …" — 앞 날짜에 '일'이 빠진 기간
const SHORT_RANGE_RE = /^(\d{1,2})월\s*(\d{1,2})\s*[~∼–-]\s*(\d{1,2})일(?:\s*\([^)]{1,7}\))?\s*[:：]?\s*(.*)$/

const parseEntry = (raw: string, post: Date): DigestListEntry => {
  const [main, ...stars] = raw.split('*')
  let text = clean(main)
  let date: Date | null = null
  let endDate: Date | null = null
  const range = SHORT_RANGE_RE.exec(text)
  const lead = range ? null : LEAD_DATE_RE.exec(text)
  const leadRest = lead ? clean(lead[lead.length - 1]) : ''
  if (range && clean(range[4])) {
    const pm = post.getMonth() + 1
    date = makeDate(post.getFullYear(), pm, Number(range[1]), Number(range[2]))
    endDate = makeDate(post.getFullYear(), pm, Number(range[1]), Number(range[3]))
    text = clean(range[4])
  } else if (lead && leadRest) {
    const found = findDate(lead[1], post)
    date = found?.start ?? null
    endDate = found && found.end.getTime() !== found.start.getTime() ? found.end : null
    text = leadRest
  }
  let sub = stars.map(clean).filter(Boolean).join(' · ') || null
  // 끝 괄호(소속·구역)는 아래 작은 줄로 — "(1교구 5지구 김영선 구역. 12여)"
  const paren = /\s*\(([^()]+)\)\s*$/.exec(text)
  if (!sub && paren && paren.index > 0) {
    sub = clean(paren[1].replace(/\s*[.,]\s*/g, ' · '))
    text = clean(text.slice(0, paren.index))
  }
  return { text, date, endDate, sub }
}

/**
 * 첫 목록 줄 뒤가 전부 목록 줄(또는 "머리말 / …")이면 목록으로 읽는다.
 * 중간에 '*' 줄이나 이어지는 문장이 끼면(공동의회 안건처럼 겹친 구조) 건드리지 않는다.
 */
const parseList = (lines: string[], post: Date): { lead: string[]; groups: DigestListGroup[] } | null => {
  const rows = lines.map((l) => l.trim()).filter(Boolean)
  const first = rows.findIndex((l) => LIST_MARK_RE.test(l))
  if (first === -1) return null
  const rest = rows.slice(first)
  if (rest.length < 2 || !rest.every((l) => LIST_MARK_RE.test(l) || GROUP_LINE_RE.test(l))) return null
  const groups: DigestListGroup[] = [{ label: null, entries: [] }]
  for (const l of rest) {
    const m = LIST_MARK_RE.exec(l)
    if (m) {
      groups[groups.length - 1].entries.push(parseEntry(m[1], post))
      continue
    }
    const g = GROUP_LINE_RE.exec(l)!
    groups.push({ label: g[1], entries: [parseEntry(g[2], post)] })
  }
  return { lead: rows.slice(0, first), groups: groups.filter((g) => g.entries.length) }
}

const parseItem = (no: number, title: string, rawLines: string[], post: Date): DigestItem => {
  // | 구분 줄이 두 줄 이상이면 표로 뗀다(봉사 순서·새가족 명단)
  const pipeLines = rawLines.filter((l) => l.includes('|'))
  const table = pipeLines.length >= 2 ? pipeLines.map((l) => l.split('|').map(clean)) : null
  // ※ 로 시작하는 줄은 덧붙임 안내
  const refNotes: string[] = []
  const bodyLines = rawLines.filter((l) => {
    if (table && l.includes('|')) return false
    const ref = /^\s*※\s*(.+)$/.exec(l)
    if (ref) {
      refNotes.push(clean(ref[1]))
      return false
    }
    return true
  })
  const bodyRows = bodyLines.map((l) => l.trim()).filter(Boolean)
  // 번호 없이 한 줄뿐인 교우 소식("신금희 성도 시모상 (3교구 …)")도 같은 모양으로 — 날짜가 있는 소식(결혼식 등)은 일정으로 둔다
  const singleFamily =
    bodyRows.length === 1 && /교우\s*소식|부고/.test(title) && !findDate(bodyRows[0], post)
      ? { lead: [] as string[], groups: [{ label: null, entries: [parseEntry(bodyRows[0], post)] }] as DigestListGroup[] }
      : null
  const list = parseList(bodyLines, post) ?? singleFamily
  // "교우 소식 / 장례" — 빗금 뒤 짧은 말은 첫 묶음 머리말로
  const split = list && list.groups[0]?.label === null ? /^(.+?)\s*\/\s*([가-힣]{1,6})\s*$/.exec(title) : null
  if (list && split) {
    title = split[1]
    list.groups[0].label = split[2]
  }
  // 목록이면 목록 앞 머리 문장만 본문으로 — 날짜·시간·장소도 거기서만 읽는다(줄마다 날짜는 목록이 맡는다)
  const body = (list ? list.lead.join('\n') : bodyLines.join('\n')).trim()
  const all = `${title}\n${body}`
  const kind = kindOf(title, list ? bodyLines.join('\n') : body)
  // "교회 일정 안내 ① 11월 15일 … ② 11월 16일 …"처럼 날짜가 여럿인 안내는 한 날짜로 못 박지 않는다
  const dateCount =
    (body.match(new RegExp(KO_DATE_RE.source, 'g'))?.length ?? 0) +
    (body.match(new RegExp(SLASH_DATE_RE.source, 'g'))?.length ?? 0)
  const multi = kind === 'notice' && dateCount >= 2
  const date = multi ? null : findDate(all, post)
  const time = multi ? null : findTime(body)
  const place = multi ? null : findPlace(body, date?.raw ?? '')
  const whoMatch = WHO_RE.exec(body)
  const who = whoMatch ? `${clean(whoMatch[1])} 필참` : null
  const contact = findContact(body)

  // 줄 머리 '*'는 그 줄(+바로 아래 ①② 줄)만 쪽지 — 뒤따르는 "2) …" 하위 줄까지 쪽지로 삼키지 않게
  const descLines: string[] = []
  const lineNotes: string[] = []
  let inNote = false
  for (const l of body.split('\n')) {
    const star = /^\s*\*\s*(.*)$/.exec(l)
    if (star) {
      lineNotes.push(star[1])
      inNote = true
    } else if (inNote && /^\s*[①-⑳]/.test(l)) {
      lineNotes[lineNotes.length - 1] += `\n${l}`
    } else {
      inNote = false
      descLines.push(l)
    }
  }
  const [head, ...inlineStars] = descLines.join('\n').split('*')
  const starParts = [...inlineStars, ...lineNotes]
  let desc = cleanLines(contact ? head.replace(contact.raw, '') : head)
  if (leftover(desc, [date?.raw ?? '', place?.raw ?? '', time?.raw ?? '']).length < 2) desc = ''

  let timeLabel = time?.value ?? null
  const notes: string[] = []
  for (const part of starParts) {
    const note = cleanLines(contact ? part.replace(contact.raw, '') : part)
    if (!note) continue
    const rest = leftover(note, [date?.raw ?? '', time?.raw ?? '', place?.raw ?? '', '기간', '일시', '장소'])
    if (!rest) continue
    // "교회 출발 : 오전 8시" → 시간 칩을 "교회 출발 오전 8시"로
    if (time && note.includes(time.raw) && rest.length <= 8) {
      timeLabel = `${rest} ${time.value}`
      continue
    }
    notes.push(note)
  }
  notes.unshift(...refNotes)

  return {
    no,
    title: clean(title),
    kind,
    desc,
    notes,
    date: date ? { start: date.start, end: date.end, label: date.label } : null,
    time: timeLabel,
    place: place?.value ?? null,
    who,
    contact: contact ? { name: contact.name, phone: contact.phone } : null,
    table,
    groups: list ? list.groups : null,
  }
}

export const parseNewsDigest = (content: string, postDate: Date): NewsDigest | null => {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const intro: string[] = []
  const blocks: { no: number; title: string; body: string[] }[] = []
  const headerRe = lines.some((l) => /^\s*1\s*\.\s*\S/.test(l)) ? DOT_HEADER_RE : HEADER_RE
  for (const line of lines) {
    const h = headerRe.exec(line)
    // 번호는 1부터 하나씩 — "2부 예배" 같은 본문 줄이나 엉뚱한 숫자를 항목으로 오인하지 않게
    if (h && Number(h[1]) === blocks.length + 1) {
      blocks.push({ no: Number(h[1]), title: h[2], body: [] })
    } else if (blocks.length) {
      blocks[blocks.length - 1].body.push(line)
    } else {
      intro.push(line)
    }
  }
  if (blocks.length < MIN_ITEMS) return null
  return {
    intro: clean(intro.join(' ')),
    items: blocks.map((b) => parseItem(b.no, b.title, b.body, postDate)),
  }
}

export type DigestStatus = { kind: 'today' | 'ongoing' | 'upcoming' | 'past'; days: number }

/** 오늘(기기 날짜) 기준 상태 — 주보가 나온 날이 아니라 지금 읽는 날 기준 */
export const statusOf = (date: DigestDate, now = new Date()): DigestStatus => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const s = date.start.getTime()
  const e = date.end.getTime()
  const days = Math.round((s - today) / 864e5)
  if (e < today) return { kind: 'past', days }
  if (s <= today && e > s) return { kind: 'ongoing', days }
  if (days === 0) return { kind: 'today', days }
  if (days < 0) return { kind: 'ongoing', days }
  return { kind: 'upcoming', days }
}
