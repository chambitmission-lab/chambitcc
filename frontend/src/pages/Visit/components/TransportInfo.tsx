import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableText } from '../../../components/AboutEditor'
import { BusIcon, CarIcon, ParkingIcon, SproutIcon, SubwayIcon } from '../icons'
import FirstVisitCard from './FirstVisitCard'

type Tab = 'transit' | 'drive' | 'first'

interface TransportInfoProps {
  isAdminUser: boolean
}

/**
 * 오시는 방법 — 상단 전환 탭(대중교통 / 자가용·주차 / 처음 오시는 분) + 탭마다 벤토 타일.
 *
 * 접이식 두 개가 세로로 늘어서던 것을, 한 번에 한 주제만 보는 탭으로 바꿨다.
 * 탭 마커는 /news 세그먼트와 같은 인장(seal-marker) 문법. 탭 안은 정보 단위별
 * 타일(지하철·버스 / 내비·주차 대수·꿀팁·공영주차장)이라 필요한 칸만 눈에 걸린다.
 * 값이 빈 타일은 방문자에게 숨기고 관리자에게만 등록 자리로 보인다.
 */
const TransportInfo = ({ isAdminUser }: TransportInfoProps) => {
  const { t, language } = useLanguage()
  const { tx } = useAboutContent()
  const ko = language === 'ko'

  const [tab, setTab] = useState<Tab>('transit')

  const subwayExit = tx('visitSubwayExit').trim()
  const busBody = tx('visitBusBody').trim()
  const parkingBody = tx('visitParkingBody').trim()
  const parkingTip = tx('visitParkingTip').trim()
  const parkingCapacity = tx('visitParkingCapacity').trim()
  const parkingNearby = tx('visitParkingNearby').trim()

  const TABS: { key: Tab; Icon: typeof SubwayIcon; label: string }[] = [
    { key: 'transit', Icon: SubwayIcon, label: t('visitTransitTitle') },
    { key: 'drive', Icon: CarIcon, label: t('visitDriveTitle') },
    { key: 'first', Icon: SproutIcon, label: t('visitFirstTabLabel') },
  ]
  const index = TABS.findIndex((x) => x.key === tab)

  return (
    <section className="visit-guide">
      {/* 탭 — 트랙 위를 미끄러지는 인장 마커 */}
      <div className="visit-tabs" role="tablist" aria-label={t('visitTransitTitle')}>
        <span
          aria-hidden="true"
          className="visit-tabs-marker seal-marker [--seal-radius:0.75rem]"
          style={{
            width: `calc((100% - 0.5rem) / ${TABS.length})`,
            transform: `translateX(${Math.max(index, 0) * 100}%)`,
          }}
        />
        {TABS.map(({ key, Icon, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`visit-tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`visit-panel-${key}`}
            className={`visit-tab${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 대중교통 — 지하철(큰 타일) + 버스 */}
      {tab === 'transit' && (
        <div className="visit-bento" id="visit-panel-transit" role="tabpanel" aria-labelledby="visit-tab-transit">
          <article className="visit-tile visit-tile--wide">
            <h3 className="visit-tile-title">
              <span className="visit-tile-icon"><SubwayIcon size={16} /></span>
              <span>{t('visitSubwayTitle')}</span>
            </h3>
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
          </article>

          {(busBody || isAdminUser) && (
            <article className="visit-tile visit-tile--wide">
              <h3 className="visit-tile-title">
                <span className="visit-tile-icon"><BusIcon size={16} /></span>
                <span>{t('visitBusTitle')}</span>
              </h3>
              <p className="visit-body-text">
                <EditableText fieldKey="visitBusBody" multiline isAdmin={isAdminUser}>
                  {busBody || (ko ? '버스 노선을 등록해주세요' : 'Add bus routes')}
                </EditableText>
              </p>
            </article>
          )}
        </div>
      )}

      {/* 자가용·주차 — 내비(넓게) / 주차 대수(숫자 타일) / 주차 안내 / 꿀팁 / 공영주차장 */}
      {tab === 'drive' && (
        <div className="visit-bento" id="visit-panel-drive" role="tabpanel" aria-labelledby="visit-tab-drive">
          <article className="visit-tile visit-tile--wide">
            <h3 className="visit-tile-title">
              <span className="visit-tile-icon"><CarIcon size={16} /></span>
              <span>{t('visitCarTitle')}</span>
            </h3>
            <p className="visit-body-text">
              <EditableText fieldKey="visitCarBody" multiline isAdmin={isAdminUser}>
                {tx('visitCarBody')}
              </EditableText>
            </p>
          </article>

          {(parkingCapacity || isAdminUser) && (
            <article className="visit-tile visit-tile--stat">
              <span className="visit-tile-label">
                <ParkingIcon size={14} />
                <span>{t('visitParkingCapacityLabel')}</span>
              </span>
              <span className={`visit-stat${parkingCapacity ? '' : ' is-empty'}`}>
                <EditableText fieldKey="visitParkingCapacity" isAdmin={isAdminUser}>
                  {parkingCapacity || (ko ? '대수 입력' : 'Add count')}
                </EditableText>
                {parkingCapacity && <span className="visit-stat-unit">{t('visitParkingCapacityUnit')}</span>}
              </span>
            </article>
          )}

          {(parkingBody || isAdminUser) && (
            <article className={`visit-tile${parkingCapacity || isAdminUser ? '' : ' visit-tile--wide'}`}>
              <h3 className="visit-tile-title">
                <span className="visit-tile-icon"><ParkingIcon size={16} /></span>
                <span>{t('visitParkingTitle')}</span>
              </h3>
              <p className="visit-body-text">
                <EditableText fieldKey="visitParkingBody" multiline isAdmin={isAdminUser}>
                  {parkingBody || (ko ? '주차 안내를 등록해주세요' : 'Add parking info')}
                </EditableText>
              </p>
            </article>
          )}

          {(parkingTip || isAdminUser) && (
            <article className="visit-tile visit-tile--tip">
              <span className="visit-tile-label">{t('visitParkingTipLabel')}</span>
              <p className="visit-body-text">
                <EditableText fieldKey="visitParkingTip" multiline isAdmin={isAdminUser}>
                  {parkingTip || (ko ? '혼잡 시간대·무료 주차 팁을 등록해주세요' : 'Add a free-parking tip')}
                </EditableText>
              </p>
            </article>
          )}

          {(parkingNearby || isAdminUser) && (
            <article className="visit-tile">
              <span className="visit-tile-label">{t('visitParkingNearbyLabel')}</span>
              <p className="visit-body-text">
                <EditableText fieldKey="visitParkingNearby" multiline isAdmin={isAdminUser}>
                  {parkingNearby || (ko ? '주변 공영주차장 이름·거리·요금을 등록해주세요' : 'Add nearby public parking')}
                </EditableText>
              </p>
            </article>
          )}
        </div>
      )}

      {/* 처음 오시는 분 — 새가족 등록으로 가는 문 */}
      {tab === 'first' && (
        <div className="visit-bento" id="visit-panel-first" role="tabpanel" aria-labelledby="visit-tab-first">
          <FirstVisitCard isAdminUser={isAdminUser} />
        </div>
      )}
    </section>
  )
}

export default TransportInfo
