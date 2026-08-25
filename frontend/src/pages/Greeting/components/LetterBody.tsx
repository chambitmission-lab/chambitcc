/* 편지 본문 렌더러
   greeting_body 는 DB 의 자유 텍스트다. 대부분은 pre-line 문단으로 충분하지만,
   "첫째, … / 둘째, …" 처럼 서수로 이어지는 열거 구간은 목사님의 재치가 담긴
   대목이라 평문으로 흘려보내면 아깝다. 렌더 시점에 그 구간만 찾아
   번호 목록 블록으로 세우고, "○○과 같은 만남" 의 비유 명사를 강조한다.
   원문은 손대지 않는다 — 감지에 실패하면 그대로 문단이 된다. */

const ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째']
const ORDINAL_RE = new RegExp(`^(${ORDINALS.join('|')})\\s*[,，:：]?\\s*(.+)$`)
/* "생선과 같은 만남", "손수건 같은 만남" — 문장 끝의 비유(명사 + 같은 + 명사) */
const SIMILE_RE = /^(.*?)(\S+?)((?:과|와|처럼)?\s*같은\s+\S+)\s*$/

type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: { ordinal: string; body: string }[] }

export function parseLetter(text: string): Block[] {
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

function Item({ ordinal, body, index }: { ordinal: string; body: string; index: number }) {
  const m = body.match(SIMILE_RE)
  return (
    <li className="gr-enum-item">
      <span className="gr-enum-num" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
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
        ) : (
          body
        )}
      </span>
    </li>
  )
}

export default function LetterBody({ text }: { text: string }) {
  const blocks = parseLetter(text)
  return (
    <>
      {blocks.map((b, i) =>
        b.kind === 'list' ? (
          <ol key={i} className="gr-enum">
            {b.items.map((it, j) => (
              <Item key={j} index={j} ordinal={it.ordinal} body={it.body} />
            ))}
          </ol>
        ) : (
          <p key={i} className="gr-letter-text" style={{ whiteSpace: 'pre-line' }}>
            {b.text}
          </p>
        ),
      )}
    </>
  )
}
