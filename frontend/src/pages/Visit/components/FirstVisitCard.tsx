import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableText } from '../../../components/AboutEditor'
import { ChevronRightIcon, SproutIcon } from '../icons'

interface FirstVisitCardProps {
  isAdminUser: boolean
}

/**
 * 처음 오시는 분께 — 교통 안내와 성격이 달라 탭 안에 섞지 않고 따로 세운다.
 * 길을 다 읽은 다음 만나는 마지막 안내이자, 새가족 등록으로 가는 문이다.
 */
const FirstVisitCard = ({ isAdminUser }: FirstVisitCardProps) => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { tx } = useAboutContent()

  return (
    <section className="visit-first">
      <div className="visit-first-head">
        <span className="visit-first-icon">
          <SproutIcon size={18} />
        </span>
        <h2 className="visit-first-title">{t('visitFirstTitle')}</h2>
      </div>

      <p className="visit-body-text">
        <EditableText fieldKey="visitFirstBody" multiline isAdmin={isAdminUser}>
          {tx('visitFirstBody')}
        </EditableText>
      </p>

      <button type="button" className="visit-first-cta" onClick={() => navigate('/register')}>
        <span>{t('visitFirstCta')}</span>
        <ChevronRightIcon size={16} />
      </button>
    </section>
  )
}

export default FirstVisitCard
