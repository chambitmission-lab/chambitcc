// 한 줄 붙잡기 — 로그인 안내 · 붙잡은 한 줄(고쳐 쓰기·지우기) · 쓰기 칸.
// 말씀 편지의 동행 3단계와 설교 영상 극장이 같은 조각을 쓴다(서버 저장은 sermon-takeaways).
import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import {
  useDeleteSermonTakeaway,
  useSaveSermonTakeaway,
  useSermonTakeaways,
} from '../../../hooks/useSermonTakeaways'

const TAKEAWAY_MAX = 200

const SermonTakeawayEditor = ({ sermonId }: { sermonId: number }) => {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  // 목사님께 이름 없이 전하기 — 새 한 줄은 켠 채로 시작, 고쳐 쓸 땐 저장된 값에서
  const [share, setShare] = useState(true)

  const { requireAuth } = useAuth()
  const { loggedIn, bySermon } = useSermonTakeaways()
  const saved = bySermon.get(sermonId)
  const save = useSaveSermonTakeaway()
  const remove = useDeleteSermonTakeaway()
  const showInput = loggedIn && (!saved || editing)

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    save.mutate({ sermonId, text, shared: share }, { onSuccess: () => { setEditing(false); setDraft('') } })
  }

  return (
    <>
      {!loggedIn && (
        <div className="sl-step-actions">
          <button type="button" className="sl-btn" onClick={() => requireAuth(() => {})}>
            <span className="material-icons-outlined">edit</span>로그인하고 붙잡기
          </button>
        </div>
      )}

      {loggedIn && saved && !editing && (
        <div className="sl-kept">
          <p className="sl-pen">{saved.text}</p>
          <p className="sl-share-note">
            <span className="material-icons-outlined" aria-hidden>
              {saved.shared ? 'mark_email_read' : 'lock'}
            </span>
            {saved.shared ? '목사님께 이름 없이 전했어요' : '나만 보는 한 줄이에요'}
          </p>
          <div className="sl-step-actions">
            <button
              type="button"
              className="sl-btn sl-btn--plain"
              onClick={() => {
                setDraft(saved.text)
                setShare(saved.shared)
                setEditing(true)
              }}
            >
              고쳐 쓰기
            </button>
            <button
              type="button"
              className="sl-btn sl-btn--plain"
              disabled={remove.isPending}
              onClick={() => remove.mutate(sermonId)}
            >
              지우기
            </button>
          </div>
        </div>
      )}

      {showInput && (
        <>
          <textarea
            className="sl-input"
            value={draft}
            maxLength={TAKEAWAY_MAX}
            rows={2}
            placeholder="오늘 마음에 남은 한 문장을 적어 보세요"
            onChange={(e) => setDraft(e.target.value)}
          />
          <label className="sl-share">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span>
              목사님께 이름 없이 전하기
              <small>이름 없이 한 줄만 전해져요. 설교 준비와 함께 나눌 질문에 쓰여요</small>
            </span>
          </label>
          <div className="sl-step-actions">
            <button
              type="button"
              className="sl-btn sl-btn--solid"
              disabled={!draft.trim() || save.isPending}
              onClick={submit}
            >
              <span className="material-icons-outlined">edit</span>
              {save.isPending ? '붙잡는 중…' : '붙잡기'}
            </button>
            {editing && (
              <button type="button" className="sl-btn sl-btn--plain" onClick={() => setEditing(false)}>
                취소
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default SermonTakeawayEditor
