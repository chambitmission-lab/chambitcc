import { useEffect, useRef } from 'react'
import { useWeeklyForecast } from '../../../hooks/useWeather'
import { useLanguage } from '../../../contexts/LanguageContext'
import { consumeShellShown, WeatherSheetLoading } from './WeatherSheetFallback'
import './WeatherForecastSheet.css'

const DAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/* 강수확률은 이 값 미만이면 숨긴다 — 5%, 12% 같은 숫자는 판단에 도움이 안 되고
 * 줄마다 숫자가 붙으면 온도 막대가 잘 안 보인다. */
const POP_ROW_THRESHOLD = 20

/* 기온 → 색. 파랑(추움) ~ 빨강(더움)을 hue로 잇는다.
 * 막대 양끝 색이 실제 기온을 뜻하므로 줄끼리 비교가 된다. */
const TEMP_MIN_SCALE = -5
const TEMP_MAX_SCALE = 38

const tempColor = (temp: number): string => {
  const ratio = Math.min(
    1,
    Math.max(0, (temp - TEMP_MIN_SCALE) / (TEMP_MAX_SCALE - TEMP_MIN_SCALE)),
  )
  /* 215°(블루) → 10°(레드) */
  const hue = 215 - ratio * 205
  return `hsl(${Math.round(hue)} 76% 56%)`
}

interface WeatherForecastSheetProps {
  onClose: () => void
  /* 실황 기온 — 오늘 줄 막대 위에 현재 위치를 점으로 찍는다 */
  currentTemperature?: number
}

const WeatherForecastSheet = ({
  onClose,
  currentTemperature,
}: WeatherForecastSheetProps) => {
  const { t, language } = useLanguage()
  const { data: days, isLoading, isError } = useWeeklyForecast()
  const dayLabels = language === 'en' ? DAY_LABELS_EN : DAY_LABELS_KO
  /* 로딩 껍데기를 거쳐 왔다면 시트는 이미 올라와 있던 자리를 그대로 물려받는다 —
   * 진입 애니메이션을 다시 재생하면 시트가 두 번 튀어 오른다.
   * useState 초기화 함수는 StrictMode에서 두 번 불려 표시를 두 번 소비하므로
   * ref로 이 인스턴스에서 딱 한 번만 읽는다. */
  const continuedRef = useRef<boolean | null>(null)
  if (continuedRef.current === null) continuedRef.current = consumeShellShown()
  const isContinued = continuedRef.current

  // 뒤로가기 대신 ESC로도 닫히게 — 데스크톱에서 시트를 닫을 방법이 필요하다
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  /* 막대 스케일은 주간 전체 최저~최고로 맞춘다 — 줄마다 기준이 달라지면
   * "이번 주에 오늘이 어느 정도인지"가 안 읽힌다. */
  const weekMin = days ? Math.min(...days.map((d) => d.tempMin)) : 0
  const weekMax = days ? Math.max(...days.map((d) => d.tempMax)) : 0
  const span = Math.max(1, weekMax - weekMin)
  const toPercent = (temp: number) => ((temp - weekMin) / span) * 100

  return (
    <div className="wf-overlay" data-continued={isContinued ? '' : undefined} onClick={onClose}>
      <div
        className="wf-sheet"
        role="dialog"
        aria-modal="true"
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
          {/* 청크 로딩 폴백과 같은 모양 — 시트가 뜬 뒤 예보를 받는 동안 이어진다 */}
          {isLoading && <WeatherSheetLoading />}

          {isError && <p className="wf-empty">{t('homeWeatherWeekError')}</p>}

          {days?.map((day, i) => {
            const isToday = i === 0
            const showPop =
              day.precipitationProbability !== null &&
              day.precipitationProbability >= POP_ROW_THRESHOLD
            const left = toPercent(day.tempMin)
            const width = Math.max(4, toPercent(day.tempMax) - left)
            /* 오늘 줄에만 실황 기온 점 — 주간 범위를 벗어나면 그리지 않는다 */
            const nowPercent =
              isToday && currentTemperature !== undefined
                ? Math.min(100, Math.max(0, toPercent(currentTemperature)))
                : null

            return (
              <div
                key={day.date}
                className="wf-row"
                data-today={isToday ? '' : undefined}
              >
                <span className="wf-day">
                  {isToday ? t('homeWeatherToday') : dayLabels[day.weekday]}
                </span>
                <span className="wf-emoji" aria-hidden>
                  {day.emoji}
                </span>
                <span className="wf-pop">
                  {showPop ? `${day.precipitationProbability}%` : ''}
                </span>
                <span className="wf-temp wf-temp-min">{day.tempMin}°</span>
                <span className="wf-bar">
                  <span
                    className="wf-bar-fill"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${tempColor(day.tempMin)}, ${tempColor(day.tempMax)})`,
                    }}
                  />
                  {nowPercent !== null && (
                    <span
                      className="wf-bar-now"
                      style={{ left: `${nowPercent}%` }}
                      title={t('homeWeatherNowAria').replace(
                        '{n}',
                        String(currentTemperature),
                      )}
                      aria-label={t('homeWeatherNowAria').replace(
                        '{n}',
                        String(currentTemperature),
                      )}
                    />
                  )}
                </span>
                <span className="wf-temp wf-temp-max">{day.tempMax}°</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeatherForecastSheet
