// 참비 로컬 사전 응답 — 서버로 보내기 전에 "바리새인이 뭐야", "할례 뜻", "골고다 어디야",
// 또는 표제어 하나만 친 질문을 성경 사전(bibleGlossary)에서 찾아 네트워크 없이 답한다.
//
// 좁게 잡는 것이 원칙이다. 성경 참조("요 3:16")·관계 질문("다윗의 아들은?")·인물 상세("○○ 인물")는
// 서버 파이프라인이 더 잘 답하므로 건드리지 않는다. 못 잡으면 null → 기존대로 서버로 간다.
import type { ChatReply } from '../../types/chatbot'
import {
  findGlossaryEntry,
  loadGlossary,
  GLOSSARY_TYPE_LABEL,
  type GlossaryEntry,
} from '../../pages/Bible/data/bibleGlossary'
import { parseBibleReference } from '../../pages/Sermon/utils/sermonMeta'

/** 사전으로 답하지 않고 서버에 맡길 신호 — 숫자(참조·장·절), 관계어, 인물 상세 키워드 */
// "형"·"딸"은 형통·딸기 같은 낱말 속에도 있어 조사가 붙은 꼴만 관계어로 본다
const SERVER_ONLY = /\d|가계도|계보|관계|인물|아들|딸(?:은|이|의|들|을)|아버지|어머니|아내|남편|부모|자녀|형제|자매|형(?:은|이|의|님|들|을)|동생|가족|후손|조상|누구의|구절|말씀\s*(찾|알려|보여)|퀴즈/

/** 질문 꼬리 — 긴 것부터 벗겨야 "무슨 뜻이에요"가 "뜻이에요"보다 먼저 잡힌다 */
const TAILS = [
  '무슨 뜻이에요', '무슨 뜻인가요', '무슨 뜻이야', '무슨 뜻이지', '무슨 뜻', '무슨 의미',
  '뜻이 뭐예요', '뜻이 뭔가요', '뜻이 뭐야', '뜻이 뭐지', '뜻이 뭐임', '뜻을 알려줘', '뜻 알려줘', '뜻은', '뜻이', '뜻',
  '의미가 뭐예요', '의미가 뭐야', '의미는', '의미',
  '설명해 주세요', '설명해주세요', '설명해 줘', '설명해줘', '설명 좀', '설명',
  '알려 주세요', '알려주세요', '알려 줘', '알려줘', '알려줄래', '가르쳐 줘', '가르쳐줘',
  '뭐예요', '뭔가요', '뭐야', '뭐지', '뭐임', '뭐니', '뭘까', '무엇인가요', '무엇입니까', '무엇이야', '무엇',
  '누구예요', '누군가요', '누구야', '누구지', '누구임', '누구니', '누구',
  '어디예요', '어딘가요', '어디야', '어디지', '어디임', '어디니', '어디',
  '라는 게', '이라는 게', '라는 말', '이라는 말', '라는 건', '이라는 건', '라는 것', '이라는 것',
  '에 대해', '에 대해서', '에 관해', '에 관해서', '이란', '란',
]

/** 표제어 뒤에 붙었을 조사 — 하나만 벗긴다("바리새인이", "골고다는") */
const PARTICLE = /(이|가|은|는|을|를|의|이란|란|께서|에서|도)$/

