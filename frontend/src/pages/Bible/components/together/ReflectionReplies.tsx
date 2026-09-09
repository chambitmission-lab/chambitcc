import { useState } from 'react'
import { useAddReflectionReply, useDeleteReflectionReply, useReflectionReplies } from '../../../../hooks/useVerseReflections'
import { showToast } from '../../../../utils/toast'
import RtAvatar from './RtAvatar'

interface ReflectionRepliesProps {
  verseId: number
  reflectionId: number
  canModerate: boolean
}

const REPLY_MAX = 500

/** 묵상 하나의 댓글 목록 + 한 줄 작성 폼. 펼쳤을 때만 마운트된다(그때 조회). */
const ReflectionReplies = ({ verseId, reflectionId, canModerate }: ReflectionRepliesProps) => {
  const { data: replies, isLoading } = useReflectionReplies(reflectionId, true)
  const add = useAddReflectionReply(verseId, reflectionId)
  const remove = useDeleteReflectionReply(verseId, reflectionId)
  const [text, setText] = useState('')

  const submit = () => {
    const content = text.trim()
    if (!content || add.isPending) return
    add.mutate(content, {
      onSuccess: () => setText(''),
      onError: (e) => showToast(e instanceof Error ? e.message : '댓글을 남기지 못했습니다', 'error'),
    })
  }

  return (
    <div className="rt-replies">
      {isLoading && <div className="rt-card__meta">댓글을 불러오는 중…</div>}
      {replies?.map((r) => (
        <div key={r.id} className="rt-reply">
          <RtAvatar author={r.author} small />
          <div className="rt-reply__bubble">
            <span className="rt-reply__name">{r.author.display_name}</span>
            <span className="rt-reply__meta">{r.time_ago}{r.is_edited ? ' · 수정됨' : ''}</span>
            <div className="rt-reply__text">{r.content}</div>
          </div>
          {(r.is_mine || canModerate) && (
            <button
              type="button"
              className="rt-reply__del"
              aria-label="댓글 삭제"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm('이 댓글을 삭제할까요?')) remove.mutate(r.id)
              }}
            >
              삭제
            </button>
          )}
        </div>
      ))}
      <form
        className="rt-reply-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <textarea
          value={text}
          maxLength={REPLY_MAX}
          rows={1}
          placeholder="따뜻한 한마디를 남겨 보세요"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button type="submit" disabled={!text.trim() || add.isPending}>
          {add.isPending ? '…' : '남기기'}
        </button>
      </form>
    </div>
  )
}

export default ReflectionReplies
