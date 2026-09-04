/**
 * 공지사항 전용 경량 마크업 — 파서 / 평문 변환 / 편집 도우미.
 *
 * 리치 에디터(HTML 저장)를 쓰지 않는 이유:
 *  - 관리자가 고른 인라인 색이 다크모드에서 그대로 죽는다
 *  - dangerouslySetInnerHTML + sanitize가 필요해진다
 *  - 홈 배너 한 줄 프리뷰처럼 "평문이어야 하는 자리"가 여러 곳이다
 * 그래서 본문은 계속 TEXT 한 덩어리로 두고(스키마 변경 없음), 문법이 없는
 * 기존 공지는 그대로 문단으로 떨어지게 한다.
 *
 * 렌더는 React가 텍스트를 escape 하므로 XSS 안전.
 */

/* ------------------------------------------------------------------ */
/* 인라인                                                              */
/* ------------------------------------------------------------------ */

export type InlineKind = 'text' | 'strong' | 'underline' | 'mark' | 'warn'

export interface InlineToken {
  kind: InlineKind
  text: string
}

/** 인라인 마커 — 툴바 버튼과 1:1 대응한다 */
export const INLINE_MARKERS = {
  strong: '**',
  underline: '__',
  mark: '==',
  warn: '!!',
} as const

export type InlineMarkerName = keyof typeof INLINE_MARKERS

// 마커 안에 개행이 들어가면 문법이 아니라 오타로 본다(줄 걸침 방지).
const INLINE_RE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|==[^=\n]+==|!![^!\n]+!!)/g

export const parseInline = (text: string): InlineToken[] => {
  const tokens: InlineToken[] = []
  for (const piece of text.split(INLINE_RE)) {
    if (piece === '') continue
    if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) {
      tokens.push({ kind: 'strong', text: piece.slice(2, -2) })
    } else if (piece.startsWith('__') && piece.endsWith('__') && piece.length > 4) {
      tokens.push({ kind: 'underline', text: piece.slice(2, -2) })
    } else if (piece.startsWith('==') && piece.endsWith('==') && piece.length > 4) {
      tokens.push({ kind: 'mark', text: piece.slice(2, -2) })
    } else if (piece.startsWith('!!') && piece.endsWith('!!') && piece.length > 4) {
      tokens.push({ kind: 'warn', text: piece.slice(2, -2) })
    } else {
      tokens.push({ kind: 'text', text: piece })
    }
  }
  return tokens
}

/** 인라인 마커만 벗겨낸 평문 */
export const stripInline = (text: string): string =>
  parseInline(text)
    .map((t) => t.text)
    .join('')

/* ------------------------------------------------------------------ */
/* 콜아웃                                                              */
/* ------------------------------------------------------------------ */

export type CalloutTone = 'info' | 'warn' | 'celebrate'

/** 표기 흔들림(영문/유의어)을 하나의 톤으로 모은다 */
const CALLOUT_ALIASES: Record<string, CalloutTone> = {
  안내: 'info',
  참고: 'info',
  note: 'info',
  info: 'info',
  주의: 'warn',
  필독: 'warn',
  경고: 'warn',
  warning: 'warn',
  caution: 'warn',
  축하: 'celebrate',
  감사: 'celebrate',
  tip: 'celebrate',
}

export const CALLOUT_LABELS: Record<CalloutTone, string> = {
  info: '안내',
  warn: '주의',
  celebrate: '축하',
}

/* ------------------------------------------------------------------ */
/* 핵심 정보 줄 (문법 없이 자동 인식)                                   */
/* ------------------------------------------------------------------ */

export type InfoIcon = 'calendar' | 'place' | 'people' | 'kit' | 'phone' | 'won' | 'pen'

/**
 * `일시: ...`처럼 관리자가 원래 쓰던 형태를 그대로 정보 카드로 바꾼다.
 * 문법을 새로 배우지 않아도 되는 게 이 기능의 핵심이라 키워드를 넉넉히 잡는다.
 */
