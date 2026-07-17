import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useVerseAlarms,
  useCreateVerseAlarm,
  useUpdateVerseAlarm,
  useDeleteVerseAlarm,
} from '../../../hooks/useVerseAlarms'
import { usePushNotification } from '../../../hooks/usePushNotification'
import { isAuthenticated } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import type { VerseAlarm } from '../../../api/verseAlarm'
import './VerseAlarmPage.css'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

type AmPm = 'am' | 'pm'

interface EditorState {
  id: number | null
  ampm: AmPm
  hour12: number
  minute: number
  days: boolean[]
  label: string
}

const DEFAULT_EDITOR: EditorState = {
  id: null,
  ampm: 'am',
  hour12: 7,
  minute: 0,
  days: [true, true, true, true, true, true, true],
  label: '',
}

const toHHMM = (ampm: AmPm, hour12: number, minute: number): string => {
  let h = hour12 % 12
  if (ampm === 'pm') h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const fromHHMM = (hhmm: string): Pick<EditorState, 'ampm' | 'hour12' | 'minute'> => {
  const [h, m] = hhmm.split(':').map(Number)
  return {
    ampm: h < 12 ? 'am' : 'pm',
    hour12: h % 12 === 0 ? 12 : h % 12,
    minute: m,
  }
}

const formatTime = (hhmm: string): { period: string; time: string } => {
  const { ampm, hour12, minute } = fromHHMM(hhmm)
  return {
    period: ampm === 'am' ? '오전' : '오후',
    time: `${hour12}:${String(minute).padStart(2, '0')}`,
  }
}

const formatDays = (days: string): string => {
  if (days === '1111111') return '매일'
  if (days === '1111100') return '평일'
  if (days === '0000011') return '주말'
  return DAY_LABELS.filter((_, i) => days[i] === '1').join(' ')
}

/* iOS Safari(미설치)에서는 웹 푸시 API 자체가 없다 — 홈 화면 추가 안내가 필요 */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true
const pushSupported =
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const VerseAlarmPage = () => {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  const { data: alarms = [], isLoading } = useVerseAlarms()
  const createAlarm = useCreateVerseAlarm()
  const updateAlarm = useUpdateVerseAlarm()
  const deleteAlarm = useDeleteVerseAlarm()
  const { isSubscribed, permission, isLoading: pushLoading, subscribe } =
    usePushNotification()

  const [editor, setEditor] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)

  const sortedAlarms = useMemo(
    () => [...alarms].sort((a, b) => a.time_hhmm.localeCompare(b.time_hhmm)),
    [alarms]
  )

  const openCreate = () => {
    if (alarms.length >= 5) {
      showToast('알람은 최대 5개까지 등록할 수 있어요', 'info')
      return
    }
    setEditor({ ...DEFAULT_EDITOR, days: [...DEFAULT_EDITOR.days] })
  }

  const openEdit = (alarm: VerseAlarm) => {
    setEditor({
      id: alarm.id,
      ...fromHHMM(alarm.time_hhmm),
      days: DAY_LABELS.map((_, i) => alarm.days_of_week[i] === '1'),
      label: alarm.label ?? '',
    })
  }

  const handleSave = async () => {
    if (!editor) return
    if (!editor.days.some(Boolean)) {
      showToast('최소 하나의 요일을 선택해주세요', 'error')
      return
    }
    const payload = {
      time_hhmm: toHHMM(editor.ampm, editor.hour12, editor.minute),
      days_of_week: editor.days.map((d) => (d ? '1' : '0')).join(''),
      label: editor.label.trim() || null,
    }
    setSaving(true)
    try {
      if (editor.id === null) {
        await createAlarm.mutateAsync(payload)
        showToast('알람이 등록되었어요', 'success')
      } else {
        await updateAlarm.mutateAsync({ alarmId: editor.id, payload })
        showToast('알람이 수정되었어요', 'success')
      }
      setEditor(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했어요', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (alarm: VerseAlarm) => {
    try {
      await updateAlarm.mutateAsync({
        alarmId: alarm.id,
        payload: { is_active: !alarm.is_active },
      })
    } catch {
      showToast('변경에 실패했어요', 'error')
    }
  }

  const handleDelete = async (alarmId: number) => {
    if (!window.confirm('이 알람을 삭제할까요?')) return
    try {
      await deleteAlarm.mutateAsync(alarmId)
      setEditor(null)
      showToast('알람이 삭제되었어요', 'success')
    } catch {
      showToast('삭제에 실패했어요', 'error')
    }
  }

  const handleEnablePush = async () => {
    const ok = await subscribe()
    if (ok) {
      showToast('이 기기에서 알림을 받을 수 있어요', 'success')
    } else {
      showToast('알림 설정에 실패했어요. 브라우저 알림 권한을 확인해주세요.', 'error')
    }
  }

  /* ── 푸시 수신 가능 상태 배너 ── */
  const renderPushBanner = () => {
    if (!pushSupported) {
      if (isIOS && !isStandalone) {
        return (
          <div className="va-banner va-banner--guide">
            <div className="va-banner-title">
              <span className="material-icons-round" aria-hidden>ios_share</span>
              홈 화면에 추가하면 알림을 받을 수 있어요
            </div>
            <ol className="va-guide-steps">
              <li>Safari 하단의 <strong>공유</strong> 버튼을 눌러주세요</li>
              <li><strong>홈 화면에 추가</strong>를 선택해주세요</li>
              <li>홈 화면의 참빛교회 앱을 열고 알림을 켜주세요</li>
            </ol>
            <p className="va-guide-note">
              카카오톡 등 앱 안에서 열었다면, 먼저 Safari로 열어주세요.
            </p>
          </div>
        )
      }
      return (
        <div className="va-banner va-banner--warn">
          <span className="material-icons-round" aria-hidden>notifications_off</span>
          이 브라우저는 푸시 알림을 지원하지 않아요.
        </div>
      )
    }
    if (permission === 'denied') {
      return (
        <div className="va-banner va-banner--warn">
          <span className="material-icons-round" aria-hidden>notifications_off</span>
          알림 권한이 차단되어 있어요. 브라우저 설정에서 참빛교회 알림을 허용해주세요.
        </div>
      )
    }
    if (!isSubscribed) {
      return (
        <div className="va-banner va-banner--action">
          <div className="va-banner-text">
            <strong>이 기기의 알림이 꺼져 있어요</strong>
            <span>알림을 켜야 설정한 시간에 말씀이 도착해요</span>
          </div>
          <button
            type="button"
            className="va-enable-btn"
            onClick={handleEnablePush}
            disabled={pushLoading}
          >
            {pushLoading ? '설정 중…' : '알림 켜기'}
          </button>
        </div>
      )
    }
    return (
      <div className="va-banner va-banner--ok">
        <span className="material-icons-round" aria-hidden>notifications_active</span>
        이 기기에서 알림을 받는 중이에요
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="verse-alarm-page">
        <header className="va-header">
          <button type="button" className="va-back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h1>구절 알람</h1>
        </header>
        <div className="va-empty">
          <span className="va-empty-emoji" aria-hidden>🔔</span>
          <p>로그인하면 원하는 시간에<br />오늘의 말씀 알림을 받을 수 있어요</p>
          <button type="button" className="va-primary-btn" onClick={() => navigate('/login')}>
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="verse-alarm-page">
      <header className="va-header">
        <button type="button" className="va-back" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1>구절 알람</h1>
        <button
          type="button"
          className="va-header-link"
          onClick={() => navigate('/bible/meditation')}
        >
          오늘의 묵상
          <span className="material-icons-round" aria-hidden>chevron_right</span>
        </button>
      </header>

      <p className="va-intro">
        설정한 시간에 오늘의 말씀 한 절이 알림으로 도착해요.
        알림을 열면 1~2분 묵상으로 이어집니다.
      </p>

      {renderPushBanner()}

      <section className="va-list" aria-label="알람 목록">
        {isLoading ? (
          <div className="va-skeleton" />
        ) : sortedAlarms.length === 0 ? (
          <div className="va-empty">
            <span className="va-empty-emoji" aria-hidden>⏰</span>
            <p>아직 등록된 알람이 없어요.<br />아침 7시, 잠들기 전 10시… 나의 묵상 리듬을 만들어보세요.</p>
          </div>
        ) : (
          sortedAlarms.map((alarm) => {
            const { period, time } = formatTime(alarm.time_hhmm)
            return (
              <div
                key={alarm.id}
                className={`va-card${alarm.is_active ? '' : ' is-off'}`}
              >
                <button
                  type="button"
                  className="va-card-main"
                  onClick={() => openEdit(alarm)}
                >
                  <div className="va-card-time">
                    <span className="va-card-period">{period}</span>
                    <span className="va-card-clock">{time}</span>
                  </div>
                  <div className="va-card-meta">
                    <span className="va-card-days">{formatDays(alarm.days_of_week)}</span>
                    {alarm.label && <span className="va-card-label">{alarm.label}</span>}
                  </div>
                </button>
                <label className="va-switch" aria-label={`알람 ${alarm.is_active ? '끄기' : '켜기'}`}>
                  <input
                    type="checkbox"
                    checked={alarm.is_active}
                    onChange={() => handleToggle(alarm)}
                  />
                  <span className="va-switch-slider" />
                </label>
              </div>
            )
          })
        )}
      </section>

      <button type="button" className="va-add-btn" onClick={openCreate}>
        <span className="material-icons-round" aria-hidden>add</span>
        알람 추가
      </button>

      {/* ── 알람 편집 바텀시트 ── */}
      {editor && (
        <div className="va-sheet-backdrop" onClick={() => setEditor(null)}>
          <div
            className="va-sheet"
            role="dialog"
            aria-label={editor.id === null ? '알람 추가' : '알람 수정'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="va-sheet-handle" aria-hidden />
            <h2 className="va-sheet-title">
              {editor.id === null ? '알람 추가' : '알람 수정'}
            </h2>

            <div className="va-time-picker">
              <div className="va-ampm" role="radiogroup" aria-label="오전/오후">
                {(['am', 'pm'] as AmPm[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={editor.ampm === p}
                    className={`va-ampm-btn${editor.ampm === p ? ' is-active' : ''}`}
                    onClick={() => setEditor({ ...editor, ampm: p })}
                  >
                    {p === 'am' ? '오전' : '오후'}
                  </button>
                ))}
              </div>
              <div className="va-time-selects">
                <select
                  aria-label="시"
                  value={editor.hour12}
                  onChange={(e) =>
                    setEditor({ ...editor, hour12: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="va-time-colon">:</span>
                <select
                  aria-label="분"
                  value={editor.minute}
                  onChange={(e) =>
                    setEditor({ ...editor, minute: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="va-days-row">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`va-day-chip${editor.days[i] ? ' is-active' : ''}${i >= 5 ? ' is-weekend' : ''}`}
                  aria-pressed={editor.days[i]}
                  onClick={() => {
                    const days = [...editor.days]
                    days[i] = !days[i]
                    setEditor({ ...editor, days })
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="va-day-presets">
              <button type="button" onClick={() => setEditor({ ...editor, days: [true, true, true, true, true, true, true] })}>매일</button>
              <button type="button" onClick={() => setEditor({ ...editor, days: [true, true, true, true, true, false, false] })}>평일</button>
              <button type="button" onClick={() => setEditor({ ...editor, days: [false, false, false, false, false, true, true] })}>주말</button>
            </div>

            <input
              type="text"
              className="va-label-input"
              placeholder="알람 이름 (예: 아침 묵상)"
              maxLength={50}
              value={editor.label}
              onChange={(e) => setEditor({ ...editor, label: e.target.value })}
            />

            <div className="va-sheet-actions">
              {editor.id !== null && (
                <button
                  type="button"
                  className="va-delete-btn"
                  onClick={() => handleDelete(editor.id as number)}
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                className="va-cancel-btn"
                onClick={() => setEditor(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="va-primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VerseAlarmPage
