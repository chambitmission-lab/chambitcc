// 말씀 카드 '직접 쓰기' — 필사대회·타임캡슐과 같은 손글씨 종이(HandwritingSheet)를 한 장짜리로 연다.
// 종이 위에는 따라 쓸 말씀을 접었다 폈다 할 수 있는 안내로 둔다. 이 화면 청크와 따로 받는다(lazy).
import { useState } from 'react'
import HandwritingSheet from '../../../Capsule/ink/HandwritingSheet'
import type { InkPage } from '../../../Capsule/ink/inkModel'
import type { PickedVerse } from '../recommendedVerses'
import type { PhotoVerseTexts } from '../texts'
import '../../../Capsule/styles/ink.css'
import '../styles/ink-write.css'

interface Props {
  t: PhotoVerseTexts
  verse: PickedVerse
  pages: InkPage[]
  onChange: (pages: InkPage[]) => void
  onClose: () => void
}

const InkWriteSheet = ({ t, verse, pages, onChange, onClose }: Props) => {
  const [folded, setFolded] = useState(false)

  return (
    <HandwritingSheet
      pages={pages}
      onChange={onChange}
      onClose={onClose}
      eyebrow={t.inkEyebrow}
      heading={verse.refLabel}
      maxPages={1}
      writtenHint={() => t.inkWrittenHint}
      guide={
        <button
          type="button"
          className={`pv-ink-guide${folded ? ' pv-ink-guide--folded' : ''}`}
          onClick={() => setFolded((v) => !v)}
          aria-expanded={!folded}
        >
          <span className="pv-ink-guide__text">{verse.text}</span>
          <span className="pv-ink-guide__meta">
            {verse.refLabel} · {folded ? t.inkGuideUnfold : t.inkGuideFold}
          </span>
        </button>
      }
    />
  )
}

export default InkWriteSheet
