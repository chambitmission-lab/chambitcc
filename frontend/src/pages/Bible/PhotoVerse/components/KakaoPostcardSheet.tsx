import { useEffect, useRef, useState } from 'react'
import KakaoIcon from '../../../../components/icons/KakaoIcon'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { isMobile, kakaoShareFeed, kakaoUploadImage, loadKakaoShare } from '../../../../utils/kakaoShare'
import { sessionStore } from '../../../../utils/tokenStore'
import { POSTCARD_SIZE, drawKakaoPostcard } from '../canvas/postcard'

interface KakaoPostcardSheetProps {
  /** 지금 미리보기 중인 카드를 그려 둔 캔버스 */
  card: HTMLCanvasElement
  refLabel: string
  /** 카드에 쓴 인사말 — 있으면 엽서 한마디의 첫 값 */
  greeting?: string
  /** 카드가 폴라로이드 프레임이라 흰 여백·출처를 이미 갖고 있는지 */
  hasOwnMat: boolean
  /** 그 절이 열리는 링크 — 출처를 못 풀면 null */
  verseLink: string | null
  /** 같은 스타일로 시작하는 링크 */
  remixLink: string
  language: 'ko' | 'en'
  /** 사진 파일로 보내기(공유 시트) — 파일 공유가 되는 기기에서만 */
  onShareFile?: () => void
  onSent: () => void
  onFailed: (message: string) => void
  onClose: () => void
}

const NOTE_MAX = 28

const TEXTS = {
  ko: {
    title: '말씀 엽서 보내기',
    noteLabel: '엽서에 쓸 한마디',
    defaultNote: '오늘 이 말씀이 생각났어요',
    sign: (name: string) => `${name} 드림`,
    send: '카카오톡으로 보내기',
    uploading: '엽서를 준비하고 있어요…',
    ready: '준비됐어요 · 카카오톡 열기',
    other: '사진 파일로 다른 앱에 보내기',
    hint: '보내기를 누르면 이 엽서 그림만 카카오 서버에 올라가요. 원본 사진은 기기에 남아요.',
    failed: '엽서를 올리지 못했어요. 잠시 뒤 다시 시도해 주세요.',
    cardTitle: (name: string | null) => (name ? `${name} 님이 보낸 말씀 엽서` : '말씀 엽서가 도착했어요'),
    read: '말씀 읽기',
    reply: '답장 엽서 쓰기',
    close: '닫기',
  },
  en: {
    title: 'Send a verse postcard',
    noteLabel: 'A line for the postcard',
    defaultNote: 'This verse made me think of you',
    sign: (name: string) => `— ${name}`,
    send: 'Send with KakaoTalk',
    uploading: 'Preparing your postcard…',
    ready: 'Ready · Open KakaoTalk',
    other: 'Share the photo file to another app',
    hint: 'Only this postcard image is uploaded to Kakao when you send. Your original photo stays on your device.',
    failed: "Couldn't upload the postcard. Please try again.",
    cardTitle: (name: string | null) => (name ? `A verse postcard from ${name}` : 'A verse postcard for you'),
    read: 'Read the verse',
    reply: 'Reply with a card',
    close: 'Close',
  },
}

const describeDate = (d: Date, language: 'ko' | 'en') =>
  d.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', weekday: 'long' })

/**
 * 카드를 '말씀 엽서'로 다시 구워 카카오톡 피드 카드로 보낸다.
 * 그림 주소가 있어야 해서 누른 뒤에 올린다 — 모바일은 올라가자마자 이어서 보내고,
 * PC 는 카톡 창이 팝업이라(누른 직후가 아니면 막힌다) 버튼이 '카카오톡 열기'로 바뀐 뒤 한 번 더 누른다.
 */
