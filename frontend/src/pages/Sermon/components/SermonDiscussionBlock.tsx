// 함께 나눌 질문 — 목사님이 /pastor 설교의 메아리에서 공개한 것만 보인다(없으면 아무것도 그리지 않는다).
// 누구나 모임·단톡방에 그대로 옮길 수 있게 '나누기'는 공유 시트, 안 되면 복사.
import { useQuery } from '@tanstack/react-query'
import type { Sermon } from '../../../types/sermon'
import { getSermonDiscussion } from '../../../api/sermonTakeaway'
import { sermonKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'

const shareText = (sermon: Sermon, questions: string[]): string =>
  [
    `「${sermon.title}」 함께 나눌 질문`,
    sermon.bible_verse ? `본문: ${sermon.bible_verse}` : null,
    '',
    ...questions.map((q, i) => `${i + 1}. ${q}`),
  ]
    .filter((l) => l !== null)
    .join('\n')

const SermonDiscussionBlock = ({ sermon }: { sermon: Sermon }) => {
  const { data: questions } = useQuery({
    queryKey: sermonKeys.discussion(sermon.id),
    queryFn: () => getSermonDiscussion(sermon.id),
    staleTime: 1000 * 60 * 10,
  })
  if (!questions?.length) return null

  const share = async () => {
    const text = shareText(sermon, questions)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('나눔 질문을 복사했어요', 'success')
    } catch {
      showToast('복사하지 못했어요', 'error')
    }
  }

  return (
    <div className="sl-discuss">
      <div className="sl-discuss-head">
        <span className="material-icons-outlined" aria-hidden>forum</span>
        <b>이번 주 함께 나눌 질문</b>
      </div>
      <ol>
        {questions.map((q, i) => (
          <li key={i}>
            <span className="sl-discuss-n">{i + 1}</span>
            <p>{q}</p>
          </li>
        ))}
      </ol>
      <div className="sl-step-actions">
        <button type="button" className="sl-btn" onClick={share}>
          <span className="material-icons-outlined">ios_share</span>
          함께 나누기
        </button>
      </div>
    </div>
  )
}

export default SermonDiscussionBlock
