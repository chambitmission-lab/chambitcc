import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableText } from '../../../components/AboutEditor'
import { BusIcon, CarIcon, ChevronDownIcon, ParkingIcon, SubwayIcon } from '../icons'

type Panel = 'transit' | 'drive'

interface TransportInfoProps {
  isAdminUser: boolean
}

/**
 * 오시는 방법 — 대중교통 / 자가용·주차 두 개의 접이식.
 *
 * 예전엔 탭 4개였는데, 각 탭의 내용이 두세 줄이라 탭 자체가 내용보다 무거웠다.
 * 필요한 사람만 펼쳐 보는 접이식이 방문자에게도 관리자에게도 가볍다.
 */
const TransportInfo = ({ isAdminUser }: TransportInfoProps) => {
  const { t, language } = useLanguage()
  const { tx } = useAboutContent()
  const ko = language === 'ko'

  const [open, setOpen] = useState<Panel | null>('transit')
  const toggle = (panel: Panel) => setOpen((prev) => (prev === panel ? null : panel))

  const subwayExit = tx('visitSubwayExit').trim()
  const busBody = tx('visitBusBody').trim()
  const parkingBody = tx('visitParkingBody').trim()
  const parkingTip = tx('visitParkingTip').trim()

  const renderHead = (panel: Panel, Icon: typeof SubwayIcon, title: string, desc: string) => (
    <button
      type="button"
      className={`visit-fold-head${open === panel ? ' is-open' : ''}`}
      onClick={() => toggle(panel)}
      aria-expanded={open === panel}
      aria-controls={`visit-fold-${panel}`}
    >
      <span className="visit-fold-icon">
        <Icon size={18} />
      </span>
      <span className="visit-fold-text">
        <span className="visit-fold-title">{title}</span>
        <span className="visit-fold-desc">{desc}</span>
      </span>
      <span className="visit-fold-caret" aria-hidden="true">
        <ChevronDownIcon size={18} />
      </span>
    </button>
  )

  return (
    <section className="visit-folds">
      <div className="visit-fold">
        {renderHead('transit', SubwayIcon, t('visitTransitTitle'), t('visitTransitDesc'))}

        {open === 'transit' && (
          <div className="visit-fold-body" id="visit-fold-transit">
            <h3 className="visit-fold-sub">{t('visitSubwayTitle')}</h3>
            {(subwayExit || isAdminUser) && (
              <p className="visit-exit">
                <span className="visit-exit-badge">
                  <EditableText fieldKey="visitSubwayExit" isAdmin={isAdminUser}>
                    {subwayExit || (isAdminUser ? '—' : '')}
                  </EditableText>
                </span>
                <span>{t('visitExitLabel')}</span>
              </p>
            )}
            <p className="visit-body-text">
              <EditableText fieldKey="visitSubwayBody" multiline isAdmin={isAdminUser}>
                {tx('visitSubwayBody')}
              </EditableText>
            </p>

            {(busBody || isAdminUser) && (
              <>
                <h3 className="visit-fold-sub">
                  <BusIcon size={15} />
                  <span>{t('visitBusTitle')}</span>
                </h3>
                <p className="visit-body-text">
                  <EditableText fieldKey="visitBusBody" multiline isAdmin={isAdminUser}>
                    {busBody || (ko ? '버스 노선을 등록해주세요' : 'Add bus routes')}
                  </EditableText>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="visit-fold">
        {renderHead('drive', CarIcon, t('visitDriveTitle'), t('visitDriveDesc'))}

        {open === 'drive' && (
          <div className="visit-fold-body" id="visit-fold-drive">
            <h3 className="visit-fold-sub">{t('visitCarTitle')}</h3>
            <p className="visit-body-text">
              <EditableText fieldKey="visitCarBody" multiline isAdmin={isAdminUser}>
                {tx('visitCarBody')}
              </EditableText>
            </p>

            {(parkingBody || parkingTip || isAdminUser) && (
              <div className="visit-parking">
                <h4 className="visit-parking-title">
                  <ParkingIcon size={15} />
                  <span>{t('visitParkingTitle')}</span>
                </h4>
                {(parkingBody || isAdminUser) && (
                  <p className="visit-body-text">
                    <EditableText fieldKey="visitParkingBody" multiline isAdmin={isAdminUser}>
                      {parkingBody || (ko ? '주차 안내를 등록해주세요' : 'Add parking info')}
                    </EditableText>
                  </p>
                )}
                {(parkingTip || isAdminUser) && (
                  <p className="visit-parking-tip">
                    <EditableText fieldKey="visitParkingTip" multiline isAdmin={isAdminUser}>
                      {parkingTip || (ko ? '혼잡 시간대 팁을 등록해주세요' : 'Add a busy-hours tip')}
                    </EditableText>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default TransportInfo
