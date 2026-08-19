import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableImage, EditableText } from '../../../components/AboutEditor'
import type { AboutFieldKey } from '../../../types/aboutContent'
import { CameraIcon, WalkIcon } from '../icons'

/** 5단계 고정 — 사진 키와 문구 키가 짝을 이룬다 */
const STEPS: { photo: AboutFieldKey; text: AboutFieldKey }[] = [
  { photo: 'visitStep1Photo', text: 'visitStep1Text' },
  { photo: 'visitStep2Photo', text: 'visitStep2Text' },
  { photo: 'visitStep3Photo', text: 'visitStep3Text' },
  { photo: 'visitStep4Photo', text: 'visitStep4Text' },
  { photo: 'visitStep5Photo', text: 'visitStep5Text' },
]

interface LastMileProps {
  isAdminUser: boolean
}

/**
 * "마지막 100m" — 지도가 답해주지 않는 구간을 실제 사진으로 안내한다.
 *
 * 사진이 아직 없어도 문구만으로 걷는 순서를 알려주도록 만들었다.
 * (빈 칸은 방문자에겐 번호 타일, 관리자에겐 업로드 버튼으로 보인다)
 */
const LastMile = ({ isAdminUser }: LastMileProps) => {
  const { t } = useLanguage()
  const { tx } = useAboutContent()

  const steps = STEPS.map((step, i) => ({
    ...step,
    index: i + 1,
    photoUrl: tx(step.photo).trim(),
    label: tx(step.text).trim(),
  })).filter((step) => isAdminUser || step.label.length > 0)

  if (steps.length === 0) return null

  return (
    <section className="visit-section">
      <header className="visit-section-head">
        <span className="visit-section-icon">
          <WalkIcon size={17} />
        </span>
        <div>
          <h2 className="visit-section-title">{t('visitLastMileTitle')}</h2>
          <p className="visit-section-desc">
            {t('visitLastMileDesc')}{' '}
            {/* 가로 스크롤 안내는 모바일에서만 — PC 는 격자라 넘길 것이 없다 */}
            <span className="visit-swipe-hint">{t('visitLastMileSwipe')}</span>
          </p>
        </div>
      </header>

      <div className="visit-steps" role="list">
        {steps.map((step) => (
          <article className="visit-step" role="listitem" key={step.photo}>
            <div className="visit-step-photo">
              <EditableImage
                fieldKey={step.photo}
                currentUrl={step.photoUrl}
                isAdmin={isAdminUser}
                title={`${t('visitStepLabel')} ${step.index}`}
              >
                {step.photoUrl ? (
                  <img src={step.photoUrl} alt={step.label} loading="lazy" />
                ) : (
                  <span className="visit-step-empty" aria-hidden="true">
                    {isAdminUser ? <CameraIcon size={22} /> : <WalkIcon size={22} />}
                  </span>
                )}
              </EditableImage>
              <span className="visit-step-num">{step.index}</span>
            </div>
            <p className="visit-step-text">
              <EditableText fieldKey={step.text} isAdmin={isAdminUser}>
                {step.label}
              </EditableText>
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default LastMile