const KakaoPostcardSheet = ({
  card,
  refLabel,
  greeting,
  hasOwnMat,
  verseLink,
  remixLink,
  language,
  onShareFile,
  onSent,
  onFailed,
  onClose,
}: KakaoPostcardSheetProps) => {
  const t = TEXTS[language]
  useModalBackButton(onClose)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [note, setNote] = useState(() => (greeting?.trim() || t.defaultNote).slice(0, NOTE_MAX))
  const [name] = useState(() => sessionStore.get('fullName')?.trim() || null)
  const [date] = useState(() => new Date())
  const [uploading, setUploading] = useState(false)
  // 올려 둔 그림 — 한마디를 고치면 그 그림은 못 쓴다
  const [uploaded, setUploaded] = useState<{ note: string; url: string } | null>(null)
  const ready = uploaded?.note === note

  // SDK 는 시트가 열릴 때 받아 둔다 (그림은 아직 올리지 않는다)
  useEffect(() => {
    loadKakaoShare().catch(() => {})
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawKakaoPostcard(canvas, card, {
      refLabel,
      note,
      signature: name ? t.sign(name) : undefined,
      date,
      lang: language,
      hasOwnMat,
    })
  }, [card, refLabel, note, name, date, language, hasOwnMat, t])

  const send = async (imageUrl: string) => {
    const link = verseLink ?? remixLink
    const ok = await kakaoShareFeed({
      title: t.cardTitle(name),
      description: `${refLabel} · ${describeDate(date, language)}`,
      imageUrl,
      imageWidth: POSTCARD_SIZE,
      imageHeight: POSTCARD_SIZE,
      link,
      buttons: verseLink
        ? [
            { title: t.read, link: verseLink },
            { title: t.reply, link: remixLink },
          ]
        : [{ title: t.reply, link: remixLink }],
    })
    if (ok) onSent()
    else onFailed(t.failed)
  }

  const handleSend = async () => {
    if (uploading) return
    // 이미 올려 둔 그림이면 누른 그 자리에서 바로 보낸다 (PC 팝업이 막히지 않게 await 없이)
    if (ready && uploaded) {
      void send(uploaded.url)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    setUploading(true)
    const sentNote = note
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      const url = blob ? await kakaoUploadImage(new File([blob], 'verse-postcard.jpg', { type: 'image/jpeg' })) : null
      if (!url) {
        onFailed(t.failed)
        return
      }
      setUploaded({ note: sentNote, url })
      if (isMobile()) await send(url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="pv-sheet-overlay" onClick={onClose}>
      <div
        className="pv-sheet pv-kakao"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-sheet__handle" aria-hidden="true" />
        <div className="pv-sheet__header">
          <h2 className="pv-sheet__title">{t.title}</h2>
          <button type="button" className="pv-sheet__close" aria-label={t.close} onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="pv-kakao__body">
          <canvas ref={canvasRef} className="pv-kakao__preview" width={POSTCARD_SIZE} height={POSTCARD_SIZE} />
          <label className="pv-kakao__field">
            <span className="pv-kakao__label">
              {t.noteLabel}
              <em>
                {note.length}/{NOTE_MAX}
              </em>
            </span>
            <input
              id="pv-kakao-note"
              type="text"
              className="pv-kakao__input"
              value={note}
              maxLength={NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              enterKeyHint="done"
            />
          </label>
        </div>

        <div className="pv-sheet__footer pv-kakao__footer">
          <div className="pv-kakao__row">
            <button type="button" className="pv-kakao__send" onClick={handleSend} disabled={uploading}>
              <KakaoIcon size={20} />
              {uploading ? t.uploading : ready && !isMobile() ? t.ready : t.send}
            </button>
            {onShareFile && (
              <button type="button" className="pv-kakao__other" onClick={onShareFile} aria-label={t.other} title={t.other}>
                <span className="material-icons-round">ios_share</span>
              </button>
            )}
          </div>
          <p className="pv-kakao__hint">{t.hint}</p>
        </div>
      </div>
    </div>
  )
}

export default KakaoPostcardSheet
