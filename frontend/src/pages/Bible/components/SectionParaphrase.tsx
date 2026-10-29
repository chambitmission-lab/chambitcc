import { useEffect, useMemo, useState } from 'react'
import { ensureFontFamily } from '../../../utils/deferredFonts'

interface SectionParaphraseProps {
  text: string
  /** 단락 절 범위 — 접힌 버튼의 접근성 이름과 노트의 범위 칩에 쓴다 */
  range: [number, number] | null
  /** PC 넓은 화면 — 본문 컬럼 오른쪽 여백에 노트로 띄운다(본문 흐름을 밀지 않음) */
  side?: boolean
}

/** 풀이는 2~3문장 평문 — 첫 문장을 요지로 빛 밑줄, 나머지는 옅게 둔다 */
const splitLead = (text: string): [string, string] => {
  const sentences = text.match(/[^.?!]+[.?!]+["”’)]*/g)?.map((s) => s.trim()) ?? []
  if (sentences.length < 2) return [text, '']
  return [sentences[0], sentences.slice(1).join(' ')]
}

/**
 * 단락 "쉽게 풀면" — 소제목 아래 접혀 있다가 누르면 오늘의 말로 푼 2~3문장이 손글씨 테이프를 붙인
 * 묵상 메모로 펼쳐진다. PC에서 여백이 넉넉하면 본문 옆에 붙어 단락을 따라 내려온다(sticky).
 * 본문보다 먼저 눈에 들어오면 말씀 대신 풀이를 읽게 되므로 기본은 접힘.
 */
const SectionParaphrase = ({ text, range, side = false }: SectionParaphraseProps) => {
  const [open, setOpen] = useState(false)
  const [lead, rest] = useMemo(() => splitLead(text), [text])
  const label = range ? `${range[0]}-${range[1]}절 쉽게 풀어 보기` : '쉽게 풀어 보기'
  const rangeLabel = range ? (range[0] === range[1] ? `${range[0]}절` : `${range[0]}–${range[1]}절`) : null

  // 테이프 손글씨(나눔펜)는 펼칠 때만 받는다 — 읽기 화면 첫 진입엔 필요 없음
  useEffect(() => {
    if (open) void ensureFontFamily('nanumPen')
  }, [open])

  const note = (
    <div className="paraphrase-note">
      <span className="paraphrase-note__tape" aria-hidden>쉽게 풀면</span>
      {rangeLabel && <span className="paraphrase-note__range">{rangeLabel}</span>}
      <p className="paraphrase-note__lead">
        <span>{lead}</span>
      </p>
      {rest && <p className="paraphrase-note__rest">{rest}</p>}
    </div>
  )

  return (
    <div className={`section-paraphrase${open ? ' is-open' : ''}${side ? ' is-side' : ''}`}>
      <button
        type="button"
        className="section-paraphrase__toggle"
        aria-expanded={open}
        aria-label={open ? '쉬운 풀이 접기' : label}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="material-icons-round" aria-hidden>
          {open ? 'expand_less' : 'lightbulb'}
        </span>
        {open ? '풀이 접기' : '쉽게 풀면'}
      </button>
      {open &&
        (side ? (
          // 레일은 단락(.verse-section/.verse-paragraph) 높이만큼 오른쪽 여백에 서고, 노트가 그 안에서 따라 내려온다
          <div className="section-paraphrase__rail">
            <aside className="section-paraphrase__sticky">{note}</aside>
          </div>
        ) : (
          note
        ))}
    </div>
  )
}

export default SectionParaphrase
