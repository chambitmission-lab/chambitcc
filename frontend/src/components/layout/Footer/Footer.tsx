import { useLanguage } from '../../../contexts/LanguageContext'
import './Footer.css'

const Footer = () => {
  const { t } = useLanguage()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{t('churchName')}</h3>
            <p>{t('footerSlogan')}</p>
          </div>
          <div className="footer-section">
            <h4>{t('footerContactTitle')}</h4>
            <p>Tel: 032-323-1004</p>
          </div>
          <div className="footer-section">
            <h4>{t('footerAddressTitle')}</h4>
            <p>{t('footerAddressLine1')}</p>
            <p>{t('footerAddressLine2')}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('footerCopyright')}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
