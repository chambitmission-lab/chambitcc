import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import {
  BACKGROUNDS,
  DEFAULT_CARD_STYLE,
  backgroundCss,
  createBackgroundImage,
  createCardCanvas,
  drawVerseCard,
  ensureCardFonts,
} from '../PhotoVerse/photoVerseCanvas'
import type { VerseBackground, VerseCardStyle } from '../PhotoVerse/photoVerseCanvas'
import {
  TRANSLATION_LABEL,
  buildBody,
  buildCopyText,
  buildFullText,
  buildReference,
  buildVerseLink,
  loadCopyPrefs,
  saveCopyPrefs,
  writeToClipboard,
  type CopyPrefs,
  type VerseCopyTarget,
} from './verseCopy'
import './VerseShareSheet.css'

/**
 * 구절 공유 시트 — 보내기 전에 "이렇게 보내집니다"를 눈으로 확인시킨다.
 *
 * 여러 절 공유가 이상해 보이는 진짜 이유는 채팅 말풍선에 긴 글을 그대로
 * 밀어넣기 때문이다. 그래서 세 갈래를 준다:
 *  - 텍스트: 문단형으로 정리한 결과를 말풍선 모양 그대로 미리보기
 *  - 이미지: 말씀 카드로 구워서 보낸다 (절이 많아도 카드 안에서는 안 이상하다)
 *  - 링크만: 대화 흐름을 안 끊고 싶을 때
 */

type ShareTab = 'text' | 'image' | 'link'

const PREVIEW_MAX_SIDE = 720
const EXPORT_MAX_SIDE = 1600

/** 이미지 카드는 말풍선보다 훨씬 많이 담을 수 있어 접기 기준을 크게 잡는다 */
const CARD_FOLD_OVER = 14

/**
 * 글자 수에 맞춰 카드 글자 크기를 자동으로 줄인다.
 * 한 절짜리는 크게, 여러 절은 작게 — 사용자가 슬라이더를 만질 필요가 없게 한다.
 */
const autoFontScale = (len: number): number => {
  if (len > 520) return 0.03
  if (len > 360) return 0.034
  if (len > 240) return 0.039
  if (len > 140) return 0.045
  if (len > 70) return 0.05
  return 0.056
}

interface VerseShareSheetProps {
  target: VerseCopyTarget
  onClose: () => void
}

