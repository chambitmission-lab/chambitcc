// 필사대회에 낸 내 글씨를 말씀 카드로 — 이미 쓴 글씨를 다시 쓰게 하지 않는다.
// 가장 최근 대회에 내 출품작(획 데이터)이 있을 때만 보인다. 로그인한 사람에게만 렌더할 것.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getContestEntryInk } from '../../../../api/handwritingContest'
import { contestKeys, useContest, useContests } from '../../../../hooks/useHandwritingContest'
import { isInkPageEmpty, parseInkPageFile } from '../../../Capsule/ink/inkModel'
import type { InkPage } from '../../../Capsule/ink/inkModel'
import type { PickedVerse } from '../recommendedVerses'
import type { PhotoVerseTexts } from '../texts'

interface Props {
  t: PhotoVerseTexts
  /** 지금 카드에 올라가 있는 손글씨의 말씀 — 같은 출품작이면 버튼을 숨긴다 */
  activeRef: string | null
  onImport: (verse: PickedVerse, page: InkPage) => void
  onFailed: (msg: string) => void
}

const ContestInkImport = ({ t, activeRef, onImport, onFailed }: Props) => {
  const qc = useQueryClient()
  const { data: list } = useContests()
  const contest = list?.items.find((c) => c.phase !== 'upcoming')
  const { data: detail } = useContest(contest?.id ?? 0)
  const entry = detail?.my_entry
  const [busy, setBusy] = useState(false)

  if (!entry?.has_ink || activeRef === entry.verse_ref) return null

  const handleImport = async () => {
    if (busy) return
    setBusy(true)
    try {
      const raw = await qc.fetchQuery({
        queryKey: contestKeys.ink(entry.contest_id, entry.id),
        queryFn: () => getContestEntryInk(entry.contest_id, entry.id),
        staleTime: Infinity,
      })
      const page = parseInkPageFile(raw)
      if (!page || isInkPageEmpty(page)) throw new Error('empty ink')
      onImport({ text: entry.verse_text, refLabel: entry.verse_ref }, page)
    } catch {
      onFailed(t.inkImportFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className="pv-edit-chip pv-ink__import" onClick={() => void handleImport()} disabled={busy}>
      <span className="material-icons-round text-[16px]">{busy ? 'hourglass_top' : 'history_edu'}</span>
      {busy ? t.inkImporting : t.inkImport}
      {!busy && <span className="pv-edit-chip__badge">{entry.verse_ref}</span>}
    </button>
  )
}

export default ContestInkImport
