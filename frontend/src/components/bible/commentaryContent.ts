/**
 * 말씀 해석 본문(마크다운)을 읽기 좋은 구조로 다시 나눈다.
 *
 * 왜 필요한가 — 저장된 해석은 AI가 만든 3문단 정형문이고, 같은 내용을 네 번 말한다:
 *   1문단  성경 본문 통째 재인용(볼드) + 한 줄 요지
 *   2문단  800자 통짜 문단 = 본문 세 번째 인용 + "첫째… 둘째…" + 앞 내용을 한 문장으로
 *          되풀이하는 200자 통짜 볼드
 *   3문단  > 적용 질문
 * 성경 본문은 화면 위에 따로 띄우고, 되풀이 문장은 버리고, "첫째/둘째"를 관찰 블록으로
 * 쪼개면 읽을 거리가 실제로 절반이 된다. 타이포만으로는 해결되지 않는 부분이다.
 *
 * 형식이 조금이라도 어긋나면 쪼개기를 포기하고 원문을 그대로 body에 담는다 —
 * 잘못 자르느니 예전처럼 보이는 편이 낫다.
 */

/** "첫째… 둘째…"에서 뽑아낸 관찰 한 덩어리 */
export interface CommentaryObservation {
  /** ①② 옆에 붙는 짧은 라벨. 문단 첫 **볼드**에서 승격한다 */
  heading: string | null
  /** 관찰 본문 (마크다운) */
  text: string
}

export interface ParsedCommentary {
  /** 해석이 다루는 성경 본문. 실제 절 텍스트를 넘겨받지 못했을 때의 폴백 */
  scripture: string | null
  /** 본문 한 줄 요지 */
  lead: string | null
  /** 관찰 블록 **앞**에 오는 본문 (마크다운) */
  preface: string | null
  /** 관찰 블록. 비어 있으면 preface/body만 렌더한다 */
  observations: CommentaryObservation[]
  /** 관찰 블록 **뒤**에 오는 본문 (마크다운) */
  body: string | null
  /** 관찰 뒤에 오는 마무리 한 문장 */
  closing: string | null
  /** `> 인용`으로 적힌 적용 질문 */
  application: string | null
}

/** 낱말 강조가 아니라 본문 인용으로 볼 만큼 긴 볼드 */
const QUOTE_BOLD = 12
/** 첫 문단에서 인용을 걷어낸 뒤 이만큼도 안 남으면, 그 문단은 재인용일 뿐이다 */
const OPENING_LEFTOVER = 30
/** 도입부에서 걷어낼 성경 본문 재인용의 길이 */
const LONG_BOLD = 25
/** 문단 끝의 볼드를 낱말 강조가 아니라 "마무리 문장"으로 볼 만큼 긴 길이 */
const TAIL_BOLD = 40
/** 마무리 문장치고 너무 길면 = 앞 내용을 통째로 되풀이한 문장. 버린다 */
const ECHO_BOLD = 120

const ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째']

/** "첫째, …"로 문단이 시작하는지 — 관찰을 문단마다 따로 쓴 형식을 잡는다 */
const ORDINAL_HEAD = new RegExp(`^(?:${ORDINALS.join('|')})\\s*[,，]\\s*`)

const unbold = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1')

