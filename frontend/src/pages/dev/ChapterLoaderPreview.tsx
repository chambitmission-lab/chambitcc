import { useState } from 'react'
import ChapterQuipLoader from '../Bible/components/ChapterQuipLoader'

/* /bible 장 첫 로딩 장면 카드 — 실제 컴포넌트를 다시 마운트하며 장면을 차례로 본다 */
const ChapterLoaderPreview = () => {
  const [key, setKey] = useState(0)
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <button
        type="button"
        onClick={() => setKey(k => k + 1)}
        className="rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white"
      >
        장 다시 열기 (다음 장면)
      </button>
      <ChapterQuipLoader key={key} />
    </div>
  )
}

export default ChapterLoaderPreview
