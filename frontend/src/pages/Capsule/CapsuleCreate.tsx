// 타임캡슐 작성 (/capsule/new)
// 편지 글 + 3분 음성 녹음 + 개봉일(기간/절기 프리셋)을 골라 봉인한다.
// 봉인한 날의 스냅샷(절기·오늘의 말씀)은 여기서 계산해 함께 보낸다
// (절기 계산의 진실은 프론트 churchCalendar — 백엔드 season은 플레이스홀더).
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from '../../components/common/DatePicker'
import { getTodayVerse } from '../../api/dailyVerse'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useCreateCapsule } from '../../hooks/useTimeCapsule'
import type { CapsuleSummary, CapsuleType } from '../../types/timeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { getCurrentSeason } from '../../utils/churchCalendar'
import { showToast } from '../../utils/toast'
import { buildPresets, formatKoreanDate, toDateStr } from './capsuleDates'

const MAX_RECORD_SECONDS = 180
const MAX_MESSAGE_LEN = 5000

const SEASON_LABELS: Record<string, string> = {
  advent: '대림절',
  christmas: '성탄절기',
  lent: '사순절',
  easter: '부활절기',
  epiphany: '주현절기',
  ordinary: '연중',
}

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`

const CapsuleCreate = () => {
  const navigate = useNavigate()
  const createCapsule = useCreateCapsule()

  const [capsuleType, setCapsuleType] = useState<CapsuleType>('self')
  const [recipientName, setRecipientName] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [presetKey, setPresetKey] = useState('1y')
  const [customDate, setCustomDate] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [created, setCreated] = useState<CapsuleSummary | null>(null)

  const {
    recordingState,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    error: recordError,
  } = useAudioRecorder()

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/capsule/new')
      navigate('/login')
    }
  }, [navigate])

  // 3분 자동 컷 — 1년 뒤 듣기 좋은 길이로 제한
  useEffect(() => {
    if (recordingState === 'recording' && recordingTime >= MAX_RECORD_SECONDS) {
      stopRecording()
      showToast('3분 녹음이 완료됐어요', 'success')
    }
  }, [recordingState, recordingTime, stopRecording])

  const presets = useMemo(() => buildPresets(), [])
  const selectedPreset = presets.find((p) => p.key === presetKey)
  const openDate =
    presetKey === 'custom' ? customDate : selectedPreset ? toDateStr(selectedPreset.date) : ''
  const openLabel = presetKey === 'custom' ? '직접 고른 날' : selectedPreset?.openLabel

  const audioUrl = useMemo(
    () => (audioBlob ? URL.createObjectURL(audioBlob) : null),
    [audioBlob],
  )
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const canSubmit =
    !!openDate &&
    (message.trim().length > 0 || !!audioBlob) &&
    (capsuleType === 'self' || recipientName.trim().length > 0) &&
    !createCapsule.isPending

  const handleSeal = async () => {
    if (!canSubmit) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    // 봉인한 날의 스냅샷 — 실패해도 봉인은 진행한다
    let clientSnapshot
    try {
      const verse = await getTodayVerse()
      clientSnapshot = {
        season_label: SEASON_LABELS[getCurrentSeason(new Date())],
        verse_reference: verse.verse_reference,
        verse_text: verse.verse_text,
      }
    } catch {
      clientSnapshot = { season_label: SEASON_LABELS[getCurrentSeason(new Date())] }
    }
    try {
      const summary = await createCapsule.mutateAsync({
        capsuleType,
        openDate,
        openLabel,
        message: message.trim() || undefined,
        title: title.trim() || undefined,
        recipientName: capsuleType === 'invite' ? recipientName.trim() : undefined,
        clientSnapshot,
        audioBlob,
        audioDuration: audioBlob ? Math.min(recordingTime, MAX_RECORD_SECONDS) : undefined,
      })
      if (summary.capsule_type === 'invite') {
        setCreated(summary)
      } else {
        showToast(`봉인 완료! ${formatKoreanDate(summary.open_at)} 아침에 만나요 🕰️`, 'success')
        navigate('/capsule', { replace: true })
      }
    } catch (e) {
      setConfirming(false)
      showToast(e instanceof Error ? e.message : '봉인에 실패했습니다', 'error')
    }
  }

  const handleShareCreated = async () => {
    if (!created?.invite_code) return
    const url = capsuleInviteUrl(created.invite_code)
    const text = `🕰️ ${created.recipient_name || '당신'}에게 보내는 타임캡슐이에요.\n${formatKoreanDate(
      created.open_at,
    )}${created.open_label ? ` (${created.open_label})` : ''}에 열려요.`
    if (navigator.share) {
      try {
        // text에 URL을 넣고 url도 함께 넘기면 공유 대상 앱이 링크를 두 번 붙임
        await navigator.share({ title: '타임캡슐 초대장', text, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`)
      showToast('초대 링크를 복사했어요. 받는 분께 전해주세요', 'success')
    } catch {
      showToast('링크 복사에 실패했어요', 'error')
    }
  }

  // 선물 캡슐 봉인 완료 화면 — 초대 링크 전달이 다음 행동
  if (created) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen flex flex-col items-center justify-center px-6">
          <span className="text-[64px]">💌</span>
          <h2 className="text-[20px] font-extrabold mt-4 text-center break-keep">
            {created.recipient_name || '소중한 분'}에게 보낼
            <br />
            캡슐이 봉인됐어요
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-white/55 mt-2.5 text-center leading-[1.7]">
            아래 링크를 받는 분께 전해주세요.
            <br />
            {formatKoreanDate(created.open_at)}
            {created.open_label ? ` (${created.open_label})` : ''} 아침에 열 수 있어요.
          </p>
          <button
            type="button"
            onClick={handleShareCreated}
            className="w-full mt-7 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
          >
            초대 링크 전달하기
          </button>
          <button
            type="button"
            onClick={() => navigate('/capsule', { replace: true })}
            className="w-full mt-2.5 py-3.5 rounded-2xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold"
          >
            캡슐함으로 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-12">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-gray-700 dark:text-white/80"
            aria-label="뒤로"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[16px] font-extrabold">새 타임캡슐</h1>
        </div>

        {/* 받는 사람 */}
        <section className="px-4 pt-5">
          <p className="px-1 mb-2 text-[12px] font-bold text-[var(--text-muted)]">받는 사람</p>
          <div className="flex gap-2">
            {(
              [
                {
                  type: 'self' as const,
                  label: '미래의 나에게',
                  // 시계 — 시간이 흘러 도착하는 캡슐
                  icon: (
                    <>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7.5V12l3 2" />
                    </>
                  ),
                },
                {
                  type: 'invite' as const,
                  label: '소중한 사람에게',
                  // 하트 — 사랑하는 이에게 보내는 마음
                  icon: (
                    <path d="M12 20.2 5.4 13.6a4.7 4.7 0 0 1 0-6.6 4.6 4.6 0 0 1 6.6 0 4.6 4.6 0 0 1 6.6 0 4.7 4.7 0 0 1 0 6.6Z" />
                  ),
                },
              ]
            ).map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setCapsuleType(type)}
                className={`flex-1 py-3 rounded-2xl text-[13.5px] font-bold border transition-colors inline-flex items-center justify-center gap-1.5 ${
                  capsuleType === type
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-card-dark text-gray-600 dark:text-white/60 border-gray-200/70 dark:border-white/[0.08]'
                }`}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {icon}
                </svg>
                {label}
              </button>
            ))}
          </div>
          {capsuleType === 'invite' && (
            <div className="mt-2.5">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={20}
                placeholder="받는 분 이름이나 애칭 (예: 아들 민준)"
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[14px] outline-none focus:border-brand placeholder:text-gray-400 dark:placeholder:text-white/30"
              />
              <p className="px-1 mt-1.5 text-[11px] text-gray-400 dark:text-white/35 leading-[1.6]">
                봉인 후 초대 링크를 전달하면, 받는 분이 자신의 캡슐로 등록해요.
                아직 앱이 없어도 가입하면 이어져요.
              </p>
            </div>
          )}
        </section>

        {/* 편지 */}
        <section className="px-4 pt-6">
          <p className="px-1 mb-2 text-[12px] font-bold text-[var(--text-muted)]">편지</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            placeholder="제목 (선택)"
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[14px] font-bold outline-none focus:border-brand placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-white/30"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))}
            rows={7}
            placeholder={
              capsuleType === 'self'
                ? '캡슐을 여는 날의 나에게, 지금의 마음과 기도를 남겨보세요'
                : '캡슐을 여는 날의 그 사람에게, 전하고 싶은 마음을 남겨보세요'
            }
            className="w-full mt-2.5 px-4 py-3.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[14px] leading-[1.7] outline-none focus:border-brand resize-none placeholder:text-gray-400 dark:placeholder:text-white/30"
          />
        </section>

        {/* 음성 */}
        <section className="px-4 pt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">
                  🎙️ 목소리 남기기 <span className="text-gray-400 dark:text-white/40 font-normal">(선택 · 최대 3분)</span>
                </p>
                <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-0.5">
                  시간이 지나 다시 듣는 목소리는 글과는 다른 울림이 있어요
                </p>
              </div>
            </div>

            {recordError && (
              <p className="mt-2.5 text-[12px] text-red-500">{recordError}</p>
            )}

            {recordingState === 'idle' && !audioBlob && (
              <button
                type="button"
                onClick={startRecording}
                className="mt-3 w-full py-3 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold"
              >
                녹음 시작
              </button>
            )}

            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="mt-3 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-[15px] font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {formatSeconds(recordingTime)}
                  <span className="text-gray-400 dark:text-white/40 font-normal"> / {formatSeconds(MAX_RECORD_SECONDS)}</span>
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-[width] duration-1000 ease-linear"
                    style={{ width: `${Math.min(100, (recordingTime / MAX_RECORD_SECONDS) * 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="shrink-0 px-4 py-2 rounded-full bg-brand text-white text-[12.5px] font-bold"
                >
                  완료
                </button>
              </div>
            )}

            {audioBlob && audioUrl && (
              <div className="mt-3">
                <audio controls src={audioUrl} className="w-full" />
                <button
                  type="button"
                  onClick={resetRecording}
                  className="mt-2 text-[12.5px] font-bold text-gray-500 dark:text-white/50"
                >
                  ↺ 다시 녹음하기
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 개봉일 */}
        <section className="px-4 pt-6">
          <p className="px-1 mb-2 text-[12px] font-bold text-[var(--text-muted)]">언제 열까요?</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPresetKey(p.key)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
                  presetKey === p.key
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPresetKey('custom')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
                presetKey === 'custom'
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              직접 선택
            </button>
          </div>
          {presetKey === 'custom' && (
            <div className="mt-2.5">
              <DatePicker value={customDate} onChange={setCustomDate} placeholder="개봉일을 선택하세요" />
            </div>
          )}
          {openDate && (
            <p className="px-1 mt-2.5 text-[12.5px] text-gray-500 dark:text-white/55">
              📅 <strong className="text-gray-900 dark:text-white">{formatKoreanDate(openDate)}</strong> 아침 7시에 열려요
            </p>
          )}
        </section>

        {/* 봉인 */}
        <section className="px-4 pt-7">
          {confirming && (
            <div className="mb-3 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25">
              <p className="text-[13px] font-bold text-amber-700 dark:text-amber-300">
                봉인하면 개봉일까지 아무도 열어볼 수 없어요
              </p>
              <p className="text-[12px] text-gray-600 dark:text-white/60 mt-1 leading-[1.6]">
                쓴 사람인 나도 다시 볼 수 없습니다. 그게 타임캡슐의 재미예요.
                내용을 한 번 더 확인했다면 아래 버튼을 눌러주세요.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSeal}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-40"
          >
            {createCapsule.isPending
              ? '봉인하는 중...'
              : confirming
                ? '🔏 정말 봉인하기'
                : '캡슐 봉인하기'}
          </button>
          {!canSubmit && !createCapsule.isPending && (
            <p className="text-center text-[11.5px] text-gray-400 dark:text-white/35 mt-2">
              {capsuleType === 'invite' && !recipientName.trim()
                ? '받는 분 이름을 적어주세요'
                : !message.trim() && !audioBlob
                  ? '편지 글이나 음성 중 하나는 담아야 해요'
                  : !openDate
                    ? '개봉일을 선택해주세요'
                    : ''}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default CapsuleCreate
