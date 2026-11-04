import type { PhotoVerseTexts } from '../texts'

interface PrintOverlayProps {
  t: PhotoVerseTexts
  /** 방금 저장한 첫 장의 objectURL */
  src: string
  developed: boolean
  caption?: string
  isLock: boolean
  onClose: () => void
}

/** 저장 인화 연출 — 방금 만든 카드가 폴라로이드처럼 서서히 현상된다 */
const PrintOverlay = ({ t, src, developed, caption, isLock, onClose }: PrintOverlayProps) => (
  <div className="pv-print-overlay" onClick={onClose}>
    <div className={`pv-print${developed ? ' pv-print--developed' : ''}`}>
      <div className="pv-print__img-wrap">
        <img src={src} alt="" className="pv-print__img" />
      </div>
      <p className="pv-print__caption">{caption}</p>
    </div>
    {isLock && <p className="pv-print__hint pv-print__hint--strong">{t.lockSavedHint}</p>}
    <p className="pv-print__hint">{t.printedHint}</p>
  </div>
)

export default PrintOverlay