const INFO_KEYS: Record<string, InfoIcon> = {
  일시: 'calendar',
  날짜: 'calendar',
  시간: 'calendar',
  기간: 'calendar',
  마감: 'calendar',
  장소: 'place',
  위치: 'place',
  모이는곳: 'place',
  대상: 'people',
  인원: 'people',
  모집: 'people',
  준비물: 'kit',
  지참물: 'kit',
  문의: 'phone',
  연락처: 'phone',
  담당: 'phone',
  회비: 'won',
  참가비: 'won',
  헌금: 'won',
  신청: 'pen',
  접수: 'pen',
  등록: 'pen',
}

export interface InfoRow {
  label: string
  value: string
  icon: InfoIcon
}

// 라벨 안의 공백은 무시하고 맞춘다 — "모이는 곳:"도 잡히도록.
const INFO_RE = /^\s*([가-힣]{2,6}(?:\s[가-힣]{1,4})?)\s*[:：]\s*(\S.*)$/

const matchInfoRow = (line: string): InfoRow | null => {
  const m = INFO_RE.exec(line)
  if (!m) return null
  const rawLabel = m[1].trim()
  const icon = INFO_KEYS[rawLabel.replace(/\s+/g, '')]
  if (!icon) return null
  return { label: rawLabel, value: m[2].trim(), icon }
}

/* ------------------------------------------------------------------ */
/* 블록                                                                */
/* ------------------------------------------------------------------ */

export type NoticeBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'bullet'; items: string[] }
  | { type: 'ordered'; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'callout'; tone: CalloutTone; lines: string[] }
  | { type: 'info'; rows: InfoRow[] }
  | { type: 'divider' }

const HEADING_RE = /^(#{1,3})\s+(.*)$/
const BULLET_RE = /^\s*[-*·]\s+(.*)$/
const ORDERED_RE = /^\s*\d{1,2}[.)]\s+(.*)$/
const DIVIDER_RE = /^\s*-{3,}\s*$/
const QUOTE_RE = /^>\s?(.*)$/
const CALLOUT_RE = /^\[!\s*([A-Za-z가-힣]+)\s*\]\s*(.*)$/

type OpenBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'bullet'; items: string[] }
  | { type: 'ordered'; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'callout'; tone: CalloutTone; lines: string[] }
  | { type: 'info'; rows: InfoRow[] }

export const parseNoticeBlocks = (source: string): NoticeBlock[] => {
  const lines = (source ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks: NoticeBlock[] = []

  // 같은 종류의 줄이 이어지면 한 블록으로 묶는다
  let open: OpenBlock | null = null

  const flush = () => {
    if (!open) return
    blocks.push(open)
    open = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trim() === '') {
      flush()
      continue
    }

    if (DIVIDER_RE.test(line)) {
      flush()
      blocks.push({ type: 'divider' })
      continue
    }

    const heading = HEADING_RE.exec(line)
    if (heading) {
      flush()
      // 공지 본문에 h1은 과하다 — 제목 필드가 이미 그 역할을 한다
      blocks.push({
        type: 'heading',
        level: heading[1].length >= 3 ? 3 : 2,
        text: heading[2].trim(),
      })
      continue
    }

    const quote = QUOTE_RE.exec(line)
    if (quote) {
      const body = quote[1]
      const callout = CALLOUT_RE.exec(body.trim())
      if (callout) {
        flush()
        const tone = CALLOUT_ALIASES[callout[1].toLowerCase()] ?? 'info'
        open = { type: 'callout', tone, lines: callout[2] ? [callout[2]] : [] }
        continue
      }
      // 콜아웃/인용의 둘째 줄부터는 열려 있는 블록에 이어 붙인다
      if (open && (open.type === 'callout' || open.type === 'quote')) {
        open.lines.push(body)
        continue
      }
      flush()
      open = { type: 'quote', lines: [body] }
      continue
    }

    const bullet = BULLET_RE.exec(line)
    if (bullet) {
      if (open?.type !== 'bullet') {
        flush()
        open = { type: 'bullet', items: [] }
      }
      open.items.push(bullet[1])
      continue
    }

    const ordered = ORDERED_RE.exec(line)
    if (ordered) {
      if (open?.type !== 'ordered') {
        flush()
        open = { type: 'ordered', items: [] }
      }
      open.items.push(ordered[1])
      continue
    }

    const info = matchInfoRow(line)
    if (info) {
      if (open?.type !== 'info') {
        flush()
        open = { type: 'info', rows: [] }
      }
      open.rows.push(info)
      continue
    }

    if (open?.type !== 'paragraph') {
      flush()
      open = { type: 'paragraph', lines: [] }
    }
    open.lines.push(line)
  }

  flush()
  return blocks
}

