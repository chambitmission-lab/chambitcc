import { useEffect } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
/* 시트 본체(WeatherForecastSheet)는 lazy 청크지만 이 스타일시트는 여기서
 * 정적으로 import한다 — 청크가 도착하기 전에도 폴백이 제 모양으로 보여야 한다. */
import './WeatherForecastSheet.css'

interface WeatherSheetFallbackProps {
  onClose: () => void
}

/* 폴백이 실제로 화면에 떴는지. 청크가 도착해 시트가 자리를 이어받을 때
 * 올라오는 애니메이션을 한 번 더 재생하지 않기 위한 표시다.
 * (닫힐 때 parent가 resetSheetShell()로 되돌린다) */
let shellShown = false

/* 시트가 마운트하며 한 번 읽고 지운다 — 폴백을 거쳐 왔으면 true */
export const consumeShellShown = (): boolean => {
  const was = shellShown
  shellShown = false
  return was
}

/* 폴백만 보고 닫은 경우(청크 도착 전 취소) 표시가 남지 않게 정리 */
export const resetSheetShell = (): void => {
  shellShown = false
}

/* 주간 예보 시트의 로딩 껍데기 — 청크를 받는 동안 즉시 뜬다.
 * 예전엔 Suspense fallback이 null이라 칩을 눌러도 잠깐 아무 반응이 없다가
 * 시트가 툭 나타났다. 헤더·스켈레톤을 미리 그려 눌린 것이 바로 보이게 한다.
 * 시트가 뜨기 전 취소할 수 있도록 딤 탭 닫기만 살려둔다. */
const WeatherSheetFallback = ({ onClose }: WeatherSheetFallbackProps) => {
  const { t } = useLanguage()

  useEffect(() => {
    shellShown = true
  }, [])

  return (
    <div className="wf-overlay" onClick={onClose}>
      <div
        className="wf-sheet"
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-label={t('homeWeatherWeekTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wf-handle" aria-hidden />
        <div className="wf-header">
          <div>
            <h2 className="wf-title">{t('homeWeatherWeekTitle')}</h2>
            <p className="wf-note">{t('homeWeatherWeekNote')}</p>
          </div>
          <button
            type="button"
            className="wf-close"
            aria-label={t('homeWeatherWeekClose')}
            onClick={onClose}
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="wf-body">
          <WeatherSheetLoading />
        </div>
      </div>
    </div>
  )
}

/* 로딩 표시 — 한 줄 안내 + 7일치 자리표시자.
 * 시트 본체의 데이터 로딩에서도 같은 모양을 쓴다. */
export const WeatherSheetLoading = () => {
  const { t } = useLanguage()

  return (
    <div className="wf-loading">
      <p className="wf-loading-note" role="status">
        <span className="wf-spinner" aria-hidden />
        {t('homeWeatherWeekLoading')}
      </p>
      <div className="wf-skeletons" aria-hidden>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="wf-skeleton" />
        ))}
      </div>
    </div>
  )
}

export default WeatherSheetFallback
