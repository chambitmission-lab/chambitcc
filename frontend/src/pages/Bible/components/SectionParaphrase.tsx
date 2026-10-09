import { useState } from 'react'

interface SectionParaphraseProps {
  text: string
  /** 단락 절 범위 — 접힌 버튼의 접근성 이름에 쓴다 */
  range: [number, number] | null
}

/**
 * 단락 "쉽게 풀면" — 소제목 아래 접혀 있다가 누르면 오늘의 말로 푼 2~3문장이 펼쳐진다.
 * 본문보다 먼저 눈에 들어오면 말씀 대신 풀이를 읽게 되므로 기본은 접힘.
 */
const SectionParaphrase = ({ text, range }: SectionParaphraseProps) => {
  const [open, setOpen] = useState(false)
  const label = range ? `${range[0]}-${range[1]}절 쉽게 풀어 보기` : '쉽게 풀어 보기'

  return (
    <div className={`section-paraphrase${open ? ' is-open' : ''}`}>
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
      {open && <p className="section-paraphrase__text">{text}</p>}
    </div>
  )
}

export default SectionParaphrase