/* ------------------------------------------------------------------ */
/* 평문 폴백                                                           */
/* ------------------------------------------------------------------ */

/**
 * 블록 구조를 줄 단위 평문으로 눕힌다.
 * `text`에 무엇을 넘기냐로 인라인 마커를 벗길지(평문) 남길지(강조 유지) 정한다.
 */
const flatten = (source: string, text: (s: string) => string): string => {
  const out: string[] = []
  for (const block of parseNoticeBlocks(source)) {
    switch (block.type) {
      case 'heading':
        out.push(text(block.text))
        break
      case 'paragraph':
      case 'quote':
        out.push(block.lines.map(text).join('\n'))
        break
      case 'callout':
        out.push(
          `[${CALLOUT_LABELS[block.tone]}] ${block.lines.map(text).join(' ')}`.trim(),
        )
        break
      case 'bullet':
        out.push(block.items.map((i) => `· ${text(i)}`).join('\n'))
        break
      case 'ordered':
        out.push(block.items.map((i, n) => `${n + 1}. ${text(i)}`).join('\n'))
        break
      case 'info':
        out.push(block.rows.map((r) => `${r.label}: ${text(r.value)}`).join('\n'))
        break
      case 'divider':
        break
    }
  }
  return out.filter(Boolean).join('\n').trim()
}

/**
 * 마크업을 벗긴 읽을 수 있는 평문.
 * 홈 상단 배너 한 줄, 알림함 미리보기처럼 서식을 못 쓰는 자리에서
 * `**`가 날것으로 새는 걸 막는다.
 */
export const stripNoticeMarkup = (source: string): string =>
  flatten(source, stripInline)

/**
 * 블록만 눕히고 인라인 마커는 남긴 한 줄짜리 원문.
 * line-clamp가 걸린 자리에서 "강조는 살리되 카드 구조는 빼는" 용도.
 */
export const flattenNoticeMarkup = (source: string): string =>
  flatten(source, (s) => s)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')

/** 한 줄 프리뷰용 — 줄바꿈까지 공백으로 눕힌다 */
export const noticePreviewText = (source: string): string =>
  stripNoticeMarkup(source).replace(/\s+/g, ' ').trim()

/* ------------------------------------------------------------------ */
/* 편집 도우미 (툴바)                                                  */
/* ------------------------------------------------------------------ */

export interface EditResult {
  value: string
  /** 적용 후 커서/선택 범위 */
  start: number
  end: number
}

/** 선택 영역을 마커로 감싸거나, 이미 감싸져 있으면 벗긴다 */
export const toggleInlineMarker = (
  value: string,
  start: number,
  end: number,
  marker: string,
  placeholder: string,
): EditResult => {
  const len = marker.length
  const selected = value.slice(start, end)

  // 안쪽만 선택된 경우: **[본문]** → 본문
  if (
    start >= len &&
    value.slice(start - len, start) === marker &&
    value.slice(end, end + len) === marker
  ) {
    const next = value.slice(0, start - len) + selected + value.slice(end + len)
    return { value: next, start: start - len, end: end - len }
  }
  // 마커까지 선택된 경우: [**본문**] → 본문
  if (
    selected.length > len * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const inner = selected.slice(len, -len)
    return {
      value: value.slice(0, start) + inner + value.slice(end),
      start,
      end: start + inner.length,
    }
  }

  const body = selected || placeholder
  return {
    value: value.slice(0, start) + marker + body + marker + value.slice(end),
    start: start + len,
    end: start + len + body.length,
  }
}

