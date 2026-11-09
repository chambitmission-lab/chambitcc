import { useEffect } from 'react'
import { ensureFontFamily } from '../../../../utils/deferredFonts'
import type { PassageRef } from '../../data/crossRefs'
import { getPromiseNote, getPromiseRefs, type MessiahHit } from '../../data/messiah'
import { BOOK_ABBREV_KO } from '../bibleBookAbbrev'
import '../../styles/promise-pencil.css'

/** "갈 3:16" — 여백 메모라 약칭으로 짧게 */
const abbrevRef = (r: PassageRef) => `${BOOK_ABBREV_KO[r.b] ?? ''} ${r.c}:${r.v}`

interface VersePromiseNoteProps {
  hits: MessiahHit[]
  /** 이어읽기 문단 안이면 짝 위치만 작게 ("→ 갈 3:16") — 문단을 줄바꿈으로 끊지 않게 */
  inline?: boolean
  onOpen: () => void
}

/**
 * 약속과 성취 — 연필 밑줄 옆 손글씨 메모. 목사님이 성경책 여백에 연필로 적어 준 한 줄처럼.
 * 구약 절: "이 ‘씨’가 바로 그리스도예요 → 갈 3:16", 신약 절: "← 창 22:18 아브라함의 그 씨, 그리스도".
 * 본문 범위의 첫 절에만 단다(밑줄은 VerseText 가 범위 안 문구마다 긋는다). 누르면 약속 시트.
 */
const VersePromiseNote = ({ hits, inline, onOpen }: VersePromiseNoteProps) => {
  const firsts = hits.filter((h) => h.first)
  const show = firsts.length > 0
  // 손글씨 서체는 이 메모가 처음 뜰 때 받는다 (모든 사용자가 앱을 켤 때 받지 않게)
  useEffect(() => {
    if (show) void ensureFontFamily('nanumPen')
  }, [show])
  if (!show) return null

  const side = firsts[0].side
  const lines = firsts.map((h) => {
    const note = getPromiseNote(h.promise, h.side)
    const { ot, nt } = getPromiseRefs(h.promise)
    return h.side === 'ot'
      ? { key: h.promise.id, text: note, ref: `→ ${abbrevRef(nt[0])}`, refFirst: false }
      : { key: h.promise.id, text: note, ref: `← ${abbrevRef(ot)}`, refFirst: true }
  })
  const label = side === 'ot' ? '메시아 약속' : '약속의 성취'

  if (inline) {
    return (
      <button
        type="button"
        className={`verse-promise-note verse-promise-note--inline verse-promise-note--${side}`}
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        aria-label={`${label} ${lines.map((l) => l.text).join(', ')} 보기`}
      >
        {lines[0].ref}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`verse-promise-note verse-promise-note--${side}`}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      aria-label={`${label} ${lines.map((l) => l.text).join(', ')} 보기`}
    >
      {lines.map((l) => (
        <span key={l.key} className="verse-promise-note__line">
          {l.refFirst ? `${l.ref} ${l.text}` : `${l.text} ${l.ref}`}
        </span>
      ))}
    </button>
  )
}

export default VersePromiseNote
