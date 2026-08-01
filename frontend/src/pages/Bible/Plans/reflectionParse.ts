// AI 묵상 본문 렌더 시점 파서.
//
// 백엔드 프롬프트가 강제하는 암묵적 구조 — "여는 문단 → 본문 전개 → 그리스도 연결 →
// 마지막 '오늘의 한 걸음' 적용" — 를 화면에서 되살린다. 통짜 텍스트를 그대로 흘리면
// 벽처럼 읽혀서, 문단을 역할별로 나누고 시각 위계를 입힐 재료로 쪼갠다.
// (해석 패널의 중복 파서와 같은 접근: 백엔드는 건드리지 않고 렌더 시점에만 해체)
import { normalizeReflection } from './reflectionText'

export interface ReflectionFlowItem {
  /** "20장" | "20-22장" 처럼 표시용 장 라벨 */
  chapter: string
  /** 그 장의 한 줄 주제 (예: "아브라함의 연약함") */
  label: string
}

export interface ParsedReflection {
  /** 여는 문단 — 오늘 본문 전체를 소개하는 리드. 문단이 하나뿐이면 body로 내린다 */
  lede: string | null
  /** 리드에서 추출한 장별 흐름 (2개 이상 잡혔을 때만) */
  flow: ReflectionFlowItem[]
  /** 본문 문단들 */
  body: string[]
  /** 마지막 문단 — "오늘의 한 걸음" 적용 (문단 3개 이상일 때만 분리) */
  step: string | null
}

// 리드 문단 안의 "…연약함(20장)과 …경이로움(21장)" 패턴
const CHAPTER_REF = /\(\s*(\d+(?:\s*[-~–]\s*\d+)?)\s*장\s*\)/g

// 흐름 라벨 앞에 붙는 접속·군더더기 — "그리고 가장 큰 시험 앞에서" → "가장 큰 시험 앞에서"
const LABEL_FILLERS = /^(?:그리고|또한|또|및|먼저|이제|마지막으로|우리는|여기서|본문에서|과|와)\s+/

const cleanFlowLabel = (raw: string): string => {
  // 문장 경계·쉼표 뒤쪽만 취해 라벨을 고립시킨다
  let label = raw.split(/[.!?,·]/).pop() ?? ''
  label = label.replace(/^[\s'"“”‘’()]+|[\s'"“”‘’()]+$/g, '')
  // "우리는 여기서 아브라함의 연약함"처럼 군더더기가 여러 겹일 수 있어 반복 제거
  let prev = ''
  while (prev !== label) {
    prev = label
    label = label.replace(LABEL_FILLERS, '')
  }
  return label.trim()
}

/** 리드 문단에서 장별 흐름을 추출한다. 확신이 없으면(2개 미만·이상한 라벨) 빈 배열. */
const parseFlow = (lede: string): ReflectionFlowItem[] => {
  const items: ReflectionFlowItem[] = []
  let lastIndex = 0
  for (const m of lede.matchAll(CHAPTER_REF)) {
    const label = cleanFlowLabel(lede.slice(lastIndex, m.index))
    lastIndex = (m.index ?? 0) + m[0].length
    if (!label || label.length > 40) return []
    items.push({ chapter: `${m[1].replace(/\s/g, '')}장`, label })
  }
  return items.length >= 2 ? items : []
}

export const parseReflection = (text: string): ParsedReflection => {
  const paragraphs = normalizeReflection(text)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length <= 1) {
    return { lede: null, flow: [], body: paragraphs, step: null }
  }

  let lede = paragraphs[0]
  const rest = paragraphs.slice(1)
  // 마지막 문단은 프롬프트상 "오늘의 한 걸음" 적용 — 문단이 넉넉할 때만 분리해
  // 짧은 묵상에서 본문이 텅 비어 보이는 일을 막는다
  const step = rest.length >= 2 ? rest[rest.length - 1] : null
  const body = step ? rest.slice(0, -1) : rest

  const flow = parseFlow(lede)
  if (flow.length > 0) {
    // 흐름을 목록으로 세웠으면 같은 내용을 담은 리드 문장은 중복 — 걷어낸다
    const sentences = lede.match(/[^.!?]+[.!?]*/g) ?? [lede]
    const kept = sentences.filter((s) => !/\(\s*\d+(?:\s*[-~–]\s*\d+)?\s*장\s*\)/.test(s))
    if (kept.length > 0) lede = kept.join(' ').trim()
  }

  return { lede, flow, body, step }
}

// '여호와 이레' 같은 따옴표 강조 구절 — 스캔의 발판이 되도록 세미볼드로 살린다
const QUOTED = /(['‘“"][^'’”"]{1,30}['’”"])/g

/** 문단을 따옴표 구절 기준으로 나눈다. 홀수 인덱스가 따옴표 구절. */
export const splitQuoted = (paragraph: string): string[] => paragraph.split(QUOTED)
