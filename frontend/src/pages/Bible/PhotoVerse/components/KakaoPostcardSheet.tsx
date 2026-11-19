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
    title: '카카오톡으로 보내기',
    noteLabel: '카드와 함께 보낼 한마디',
    defaultNote: '오늘 이 말씀이 생각났어요',
    send: '카카오톡으로 보내기',
    uploading: '카드를 준비하고 있어요…',
    ready: '준비됐어요 · 카카오톡 열기',
    other: '사진 파일로 다른 앱에 보내기',
    hint: '한마디는 카톡에서 카드 제목으로 보여요. 보내기를 누르면 이 그림만 카카오 서버에 올라가고, 원본 사진은 기기에 남아요.',
    failed: '카드를 올리지 못했어요. 잠시 뒤 다시 시도해 주세요.',
    cardTitle: (name: string | null) => (name ? `${name} 님이 말씀 카드를 보냈어요` : '말씀 카드가 도착했어요'),
    madeBy: (name: string | null, ref: string) => (name ? `${name} 님이 만든 말씀 카드 · ${ref}` : `말씀 카드 · ${ref}`),
    read: '말씀 읽기',
    reply: '나도 만들기',
    close: '닫기',
  },
  en: {
    title: 'Send with KakaoTalk',
    noteLabel: 'A line to send with the card',
    defaultNote: 'This verse made me think of you',
    send: 'Send with KakaoTalk',
    uploading: 'Preparing your card…',
    ready: 'Ready · Open KakaoTalk',
    other: 'Share the photo file to another app',
    hint: 'Your line shows as the card title in KakaoTalk. Only this image is uploaded to Kakao when you send; your original photo stays on your device.',
    failed: "Couldn't upload the card. Please try again.",
    cardTitle: (name: string | null) => (name ? `${name} sent you a verse card` : 'A verse card for you'),
    madeBy: (name: string | null, ref: string) => (name ? `A verse card by ${name} · ${ref}` : `Verse card · ${ref}`),
    read: 'Read the verse',
    reply: 'Make my own',
    close: 'Close',
  },
}

/**
 * 카드를 정사각 판에 그대로 올려(P1 '카드 그대로') 카카오톡 피드 카드로 보낸다. 한마디는 카드 제목이 된다.
 * 그림 주소가 있어야 해서 누른 뒤에 올린다 — 모바일은 올라가자마자 이어서 보내고,
 * PC 는 카톡 창이 팝업이라(누른 직후가 아니면 막힌다) 버튼이 '카카오톡 열기'로 바뀐 뒤 한 번 더 누른다.
 */
const KakaoPostcardSheet = ({
  card,
  refLabel,
  greeting,
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
  // 올려 둔 그림 주소 — 한마디는 그림에 들어가지 않으니 한 번 올리면 계속 쓴다
  const [uploaded, setUploaded] = useState<string | null>(null)
  const ready = uploaded !== null

  // SDK 는 시트가 열릴 때 받아 둔다 (그림은 아직 올리지 않는다)
  useEffect(() => {
    loadKakaoShare().catch(() => {})
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawKakaoPostcard(canvas, card, { sender: name ?? undefined, date, lang: language })
  }, [card, name, date, language])

  const send = async (imageUrl: string) => {
    const link = verseLink ?? remixLink
    const ok = await kakaoShareFeed({
      title: note.trim() || t.cardTitle(name),
      description: t.madeBy(name, refLabel),
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
    if (uploaded) {
      void send(uploaded)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    setUploading(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      const url = blob ? await kakaoUploadImage(new File([blob], 'verse-card.jpg', { type: 'image/jpeg' })) : null
      if (!url) {
        onFailed(t.failed)
        return
      }
      setUploaded(url)
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
