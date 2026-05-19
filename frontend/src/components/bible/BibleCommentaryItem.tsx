import { useEffect, useMemo } from 'react'
import { Markdown } from '../../utils/markdown'
import { useTextToSpeech } from '../../hooks/useTextToSpeech'
import { showToast } from '../../utils/toast'
import type { BibleCommentary } from '../../types/bibleCommentary'

interface BibleCommentaryItemProps {
  commentary: BibleCommentary
  bookNameKo?: string
  isAdmin: boolean
  onEdit?: (commentary: BibleCommentary) => void
  onDelete?: (commentary: BibleCommentary) => void
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const formatRange = (c: BibleCommentary) => {
  if (c.verse_start === c.verse_end) return `${c.verse_start}절`
  return `${c.verse_start}-${c.verse_end}절`
}

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  신학적: { icon: 'church', label: '신학적' },
  역사적: { icon: 'account_balance', label: '역사적' },
  원어: { icon: 'translate', label: '원어' },
  적용: { icon: 'eco', label: '적용' },
  묵상: { icon: 'self_improvement', label: '묵상' },
}

const DEFAULT_META = { icon: 'menu_book', label: '해설' }

const stripMarkdown = (md: string): string =>
  md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const BibleCommentaryItem = ({
  commentary,
  bookNameKo,
  isAdmin,
  onEdit,
  onDelete,
}: BibleCommentaryItemProps) => {
  const authorName =
    commentary.author?.full_name || commentary.author?.username || '관리자'

  const meta = commentary.category
    ? CATEGORY_META[commentary.category] ?? DEFAULT_META
    : DEFAULT_META

  const tts = useTextToSpeech({ rate: 1 })

  // 언마운트시 TTS 정지
  const ttsStop = tts.stop
  useEffect(() => {
    return () => {
      ttsStop()
    }
  }, [ttsStop])

  const plainText = useMemo(
    () => stripMarkdown(commentary.content),
    [commentary.content],
  )

  const handleTTS = () => {
    if (tts.isPlaying) {
      tts.stop()
      return
    }
    const head = commentary.title ? `${commentary.title}. ` : ''
    tts.speak(head + plainText)
  }

  const handleShare = async () => {
    const reference = bookNameKo
      ? `${bookNameKo} ${commentary.chapter}:${formatRange(commentary)}`
      : `${commentary.chapter}:${formatRange(commentary)}`
    const header = commentary.title
      ? `${reference} — ${commentary.title}`
      : reference
    const body = `${header}\n\n${plainText}\n\n— 참빛교회 함께 묵상`

    try {
      if (navigator.share) {
        await navigator.share({ title: header, text: body })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(body)
        showToast('해설을 복사했어요', 'success')
      } else {
        showToast('이 브라우저는 공유를 지원하지 않아요', 'info')
      }
    } catch (e) {
      // 사용자가 share dialog를 취소한 경우는 무시
      if ((e as DOMException)?.name === 'AbortError') return
      showToast('공유 중 문제가 발생했어요', 'error')
    }
  }

  return (
    <article className="commentary-item">
      <header className="commentary-item-head">
        <div className="commentary-item-cat-emblem">
          <span className="material-icons-round">{meta.icon}</span>
        </div>
        <div className="commentary-item-head-meta">
          <span className="commentary-item-cat-label">{meta.label}</span>
          <span className="commentary-item-verse-range">
            {formatRange(commentary)}
          </span>
        </div>
      </header>

      {commentary.title && (
        <h4 className="commentary-item-title">{commentary.title}</h4>
      )}

      <div className="commentary-item-body">
        <Markdown source={commentary.content} />
      </div>

      <footer className="commentary-item-footer">
        <span className="commentary-item-author">
          <span
            className="material-icons-round"
            style={{ fontSize: 13, opacity: 0.7 }}
          >
            edit_note
          </span>
          {authorName} · {formatDate(commentary.updated_at)}
        </span>

        <div className="commentary-item-actions">
          {tts.isSupported && (
            <button
              type="button"
              className={`commentary-item-action-btn${tts.isPlaying ? ' is-active' : ''}`}
              onClick={handleTTS}
              title={tts.isPlaying ? '낭독 정지' : '해설 듣기'}
              aria-label={tts.isPlaying ? '낭독 정지' : '해설 듣기'}
            >
              <span className="material-icons-round">
                {tts.isPlaying ? 'stop_circle' : 'volume_up'}
              </span>
            </button>
          )}
          <button
            type="button"
            className="commentary-item-action-btn"
            onClick={handleShare}
            title="가족·소그룹에 공유"
            aria-label="공유"
          >
            <span className="material-icons-round">ios_share</span>
          </button>
          {isAdmin && onEdit && (
            <button
              type="button"
              className="commentary-item-action-btn"
              onClick={() => onEdit(commentary)}
              title="해설 수정"
              aria-label="수정"
            >
              <span className="material-icons-round">edit</span>
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              type="button"
              className="commentary-item-action-btn is-danger"
              onClick={() => onDelete(commentary)}
              title="해설 삭제"
              aria-label="삭제"
            >
              <span className="material-icons-round">delete_outline</span>
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}

export default BibleCommentaryItem