const VerseShareSheet = ({ target, onClose }: VerseShareSheetProps) => {
  const [tab, setTab] = useState<ShareTab>('text')
  const [prefs, setPrefs] = useState<CopyPrefs>(loadCopyPrefs)
  const [bgId, setBgId] = useState<string>(BACKGROUNDS[0].id)
  const [cardImg, setCardImg] = useState<HTMLImageElement | null>(null)
  const [busy, setBusy] = useState(false)
  // 폰트 로드 세대 — 구절 글자의 서브셋 조각이 로드될 때마다 올라가 다시 그리게 한다
  const [fontsReady, setFontsReady] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 배경 그라데이션 생성은 1080x1350 픽셀 루프라 한 번 만든 건 재사용한다
  const bgCacheRef = useRef(new Map<string, HTMLImageElement>())

  useModalBackButton(onClose)

  const reference = useMemo(() => buildReference(target), [target])
  const built = useMemo(() => buildCopyText(target, prefs), [target, prefs])
  const fullText = useMemo(() => buildFullText(built), [built])
  const link = useMemo(() => buildVerseLink(target), [target])

  const updatePrefs = (patch: Partial<CopyPrefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      saveCopyPrefs(next)
      return next
    })

  // ── 이미지 카드 ──────────────────────────────────────────
  const cardText = useMemo(
    () =>
      buildBody(target, {
        numbering: prefs.numbering,
        layout: 'paragraph',
        foldOver: CARD_FOLD_OVER,
      }).body,
    [target, prefs.numbering],
  )

  const cardStyle: VerseCardStyle = useMemo(() => {
    const bg = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0]
    return {
      ...DEFAULT_CARD_STYLE,
      color: bg.textColor,
      fontScale: autoFontScale(cardText.length),
      pos: { x: 0.5, y: 0.5 },
      showRef: true,
    }
  }, [bgId, cardText])

  const cardRefLabel = `${reference} · ${TRANSLATION_LABEL}`

  // 한글 웹폰트는 서브셋 조각으로 나뉘어 있어 canvas가 폴백으로 그리지 않도록
  // 구절 텍스트를 넘겨 해당 글자의 조각까지 받아온 뒤 다시 그린다
  useEffect(() => {
    let cancelled = false
    ensureCardFonts(`${cardText} ${cardRefLabel}`).then(() => {
      if (!cancelled) setFontsReady((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [cardText, cardRefLabel])

  // 탭을 이미지로 옮기거나 배경을 바꾸면 그때 배경 이미지를 만든다 (텍스트만 쓸 사람에겐 낭비)
  useEffect(() => {
    if (tab !== 'image') return
    let cancelled = false
    const cached = bgCacheRef.current.get(bgId)
    if (cached) {
      setCardImg(cached)
      return
    }
    const bg = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0]
    setCardImg(null)
    createBackgroundImage(bg)
      .then((img) => {
        if (cancelled) return
        bgCacheRef.current.set(bg.id, img)
        setCardImg(img)
      })
      .catch(() => {
        if (!cancelled) showToast('카드를 만들지 못했어요', 'error')
      })
    return () => {
      cancelled = true
    }
  }, [tab, bgId])

  // 미리보기 다시 그리기 — 캔버스 크기도 배경/텍스트가 바뀔 때 맞춘다
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !cardImg) return
    const sized = createCardCanvas(cardImg, PREVIEW_MAX_SIDE, cardStyle.frame)
    if (canvas.width !== sized.width || canvas.height !== sized.height) {
      canvas.width = sized.width
      canvas.height = sized.height
    }
    drawVerseCard(canvas, cardImg, cardText, cardRefLabel, cardStyle)
  }, [cardImg, cardText, cardRefLabel, cardStyle, fontsReady])

  const buildCardFile = useCallback(async () => {
    if (!cardImg) return null
    await ensureCardFonts(`${cardText} ${cardRefLabel}`)
    const canvas = createCardCanvas(cardImg, EXPORT_MAX_SIDE, cardStyle.frame)
    drawVerseCard(canvas, cardImg, cardText, cardRefLabel, cardStyle)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
    if (!blob) return null
    return new File([blob], `말씀_${reference.replace(/[\s:,]/g, '_')}.jpg`, {
      type: 'image/jpeg',
    })
  }, [cardImg, cardText, cardRefLabel, cardStyle, reference])

  // 파일 공유를 지원하는 환경에서만 이미지 '공유'를 쓴다 (아니면 저장으로)
  const [canShareFile] = useState(() => {
    try {
      return !!navigator.canShare?.({
        files: [new File([], 'card.jpg', { type: 'image/jpeg' })],
      })
    } catch {
      return false
    }
  })

  // ── 액션 ────────────────────────────────────────────────
  const copyPayload = tab === 'link' ? link : fullText

  const handleCopy = async () => {
    if (tab === 'image') {
      setBusy(true)
      try {
        const file = await buildCardFile()
        if (!file) throw new Error('export failed')
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        showToast('이미지를 저장했어요', 'success')
      } catch {
        showToast('이미지 저장에 실패했어요', 'error')
      } finally {
        setBusy(false)
      }
      return
    }
    const ok = await writeToClipboard(copyPayload)
    showToast(ok ? `${reference} 복사했어요` : '복사에 실패했어요', ok ? 'success' : 'error')
    if (ok) onClose()
  }

  const handleShare = async () => {
    if (tab === 'image') {
      setBusy(true)
      try {
        const file = await buildCardFile()
        if (!file) throw new Error('export failed')
        await navigator.share({ files: [file] })
        onClose()
      } catch (err) {
        // 공유 시트를 사용자가 닫은 경우는 실패가 아니다
        if ((err as DOMException)?.name !== 'AbortError') showToast('공유에 실패했어요', 'error')
      } finally {
        setBusy(false)
      }
      return
    }

    if (!navigator.share) {
      await handleCopy()
      return
    }
    try {
      if (tab === 'link') {
        await navigator.share({ url: link })
      } else {
        await navigator.share(built.url ? { text: built.text, url: built.url } : { text: built.text })
      }
      onClose()
    } catch {
      /* 사용자가 공유 시트를 닫음 */
    }
  }

  const verseCount = target.verses.length
  const showImageShare = tab === 'image' && canShareFile

  return (
    <div className="vss-overlay" role="dialog" aria-modal="true" aria-label="구절 공유" onClick={onClose}>
      <div className="vss-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="vss-handle" aria-hidden />

        <header className="vss-header">
          <div className="vss-header__text">
            <h2 className="vss-title">말씀 나누기</h2>
            <p className="vss-sub">
              {reference}
              {verseCount > 1 && <span className="vss-count">{verseCount}절</span>}
            </p>
          </div>
          <button type="button" className="vss-close" onClick={onClose} aria-label="닫기">
            <span className="material-icons-round">close</span>
          </button>
        </header>

        <div className="vss-tabs" role="tablist">
          {([
            { key: 'text', label: '텍스트', icon: 'notes' },
            { key: 'image', label: '이미지', icon: 'image' },
            { key: 'link', label: '링크만', icon: 'link' },
          ] as { key: ShareTab; label: string; icon: string }[]).map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={`vss-tab${tab === item.key ? ' is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              <span className="material-icons-round">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="vss-body">
          {tab === 'text' && (
            <>
              <div className="vss-preview" aria-label="보내질 내용 미리보기">
                <div className="vss-bubble">
                  <p className="vss-bubble__text">{built.text}</p>
                  {built.url && <p className="vss-bubble__link">{built.url}</p>}
                </div>
              </div>

              <div className="vss-options">
                <button
                  type="button"
                  className={`vss-chip${prefs.layout === 'paragraph' ? ' is-on' : ''}`}
                  onClick={() =>
                    updatePrefs({ layout: prefs.layout === 'paragraph' ? 'lines' : 'paragraph' })
                  }
                >
                  <span className="material-icons-round">
                    {prefs.layout === 'paragraph' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  문단으로 흘리기
                </button>
                <button
                  type="button"
                  className={`vss-chip${prefs.numbering === 'superscript' ? ' is-on' : ''}`}
                  onClick={() =>
                    updatePrefs({
                      numbering: prefs.numbering === 'superscript' ? 'none' : 'superscript',
                    })
                  }
                >
                  <span className="material-icons-round">
                    {prefs.numbering === 'superscript' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  절 번호 표시
                </button>
                <button
                  type="button"
                  className={`vss-chip${prefs.quote ? ' is-on' : ''}`}
                  onClick={() => updatePrefs({ quote: !prefs.quote })}
                >
                  <span className="material-icons-round">
                    {prefs.quote ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  인용부호
                </button>
                <button
                  type="button"
                  className={`vss-chip${prefs.withLink ? ' is-on' : ''}`}
                  onClick={() => updatePrefs({ withLink: !prefs.withLink })}
                >
                  <span className="material-icons-round">
                    {prefs.withLink ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  링크 포함
                </button>
              </div>

              {built.folded && (
                <p className="vss-note">
                  <span className="material-icons-round">info</span>
                  {/* 아이콘과 본문만 flex 아이템이 되도록 텍스트는 한 span으로 묶는다
                      (묶지 않으면 <b> 앞뒤 텍스트 노드가 각각 아이템이 돼 줄이 쪼개진다) */}
                  <span>
                    {built.total}절은 채팅에서 접혀 보여요. 앞 부분만 담고 나머지는 링크로
                    넘겼습니다 — 전체를 그대로 보내려면 <b>이미지</b> 탭을 써보세요.
                  </span>
                </p>
              )}
            </>
          )}

          {tab === 'image' && (
            <>
              <div className="vss-card-wrap">
                {cardImg ? (
                  <canvas ref={canvasRef} className="vss-card" />
                ) : (
                  <div className="vss-card-loading">카드를 만드는 중…</div>
                )}
              </div>

              <div className="vss-bg-row">
                {BACKGROUNDS.map((bg: VerseBackground) => (
                  <button
                    key={bg.id}
                    type="button"
                    className={`vss-bg${bgId === bg.id ? ' is-active' : ''}`}
                    onClick={() => setBgId(bg.id)}
                    aria-label={bg.nameKo}
                    title={bg.nameKo}
                  >
                    <span className="vss-bg__swatch" style={{ background: backgroundCss(bg) }} />
                    <span className="vss-bg__name">{bg.nameKo}</span>
                  </button>
                ))}
              </div>

              <p className="vss-note">
                <span className="material-icons-round">auto_awesome</span>
                <span>
                  절이 많아도 카드 안에서는 읽기 좋게 담깁니다. 사진 위에 올리고 싶다면 말씀 사진
                  카드에서 더 꾸밀 수 있어요.
                </span>
              </p>
            </>
          )}

          {tab === 'link' && (
            <>
              <div className="vss-preview">
                <div className="vss-linkbox">
                  <span className="material-icons-round">link</span>
                  <span className="vss-linkbox__url">{link}</span>
                </div>
              </div>
              <p className="vss-note">
                <span className="material-icons-round">info</span>
                <span>받은 사람이 누르면 {reference}로 바로 열립니다.</span>
              </p>
            </>
          )}
        </div>

        <footer className="vss-actions">
          <button type="button" className="vss-btn vss-btn--ghost" onClick={handleCopy} disabled={busy}>
            <span className="material-icons-round">
              {tab === 'image' ? 'download' : 'content_copy'}
            </span>
            {tab === 'image' ? '저장' : '복사'}
          </button>
          {(tab !== 'image' || showImageShare) && (
            <button type="button" className="vss-btn vss-btn--primary" onClick={handleShare} disabled={busy}>
              <span className="material-icons-round">share</span>
              {busy ? '만드는 중…' : '공유하기'}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

export default VerseShareSheet