/** 앞뒤에 남은 대시·따옴표·구두점 부스러기를 턴다 */
const tidy = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/^[\s—–\-·.,'"'"]+/, '')
    .replace(/[\s—–\-·,]+$/, '')
    .trim()

/** 문장으로 세울 수 있게 마침표를 붙여준다 */
const asSentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`)

/** 본문 맨 앞의 마크다운 제목(# ...) — title 필드와 중복이라 걷어낸다 */
export const stripLeadingHeading = (content: string) =>
  content.replace(/^\s*#{1,6}[ \t]+.*\r?\n+/, '')

/**
 * 문단 끝에 통짜로 붙은 볼드 문장을 떼어낸다.
 * 짧으면 "정리 한 줄"로 살리고, 너무 길면 앞 문단을 되풀이한 것이라 버린다.
 */
const splitTailBold = (para: string): { text: string; tail: string | null } => {
  const m = para.match(new RegExp(`\\s*\\*\\*([^*]{${TAIL_BOLD},})\\*\\*\\s*$`))
  if (!m) return { text: para.trim(), tail: null }
  const tail = tidy(m[1])
  return {
    text: para.slice(0, para.length - m[0].length).trim(),
    tail: tail.length >= ECHO_BOLD ? null : tail,
  }
}

/** 문단 끝에 붙은 "앞 내용 되풀이" 통짜 볼드를 떼어낸다 */
const dropEcho = (s: string) => splitTailBold(s).text

/** 비교용 정규화 — 공백·구두점을 지운 알맹이만 남긴다 */
const normalize = (s: string) => s.replace(/[\s'"'"()[\]{}.,·—–\-!?:;]/g, '')

/** 네 글자 조각 집합 — 줄임표로 잘라 쓴 제목까지 잡으려고 부분 일치로 비교한다 */
const grams = (s: string): Set<string> => {
  const out = new Set<string>()
  for (let i = 0; i + 4 <= s.length; i += 1) out.add(s.slice(i, i + 4))
  return out
}

const gramOverlap = (a: string, b: string): number => {
  const ga = grams(a)
  if (ga.size === 0) return b.includes(a) ? 1 : 0
  const gb = grams(b)
  let hit = 0
  ga.forEach((g) => {
    if (gb.has(g)) hit += 1
  })
  return hit / ga.size
}

/**
 * 제목이 성경 본문을 그대로 옮긴 것인지 판단한다.
 *
 * 절별 해석은 title이 사실상 본문 전문이라, 본문 블록과 나란히 두면 같은 문장이 두 번
 * 보인다. 다만 "…" 로 중간을 줄이거나 어미만 바꿔 적은 것도 많아서 완전 일치로는 못 잡는다.
 * 요약 해석의 title은 사람이 붙인 진짜 제목이므로 건드리지 않는다.
 */
export const titleEchoesScripture = (
  title: string | null | undefined,
  scripture: string | null | undefined,
  scope: string,
): boolean => {
  if (scope === 'summary') return false
  if (!title?.trim() || !scripture?.trim()) return false
  const t = normalize(title)
  const s = normalize(scripture)
  if (t.length < 8 || s.length < 8) return false
  const overlap = gramOverlap(t, s)
  // 제목치고 지나치게 긴 데다 본문과 겹치기까지 하면, 그건 제목이 아니라 본문이다
  return overlap >= 0.6 || (t.length >= 26 && overlap >= 0.3)
}

/**
 * 두 문장이 같은 말인지 본다 — "우리는 …해야 합니다."와 "나는 …하나요?"처럼
 * 주어와 어미만 바꾼 되풀이를 잡아내려는 것이다.
 */
const restatesSame = (a: string, b: string): boolean => {
  const core = (s: string) => normalize(s).replace(/^(우리는|나는|저는|우리|내가)/, '')
  const ca = core(a)
  const cb = core(b)
  if (ca.length < 15 || cb.length < 15) return false
  return cb.includes(ca.slice(0, 18)) || ca.includes(cb.slice(0, 18))
}

/** 문단에서 성경 본문 재인용(긴 볼드)을 따옴표째 걷어낸다 */
const dropInlineScripture = (s: string) =>
  s.replace(
    new RegExp(`['"'"]?\\*\\*[^*]{${LONG_BOLD},}\\*\\*['"'"]?`, 'g'),
    '',
  )

/**
 * 첫 문단이 "성경 본문 재인용에 지나지 않는지" 판단해서, 그렇다면 본문과 한 줄 요지로 나눈다.
 *
 * 판정 기준은 볼드 비율이 아니라 **인용을 걷어내고 남는 분량**이다. 요한복음처럼 잘 쓰인
 * 해석은 첫 문단부터 인용을 문장 안에 엮어 쓰기 때문에("…유대인의 지도자**였습니다. 그는
 * 산헤드린 공회의 일원으로…"), 볼드가 길다고 문단을 통째로 버리면 진짜 내용이 날아간다.
 * 남는 게 한 줄도 안 될 때만 재인용으로 보고 걷어낸다.
 */
const splitOpening = (
  para: string,
): { scripture: string; lead: string | null } | null => {
  const quotes = [...para.matchAll(new RegExp(`\\*\\*([^*]{${QUOTE_BOLD},})\\*\\*`, 'g'))].map(
    (m) => m[1].trim(),
  )
  if (quotes.length === 0) return null

  const leftover = tidy(
    para
      .replace(new RegExp(`\\*\\*[^*]{${QUOTE_BOLD},}\\*\\*`, 'g'), '')
      // "(1절) (2절)" 같은 절 표시는 요지가 아니다
      .replace(/\(\s*\d+\s*절\s*\)/g, ''),
  )
  if (leftover.length > OPENING_LEFTOVER) return null

  return {
    scripture: tidy(quotes.join(' ')),
    lead: leftover.length >= 10 ? asSentence(unbold(leftover)) : null,
  }
}

/** "…선언됩니다 — '본문'. 주목할 것은 두 가지입니다." 도입부에서 앞 절만 남긴다 */
const leadFromIntro = (intro: string): string | null => {
  const head = tidy(
    dropInlineScripture(intro)
      .replace(/주목할\s*것은[^.]*?가지입니다\.?/g, '')
      .split(/\s[—–]\s/)[0],
  )
  return head.length >= 6 ? asSentence(unbold(head)) : null
}

/**
 * 관찰 세그먼트 하나를 소제목 + 본문으로 나눈다.
 *
 * "**핵심어** — 설명" 꼴이면 핵심어를 떼어 소제목으로 올린다. 그 밖에는 문장 안에 박힌
 * 첫 볼드를 소제목으로 빌려 쓰되 문장은 건드리지 않는다 — 잘라내면 말이 끊긴다.
 */
const toObservation = (segment: string): CommentaryObservation => {
  const text = dropEcho(segment)
  const labelled = text.match(/^\*\*([^*]{2,24})\*\*\s*[—–-]\s*(.+)$/s)
  if (labelled) {
    return { heading: tidy(labelled[1]), text: labelled[2].trim() }
  }
  const firstBold = text.match(/\*\*([^*]{2,24})\*\*/)
  return { heading: firstBold ? tidy(firstBold[1]) : null, text }
}

/**
 * "첫째… 둘째…" 문단을 관찰 배열 + 마무리 문장으로 나눈다.
 * 서수 표지가 둘 미만이면 쪼개지 않는다(null 반환) — 원문 그대로 두는 편이 안전하다.
 */
const splitObservations = (
  para: string,
): { intro: string; observations: CommentaryObservation[]; closing: string | null } | null => {
  const marker = new RegExp(`(?:^|[\\s(])(${ORDINALS.join('|')}),`, 'g')
  const hits: { index: number; label: string }[] = []
  let m: RegExpExecArray | null
  while ((m = marker.exec(para)) !== null) {
    hits.push({ index: m.index + m[0].indexOf(m[1]), label: m[1] })
  }
  if (hits.length < 2) return null

  const body = dropEcho(para)
  const intro = body.slice(0, hits[0].index)
  const segments = hits.map((hit, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : body.length
    // 서수 표지("첫째, ") 자체는 ①② 마커가 대신하므로 떼어낸다
    return body.slice(hit.index, end).replace(/^[^,]{1,4},\s*/, '').trim()
  })
  if (segments.some((s) => s.length < 10)) return null

  // 마지막 관찰 뒤에 붙은 "우리는 …해야 합니다." 는 관찰이 아니라 전체 마무리다
  const last = segments[segments.length - 1]
  const closingMatch = last.match(/(?:^|\.\s*)((?:우리는|그러므로|따라서)[^.]{5,}\.)\s*$/)
  if (closingMatch) {
    segments[segments.length - 1] = last.slice(0, last.length - closingMatch[1].length).trim()
  }

  return {
    intro,
    observations: segments.map(toObservation),
    closing: closingMatch ? unbold(tidy(closingMatch[1])) : null,
  }
}

/**
 * 해석 본문을 구조로 나눈다.
 *
 * @param raw       저장된 마크다운 본문
 * @param hasTitle  title 필드가 따로 있는지 (있으면 본문 앞 # 제목을 걷어낸다)
 */
export const parseCommentary = (raw: string, hasTitle: boolean): ParsedCommentary => {
  const source = (hasTitle ? stripLeadingHeading(raw) : raw).replace(/\r\n/g, '\n')
  const paragraphs = source
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return {
      scripture: null,
      lead: null,
      preface: null,
      observations: [],
      body: source.trim() || null,
      closing: null,
      application: null,
    }
  }

  const rest = [...paragraphs]

  // 1) 맨 끝 `> 인용` = 적용 질문
  let application: string | null = null
  if (rest.length > 1 && rest[rest.length - 1].startsWith('>')) {
    application = unbold(
      rest
        .pop()!
        .split('\n')
        .map((line) => line.replace(/^>\s?/, '').trim())
        .join(' ')
        .trim(),
    )
  }

  // 2) 첫 문단이 성경 본문 재인용뿐이면 본문/요지로 분리하고 문단 자체는 버린다
  let scripture: string | null = null
  let lead: string | null = null
  if (rest.length > 1) {
    const opened = splitOpening(rest[0])
    if (opened) {
      scripture = opened.scripture
      lead = opened.lead
      rest.shift()
    }
  }

  // 3) 남은 문단 — "첫째… 둘째…"는 관찰로 쪼개고, 통짜 볼드 문장은 마무리로 뺀다.
  //    관찰을 문단마다 따로 쓴 형식("첫째, …" 문단 + "둘째, …" 문단)도 같이 받는다.
  const perParagraph = rest.filter((p) => ORDINAL_HEAD.test(p)).length >= 2
  const observations: CommentaryObservation[] = []
  let closing: string | null = null
  const prefaceParts: string[] = []
  const bodyParts: string[] = []

  rest.forEach((para) => {
    // 문단 하나가 통째로 볼드 = 앞 내용 되풀이. 짧으면 마무리로 살린다
    const solo = para.match(/^\*\*([^*]+)\*\*$/)
    if (solo) {
      const only = tidy(solo[1])
      if (only.length < ECHO_BOLD) closing = closing ?? only
      return
    }

    const { text, tail } = splitTailBold(para)
    closing = closing ?? tail
    if (!text) return

    if (perParagraph) {
      if (ORDINAL_HEAD.test(text)) {
        observations.push(toObservation(text.replace(ORDINAL_HEAD, '')))
        return
      }
    } else if (observations.length === 0 && !/^\s*[-*]\s/.test(text)) {
      const split = splitObservations(text)
      if (split) {
        if (!lead) lead = leadFromIntro(split.intro)
        observations.push(...split.observations)
        closing = closing ?? split.closing
        return
      }
    }
    // 관찰 앞뒤 어디에 있던 글인지를 지켜야 화면에서 순서가 뒤집히지 않는다
    ;(observations.length === 0 ? prefaceParts : bodyParts).push(text)
  })

  // 관찰 앞에 놓인 한 줄짜리 도입부는 요지로 올린다 — 본문과 관찰 사이의 다리 역할
  if (!lead && observations.length > 0 && prefaceParts.length === 1) {
    const only = prefaceParts[0]
    if (only.length <= 120 && !/\n/.test(only)) {
      lead = tidy(unbold(only))
      prefaceParts.length = 0
    }
  }

  // 마무리 문장이 적용 질문을 평서문으로 바꿔 말한 것뿐이면 버린다 — 또 한 번의 되풀이다
  if (closing && application && restatesSame(closing, application)) closing = null

  return {
    scripture,
    lead,
    preface: prefaceParts.join('\n\n').trim() || null,
    observations,
    body: bodyParts.join('\n\n').trim() || null,
    closing,
    application,
  }
}