const stripPunct = (s: string) => s.replace(/[\s?？!！.。,~…]+$/g, '').replace(/^[\s"'“‘]+|[\s"'”’]+$/g, '')

/** 질문에서 표제어 후보를 뽑는다 — 꼬리 벗기기 → 조사 벗기기 순, 최대 3바퀴 */
const extractTerm = (msg: string): string => {
  let s = stripPunct(msg)
  for (let i = 0; i < 3; i++) {
    let changed = false
    for (const tail of TAILS) {
      if (s.endsWith(tail) && s.length > tail.length) {
        s = stripPunct(s.slice(0, -tail.length))
        changed = true
        break
      }
    }
    if (!changed) break
  }
  return s
}

/** 로딩 전에 미리 거르는 조건 — 이걸 통과한 질문만 사전 청크를 내려받는다 */
export const looksLikeGlossaryQuestion = (msg: string): boolean => {
  const s = msg.trim()
  if (s.length < 1 || s.length > 28) return false
  if (SERVER_ONLY.test(s)) return false
  return true
}

const verseLinkFor = (entry: GlossaryEntry): string | null => {
  const p = parseBibleReference(entry.first)
  if (!p?.bookNumber) return null
  return `/bible/${p.bookNumber}/${p.chapter}${p.verse ? `?verse=${p.verse}` : ''}`
}

/**
 * 교회 안내 맥락과 겹치는 낱말 — 낱말만 덜렁 치면("예배", "교회") 사전 뜻풀이보다
 * 서버의 교회 안내(예배 시간·소개)가 더 맞다. 이런 항목은 "뜻/뭐야" 꼬리가 있을 때만 사전이 답한다.
 */
const CHURCH_CONTEXT = new Set(['교회', '예배', '헌금', '기도', '새벽기도', '목사', '심방', '전도', '찬양', '성찬', '축도', '송영', '주님', '전도사', '권사', '장로', '집사'])

const TYPE_EMOJI: Record<GlossaryEntry['type'], string> = {
  person: '👤',
  place: '🗺️',
  title: '🎖️',
  term: '📖',
  archaic: '✍️',
  loanword: '🔤',
}

/** 사전 항목 → 참비 말풍선. 대표 구절은 링크 칩, 인물은 서버 인물 카드로 이어지는 칩을 단다 */
export const glossaryReply = (entry: GlossaryEntry): ChatReply => {
  const link = verseLinkFor(entry)
  const actions: ChatReply['actions'] = []
  if (link) actions.push({ label: `📖 ${entry.first} 읽기`, type: 'link', value: link })
  // 인물은 백엔드 bible_figures(시대·역할·가계도)가 더 자세하다 — "인물" 키워드로 서버 핸들러를 부른다
  if (entry.type === 'person') actions.push({ label: '🌳 인물·가계도 더 보기', type: 'message', value: `${entry.name} 인물` })
  actions.push({ label: '🔎 본문에서 찾기', type: 'link', value: `/bible?tab=search&q=${encodeURIComponent(entry.name)}` })

  const lines = [`${TYPE_EMOJI[entry.type]} ${entry.name}`, `[${GLOSSARY_TYPE_LABEL[entry.type]}]`, entry.desc]
  if (entry.alt?.length) lines.push(`다른 표기: ${entry.alt.join(', ')}`)
  if (!link) lines.push(`참고: ${entry.first}`)

  return {
    kind: 'glossary',
    text: lines.join('\n'),
    verses: [],
    actions,
    expression: 'talking',
  }
}

/**
 * 사전이 답할 수 있으면 즉시 응답, 아니면 null.
 * 첫 호출에서만 사전 청크(약 70KB)를 내려받고 이후엔 메모리 조회.
 */
export const tryGlossaryReply = async (msg: string): Promise<ChatReply | null> => {
  if (!looksLikeGlossaryQuestion(msg)) return null
  const term = extractTerm(msg)
  if (!term || term.length > 12) return null
  try {
    await loadGlossary()
  } catch {
    return null
  }
  // 그대로 → 조사 하나 벗긴 형태 순으로 시도 ("바리새인이 뭐야" → "바리새인이" → "바리새인")
  const entry = findGlossaryEntry(term) ?? findGlossaryEntry(term.replace(PARTICLE, ''))
  if (!entry) return null
  const asked = term !== stripPunct(msg)
  if (!asked && CHURCH_CONTEXT.has(entry.name)) return null
  return glossaryReply(entry)
}
