import { useEffect, useState } from 'react'
import LoadingVerseToast from '../../components/common/LoadingVerseToast'
import { WAITING_QUIPS } from '../../utils/waitingQuips'

/**
 * /#/dev/loading-verse — 전역 "불러오는 중" 말풍선 미리보기.
 * 실제론 요청 큐가 450ms 넘게 비지 않을 때만 뜬다. 여기선 켜 둔 채로 문구 목록과 자리를 본다.
 * 문구를 넘겨 보려면 "다음 문구" 버튼(말풍선을 껐다 켜서 순번을 넘긴다).
 */
const LoadingVersePreview = () => {
  const [on, setOn] = useState(true)
  useEffect(() => {
    if (!on) {
      const t = setTimeout(() => setOn(true), 1600)
      return () => clearTimeout(t)
    }
  }, [on])

  return (
    <div className="page-stage min-h-[80vh] px-4 py-6 lg:max-w-xl lg:mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-strong)]">불러오는 중 말풍선</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        화면이 카드 하나씩 채워지는 동안 바닥에 뜬다. 모바일은 플로팅 독 위, PC 는 바닥 가운데.
      </p>
      <button
        type="button"
        className="mt-4 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        disabled={!on}
        onClick={() => setOn(false)}
      >
        다음 문구
      </button>
      <ul className="mt-6 space-y-2">
        {WAITING_QUIPS.map((q) => (
          <li key={q.refKo} className="rounded-xl border border-[var(--card-border)] px-3 py-2 text-sm">
            <span className="text-[var(--text-strong)]">{q.ko}</span>{' '}
            <span className="text-[var(--text-muted)]">— {q.refKo}</span>
          </li>
        ))}
      </ul>
      {on && <LoadingVerseToast preview />}
    </div>
  )
}

export default LoadingVersePreview
