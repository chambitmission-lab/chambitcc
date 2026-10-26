// 2단계 — 언제 열어볼까요?
// 날짜 사실("2027년 10월 26일")보다 시간의 무게("365밤 배달")를 먼저 읽히게 한다.
// 달력 한 장(월·일·요일)이 고른 날을 실물처럼 보여주고, 프리셋은 눌리는 타일.
import DatePicker from '../../../components/common/DatePicker'
import { KO_WEEKDAYS } from '../../../utils/dateUtils'
import { toDateStr, type OpenDatePreset } from '../capsuleDates'

const tomorrowStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

const StepWhen = ({
  presets,
  presetKey,
  onPresetChange,
  customDate,
  onCustomDateChange,
  openDate,
  nights,
}: {
  presets: OpenDatePreset[]
  presetKey: string
  onPresetChange: (key: string) => void
  customDate: string
  onCustomDateChange: (v: string) => void
  openDate: string
  nights: number | null
}) => {
  const d = openDate ? new Date(`${openDate}T00:00:00`) : null
  const preset = presets.find((p) => p.key === presetKey)
  // "1년 뒤 아침"·"새해 첫날 아침" — 이미 아침으로 끝나는 절기 라벨("성탄절 아침")은 그대로
  const headline = preset ? (/아침$/.test(preset.label) ? preset.label : `${preset.label} 아침`) : '고른 날 아침'

  return (
    <>
      <h2 className="cw-title">언제 열어볼까요?</h2>

      <div className="cw-date">
        <div className={`cw-cal ${d ? '' : 'is-empty'}`} aria-hidden>
          <span className="cw-cal__month">{d ? `${d.getMonth() + 1}월` : '　'}</span>
          <span className="cw-cal__day">{d ? d.getDate() : '?'}</span>
          <span className="cw-cal__year">
            {d ? `${d.getFullYear()} · ${KO_WEEKDAYS[d.getDay()]}` : '날짜'}
          </span>
        </div>
        <div className="min-w-0">
          {d ? (
            <>
              <p className="cw-date__head">{headline} 7시</p>
              <p className="cw-date__full">
                {d.getFullYear()}년 {d.getMonth() + 1}월 {d.getDate()}일 {KO_WEEKDAYS[d.getDay()]}요일
              </p>
              {nights !== null && <p className="cw-date__nights">☾ {nights.toLocaleString()}밤 배달</p>}
            </>
          ) : (
            <>
              <p className="cw-date__head">날짜를 골라 주세요</p>
              <p className="cw-date__full">그날 아침 7시에 열려요</p>
            </>
          )}
        </div>
      </div>

      <div className="cw-presets" role="radiogroup" aria-label="여는 날">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            role="radio"
            aria-checked={presetKey === p.key}
            onClick={() => onPresetChange(p.key)}
            className={`cw-chip ${presetKey === p.key ? 'is-on' : ''}`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={presetKey === 'custom'}
          onClick={() => onPresetChange('custom')}
          className={`cw-chip ${presetKey === 'custom' ? 'is-on' : ''}`}
        >
          직접 고르기
        </button>
      </div>

      {presetKey === 'custom' && (
        <div className="mt-3">
          <DatePicker
            value={customDate}
            onChange={onCustomDateChange}
            placeholder="여는 날을 골라 주세요"
            minDate={tomorrowStr()}
            large
          />
        </div>
      )}
    </>
  )
}

export default StepWhen
