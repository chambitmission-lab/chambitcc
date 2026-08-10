import { useMemo, useState } from 'react'
import { renderSVG } from 'uqr'
import { useLanguage } from '../../../contexts/LanguageContext'
import { showToast } from '../../../utils/toast'
import { writeToClipboard } from '../../Bible/components/verseCopy'
import { CopyIcon, QrIcon, ShareIcon } from '../icons'

/**
 * 초대 — 성도가 친구에게 "여기로 오세요"를 그대로 넘길 수 있게.
 * HashRouter 라 링크는 반드시 `origin/#/visit` 형태여야 홈으로 튕기지 않는다.
 */
const InviteCard = () => {
  const { t } = useLanguage()
  const [showQr, setShowQr] = useState(false)

  const url = `${window.location.origin}${window.location.pathname}#/visit`
  const qrSvg = useMemo(
    () => (showQr ? renderSVG(url, { border: 2 }) : ''),
    [showQr, url],
  )

  const copy = () => {
    // iOS 사파리 대응 — 사용자 제스처와 같은 태스크에서 호출한다
    writeToClipboard(url).then((ok) => {
      showToast(ok ? t('visitInviteCopied') : t('visitCopyFailed'), ok ? 'success' : 'error')
    })
  }

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: t('visitTitle'), url }).catch(() => {})
      return
    }
    copy()
  }

  return (
    <section className="visit-invite">
      <h2 className="visit-invite-title">{t('visitInviteTitle')}</h2>
      <p className="visit-invite-desc">{t('visitInviteDesc')}</p>

      <div className="visit-invite-actions">
        <button type="button" className="visit-invite-btn is-primary" onClick={share}>
          <ShareIcon size={16} />
          <span>{t('visitInviteCopy')}</span>
        </button>
        <button
          type="button"
          className="visit-invite-btn"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
        >
          <QrIcon size={16} />
          <span>{t('visitInviteQr')}</span>
        </button>
        <button type="button" className="visit-invite-btn" onClick={copy} aria-label={t('visitInviteCopy')}>
          <CopyIcon size={16} />
        </button>
      </div>

      {showQr && (
        <div className="visit-invite-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
      )}
    </section>
  )
}

export default InviteCard