/** 선택된 줄들의 맨 앞에 접두사를 붙이거나 뗀다 (목록·소제목) */
export const toggleLinePrefix = (
  value: string,
  start: number,
  end: number,
  prefix: string,
  { numbered = false }: { numbered?: boolean } = {},
): EditResult => {
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const lineEndIdx = value.indexOf('\n', end)
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx

  const lines = value.slice(lineStart, lineEnd).split('\n')
  const matcher = numbered ? /^\s*\d{1,2}[.)]\s+/ : null
  // 이미 전부 붙어 있으면 토글로 뗀다
  const allOn = lines.every((l) =>
    l.trim() === '' ? true : matcher ? matcher.test(l) : l.startsWith(prefix),
  )

  const next = lines
    .map((l, i) => {
      if (l.trim() === '') return l
      if (allOn) {
        return matcher ? l.replace(matcher, '') : l.slice(prefix.length)
      }
      // 다른 표기가 이미 있으면 갈아끼운다
      const bare = l.replace(/^\s*(?:[-*·]\s+|\d{1,2}[.)]\s+|#{1,3}\s+)/, '')
      return numbered ? `${i + 1}. ${bare}` : `${prefix}${bare}`
    })
    .join('\n')

  return {
    value: value.slice(0, lineStart) + next + value.slice(lineEnd),
    start: lineStart,
    end: lineStart + next.length,
  }
}

/** 커서 위치에 블록을 통째로 끼워 넣는다 (콜아웃·구분선·정보 묶음) */
export const insertBlock = (
  value: string,
  start: number,
  end: number,
  snippet: string,
  { cursorOffset }: { cursorOffset?: number } = {},
): EditResult => {
  const before = value.slice(0, start)
  const after = value.slice(end)
  // 블록은 항상 줄 맨 앞에서 시작하고, 뒤로 한 줄 비워 둔다
  const lead =
    before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const tail = after === '' ? '\n' : after.startsWith('\n') ? '\n' : '\n\n'
  const insertedAt = before.length + lead.length
  const caret = insertedAt + (cursorOffset ?? snippet.length)
  return {
    value: `${before}${lead}${snippet}${tail}${after}`,
    start: caret,
    end: caret,
  }
}

/* ------------------------------------------------------------------ */
/* 템플릿                                                              */
/* ------------------------------------------------------------------ */

export interface NoticeTemplate {
  id: string
  label: string
  hint: string
  body: string
}

/**
 * 빈 본문일 때만 노출되는 뼈대.
 * 문법을 몰라도 결과물부터 보게 하는 게 목적이라, 채워 넣을 자리는
 * `0`/`<>`로 눈에 띄게 남겨 둔다.
 */
export const NOTICE_TEMPLATES: NoticeTemplate[] = [
  {
    id: 'event',
    label: '행사 안내',
    hint: '일시·장소가 있는 안내',
    body: `> [!안내] <행사 이름>에 성도님들을 초대합니다

일시: 0월 0일(토) 오후 0시
장소: 본당 0층
대상: 전 성도
준비물: 성경, 필기구
문의: 교회 사무실 (000-0000-0000)

자세한 내용은 주보를 참고해 주세요.`,
  },
  {
    id: 'worship',
    label: '예배 변경',
    hint: '시간·장소가 바뀔 때',
    body: `> [!주의] 이번 주 예배 시간이 변경됩니다

일시: 0월 0일(주일) 오후 0시
장소: 본당

**변경 전** 오전 11시 → **변경 후** 오후 2시

==변경된 시간에 맞춰 참석해 주시기 바랍니다.==`,
  },
  {
    id: 'recruit',
    label: '모집·신청',
    hint: '접수 마감이 있는 공지',
    body: `> [!안내] <프로그램 이름> 참가자를 모집합니다

대상: 청년부 전체
인원: 선착순 00명
회비: 00,000원
접수: 0월 0일(월)까지
문의: 담당 교역자

- 신청은 사무실 또는 담당 교역자에게 해주세요
- !!인원이 차면 조기 마감될 수 있습니다!!`,
  },
]
