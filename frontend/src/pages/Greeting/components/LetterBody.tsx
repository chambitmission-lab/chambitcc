/* 편지 본문 렌더러
   greeting_body 는 DB 의 자유 텍스트다. 대부분은 pre-line 문단으로 충분하지만,
   "첫째, … / 둘째, …" 처럼 서수로 이어지는 열거 구간은 목사님의 재치가 담긴
   대목이라 평문으로 흘려보내면 아깝다. 렌더 시점에 그 구간만 찾아
   번호 목록 블록으로 세우고, "○○과 같은 만남" 의 비유 명사를 강조한다.
   원문은 손대지 않는다 — 감지에 실패하면 그대로 문단이 된다. */
import { useMemo } from 'react'

const ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째']
/* 영어 번역본(greeting_body_en)도 같은 목록 블록으로 선다 — "First, … / Second, …" */
const ORDINALS_EN = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']
const ORDINAL_RE = new RegExp(
  `^(${[...ORDINALS, ...ORDINALS_EN].join('|')})\\s*[,，:：]?\\s*(.+)$`,
)
/* "생선과 같은 만남", "손수건 같은 만남" — 문장 끝의 비유(명사 + 같은 + 명사) */
const SIMILE_RE = /^(.*?)(\S+?)((?:과|와|처럼)?\s*같은\s+\S+)\s*$/
/* 영어는 어순이 반대라 비유가 줄 앞에 온다 — "a meeting like a fish — the more you meet, …" */
const SIMILE_EN_RE = /^(.*?)\b((?:an?|the)\s+\w+\s+like\s+(?:an?|the)\s+[^—–,.;:]+?)(\s*(?:[—–,.;:].*)?)$/i

/* 핵심 문장 강조 — 원문에 표시 기호를 넣지 않고 렌더 시점에 찾는다
   (기호를 넣으면 관리자 미리보기·목사님 시트 등 평문 화면에 그대로 드러난다).
   1) 따옴표로 인용한 말은 언제나  2) 관리자가 정한 핵심 문장(keyPhrases — about_content 의
   greetingKeyPhrases, 한 줄에 하나) — 원문이 바뀌어 못 찾으면 조용히 평문 */
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/* 인용은 문장 길이(12자+)만 — "True Light" 같은 짧은 이름 따옴표는 강조하지 않는다 */
const QUOTE_SRC = `["“][^"”\\n]{12,}["”]`
const emphasisRe = (keyPhrases: readonly string[]) =>
  new RegExp(`(${[QUOTE_SRC, ...keyPhrases.map(escapeRe)].join('|')})`, 'g')

function Emphasized({ text, re }: { text: string; re: RegExp }) {
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="gr-em">
            {part}
          </em>
        ) : (
          part
        ),
      )}
    </>
  )
}

type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: { ordinal: string; body: string }[] }

function parseLetter(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let buf: string[] = []
  let list: { ordinal: string; body: string }[] = []

  const flushText = () => {
    if (buf.length) blocks.push({ kind: 'text', text: buf.join('\n') })
    buf = []
  }
  const flushList = () => {
    if (list.length >= 2) {
      flushText()
      blocks.push({ kind: 'list', items: list })
    } else if (list.length === 1) {
      // 한 줄짜리는 열거가 아니다 — 문단으로 되돌린다
      buf.push(`${list[0].ordinal}, ${list[0].body}`)
    }
    list = []
  }

  for (const raw of lines) {
    const line = raw.trim()
    const m = line.match(ORDINAL_RE)
    if (m) {
      list.push({ ordinal: m[1], body: m[2] })
      continue
    }
    if (list.length) {
      flushList()
    }
    buf.push(raw)
  }
  flushList()
  flushText()
  return blocks
}

function Item({ ordinal, body }: { ordinal: string; body: string }) {
  const m = body.match(SIMILE_RE)
  const en = m ? null : body.match(SIMILE_EN_RE)
  return (
    <li className="gr-enum-item">
      <span className="gr-enum-text">
        <span className="gr-enum-ordinal">{ordinal},</span>{' '}
        {m ? (
          <>
            {m[1]}
            <mark className="gr-enum-simile">
              {m[2]}
              {m[3]}
            </mark>
          </>
        ) : en ? (
          <>
            {en[1]}
            <mark className="gr-enum-simile">{en[2]}</mark>
            {en[3]}
          </>
        ) : (
          body
        )}
      </span>
    </li>
  )
}

interface LetterBodyProps {
  text: string
  /** 본문에서 강조할 문장들 — 없으면 따옴표 인용만 강조한다 */
  keyPhrases?: readonly string[]
}

export default function LetterBody({ text, keyPhrases }: LetterBodyProps) {
  const blocks = useMemo(() => parseLetter(text), [text])
  // 목록 내용이 같으면 정규식을 다시 만들지 않는다(부모가 매 렌더 새 배열을 넘겨도)
  const phraseKey = (keyPhrases ?? []).join('\n')
  const re = useMemo(() => emphasisRe(phraseKey ? phraseKey.split('\n') : []), [phraseKey])
  return (
    <>
      {blocks.map((b, i) =>
        b.kind === 'list' ? (
          <ol key={i} className="gr-enum">
            {b.items.map((it, j) => (
              <Item key={j} ordinal={it.ordinal} body={it.body} />
            ))}
          </ol>
        ) : (
          <p key={i} className="gr-letter-text" style={{ whiteSpace: 'pre-line' }}>
            <Emphasized text={b.text} re={re} />
          </p>
        ),
      )}
    </>
  )
}
