// 타임캡슐 작성 (/capsule/new)
// 편지 글 + 3분 음성 녹음 + 개봉일(기간/절기 프리셋)을 골라 봉인한다.
// 봉인한 날의 스냅샷(절기·오늘의 말씀)은 여기서 계산해 함께 보낸다
// (절기 계산의 진실은 프론트 churchCalendar — 백엔드 season은 플레이스홀더).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DatePicker from '../../components/common/DatePicker'
import { getTodayVerse } from '../../api/dailyVerse'
import { searchCapsuleRecipients } from '../../api/timeCapsule'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useCreateCapsule } from '../../hooks/useTimeCapsule'
import type {
  CapsuleDraftPhoto,
  CapsuleRecipient,
  CapsuleSummary,
  CapsuleType,
} from '../../types/timeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { getCurrentSeason } from '../../utils/churchCalendar'
import { resizeImageToBlob } from '../../utils/imageResize'
import { showToast } from '../../utils/toast'
import { buildPresets, formatKoreanDate, toDateStr } from './capsuleDates'
import './capsule.css'

const MAX_RECORD_SECONDS = 180
const MAX_MESSAGE_LEN = 5000
const MAX_PHOTOS = 3
const MAX_CAPTION_LEN = 100
// 개봉 때 전체화면 감상까지 견디는 해상도 — 원본(수 MB)은 올리지 않는다
const PHOTO_MAX_SIZE = 1600

// 폴라로이드가 편지지 위에 아무렇게나 놓인 느낌 — 순서별 고정 기울기
const POLAROID_TILTS = ['-2.2deg', '2.4deg', '-1.4deg']

const SEASON_LABELS: Record<string, string> = {
  advent: '대림절',
  christmas: '성탄절기',
  lent: '사순절',
  easter: '부활절기',
  epiphany: '주현절기',
  ordinary: '연중',
}

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** 딥링크로 받은 개봉일이 내일 이후의 유효한 YYYY-MM-DD인지 */
const isValidFutureDateStr = (s: string | null): s is string => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() > today.getTime()
}

const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`

const CapsuleCreate = () => {
  const navigate = useNavigate()
  const createCapsule = useCreateCapsule()
  const [searchParams] = useSearchParams()

  // 기도→묵상→캡슐 딥링크 (#/capsule/new?from=prayer&prayerId=…&title=…&openDate=…&openLabel=…)
  // — 묵상 마지막 화면의 타임캡슐 초대에서 넘어온 초기값. 최초 진입 값만 쓴다.
  const suggested = useMemo(() => {
    const rawDate = searchParams.get('openDate')
    return {
      fromPrayer: searchParams.get('from') === 'prayer',
      prayerId: Number(searchParams.get('prayerId')) || undefined,
      title: (searchParams.get('title') || '').slice(0, 50),
      openDate: isValidFutureDateStr(rawDate) ? rawDate : '',
      openLabel: (searchParams.get('openLabel') || '').trim().slice(0, 30),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // '소중한 사람에게'는 direct(교인에게 바로)와 invite(초대 링크) 두 방식 —
  // 서로 아는 공동체 앱이라 바로 보내기를 기본으로 둔다
  const [capsuleType, setCapsuleType] = useState<CapsuleType>('self')
  const [recipientName, setRecipientName] = useState('')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipientResults, setRecipientResults] = useState<CapsuleRecipient[]>([])
  const [recipientSearching, setRecipientSearching] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<CapsuleRecipient | null>(null)
  const [title, setTitle] = useState(suggested.title)
  const [message, setMessage] = useState('')
  const [presetKey, setPresetKey] = useState(suggested.openDate ? 'custom' : '1y')
  const [customDate, setCustomDate] = useState(suggested.openDate)
  const [confirming, setConfirming] = useState(false)
  const [created, setCreated] = useState<CapsuleSummary | null>(null)
  const [photos, setPhotos] = useState<CapsuleDraftPhoto[]>([])
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  // 언마운트 시점의 프리뷰 URL 정리를 위해 최신 목록을 ref로 추적
  const photosRef = useRef<CapsuleDraftPhoto[]>([])
  photosRef.current = photos

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
      // 딥링크 초기값(기도 연결 등)이 로그인 후에도 살아있도록 쿼리까지 보존
      const qs = searchParams.toString()
      sessionStorage.setItem('redirect_after_login', qs ? `/capsule/new?${qs}` : '/capsule/new')
      navigate('/login')
    }
  }, [navigate, searchParams])

  // 3분 자동 컷 — 1년 뒤 듣기 좋은 길이로 제한
  useEffect(() => {
    if (recordingState === 'recording' && recordingTime >= MAX_RECORD_SECONDS) {
      stopRecording()
      showToast('3분 녹음이 완료됐어요', 'success')
    }
  }, [recordingState, recordingTime, stopRecording])

  // 받는 사람 검색 — 300ms 디바운스, 응답 역전 방지
  useEffect(() => {
    const q = recipientQuery.trim()
    if (capsuleType !== 'direct' || selectedRecipient || !q) {
      setRecipientResults([])
      setRecipientSearching(false)
      return
    }
    setRecipientSearching(true)
    let stale = false
    const timer = setTimeout(async () => {
      try {
        const results = await searchCapsuleRecipients(q)
        if (!stale) setRecipientResults(results)
      } catch {
        if (!stale) setRecipientResults([])
      } finally {
        if (!stale) setRecipientSearching(false)
      }
    }, 300)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [recipientQuery, capsuleType, selectedRecipient])

  const presets = useMemo(() => buildPresets(), [])
  const selectedPreset = presets.find((p) => p.key === presetKey)
  const openDate =
    presetKey === 'custom' ? customDate : selectedPreset ? toDateStr(selectedPreset.date) : ''
  // AI가 제안한 개봉일 그대로면 제안 라벨("수능을 마친 날")을, 바꿨으면 일반 라벨을 쓴다
  const openLabel =
    presetKey === 'custom'
      ? suggested.openLabel && customDate === suggested.openDate
        ? suggested.openLabel
        : '직접 고른 날'
      : selectedPreset?.openLabel

  // 기도 동봉은 '미래의 나에게'일 때만 — 남에게 보내는 캡슐엔 내 기도를 붙이지 않는다
  const sealedPrayerId = capsuleType === 'self' ? suggested.prayerId : undefined

  const audioUrl = useMemo(
    () => (audioBlob ? URL.createObjectURL(audioBlob) : null),
    [audioBlob],
  )
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [])

  const handlePickPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_PHOTOS - photos.length
    const picked = Array.from(files).slice(0, room)
    if (files.length > room) {
      showToast(`사진은 최대 ${MAX_PHOTOS}장까지 담을 수 있어요`, 'error')
      if (room <= 0) return
    }
    setPhotoProcessing(true)
    try {
      const drafts: CapsuleDraftPhoto[] = []
      for (const file of picked) {
        // 리사이즈 + JPEG 재인코딩 — 위치정보 등 EXIF 메타데이터도 함께 제거된다
        const blob = await resizeImageToBlob(file, PHOTO_MAX_SIZE, 0.82)
        drafts.push({ blob, previewUrl: URL.createObjectURL(blob), caption: '' })
      }
      setPhotos((prev) => [...prev, ...drafts].slice(0, MAX_PHOTOS))
    } catch {
      showToast('사진을 불러오지 못했어요. 다른 사진으로 시도해주세요', 'error')
    } finally {
      setPhotoProcessing(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleCaptionChange = (index: number, caption: string) => {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, caption: caption.slice(0, MAX_CAPTION_LEN) } : p)),
    )
  }

  const recipientReady =
    capsuleType === 'self' ||
    (capsuleType === 'direct' ? !!selectedRecipient : recipientName.trim().length > 0)

  const canSubmit =
    !!openDate &&
    (message.trim().length > 0 || !!audioBlob) &&
    recipientReady &&
    !photoProcessing &&
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
        recipientName:
          capsuleType === 'invite'
            ? recipientName.trim()
            : capsuleType === 'direct'
              ? recipientName.trim() || undefined
              : undefined,
        recipientUserId:
          capsuleType === 'direct' ? selectedRecipient?.id : undefined,
        prayerId: sealedPrayerId,
        clientSnapshot,
        audioBlob,
        audioDuration: audioBlob ? Math.min(recordingTime, MAX_RECORD_SECONDS) : undefined,
        photos: photos.length > 0 ? photos : undefined,
      })
      if (summary.capsule_type === 'invite' || summary.capsule_type === 'direct') {
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

  // 선물 캡슐 봉인 완료 화면 — direct는 배달 완료 안내, invite는 초대 링크 전달
  if (created) {
    const isDirect = created.capsule_type === 'direct'
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center px-6 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-[60vh]">
          <span className="text-[64px]">💌</span>
          <h2 className="text-[20px] font-extrabold mt-4 text-center break-keep">
            {isDirect ? (
              <>
                {created.recipient_name || '소중한 분'}님의 캡슐함에
                <br />
                바로 담아드렸어요
              </>
            ) : (
              <>
                {created.recipient_name || '소중한 분'}에게 보낼
                <br />
                캡슐이 봉인됐어요
              </>
            )}
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-white/55 mt-2.5 text-center leading-[1.7]">
            {isDirect ? (
              <>
                받는 분께 캡슐이 도착했다는 알림이 갔어요.
                <br />
                내용은 {formatKoreanDate(created.open_at)}
                {created.open_label ? ` (${created.open_label})` : ''} 아침까지 봉인돼요.
              </>
            ) : (
              <>
                아래 링크를 받는 분께 전해주세요.
                <br />
                {formatKoreanDate(created.open_at)}
                {created.open_label ? ` (${created.open_label})` : ''} 아침에 열 수 있어요.
              </>
            )}
          </p>
          {!isDirect && (
            <button
              type="button"
              onClick={handleShareCreated}
              className="w-full mt-7 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
            >
              초대 링크 전달하기
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/capsule', { replace: true })}
            className={
              isDirect
                ? 'w-full mt-7 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]'
                : 'w-full mt-2.5 py-3.5 rounded-2xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold'
            }
          >
            캡슐함으로 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-12 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
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

        {/* 기도→캡슐 흐름 안내 — 방금의 기도가 함께 봉인된다 */}
        {sealedPrayerId && (
          <div className="mx-4 mt-4 px-4 py-3.5 rounded-2xl bg-[var(--brand-soft)] border border-brand/15">
            <p className="text-[13px] font-bold text-brand">🙏 방금의 기도가 함께 봉인돼요</p>
            <p className="text-[12px] text-gray-600 dark:text-white/60 mt-1 leading-[1.6]">
              캡슐을 여는 날, 이 편지와 함께 그날의 기도와 붙들었던 말씀을 다시 보여드릴게요.
            </p>
          </div>
        )}

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
                  type: 'direct' as const,
                  label: '소중한 사람에게',
                  // 하트 — 사랑하는 이에게 보내는 마음
                  icon: (
                    <path d="M12 20.2 5.4 13.6a4.7 4.7 0 0 1 0-6.6 4.6 4.6 0 0 1 6.6 0 4.6 4.6 0 0 1 6.6 0 4.7 4.7 0 0 1 0 6.6Z" />
                  ),
                },
              ]
            ).map(({ type, label, icon }) => {
              const active = type === 'self' ? capsuleType === 'self' : capsuleType !== 'self'
              return (
              <button
                key={type}
                type="button"
                onClick={() => setCapsuleType(type)}
                className={`flex-1 py-3 rounded-2xl text-[13.5px] font-bold border transition-colors inline-flex items-center justify-center gap-1.5 ${
                  active
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
              )
            })}
          </div>
          {capsuleType !== 'self' && (
            <div className="mt-2.5">
              {/* 전달 방식 — 같은 앱 사용자면 바로, 아니면 초대 링크 */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                {(
                  [
                    { mode: 'direct' as const, label: '앱에서 바로 보내기' },
                    { mode: 'invite' as const, label: '초대 링크로 보내기' },
                  ]
                ).map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCapsuleType(mode)}
                    className={`flex-1 py-2 rounded-lg text-[12.5px] font-bold transition-colors ${
                      capsuleType === mode
                        ? 'bg-white dark:bg-card-dark text-brand shadow-sm'
                        : 'text-gray-500 dark:text-white/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {capsuleType === 'direct' && (
                <div className="mt-2.5">
                  {selectedRecipient ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--brand-soft)] border border-brand/20">
                      {selectedRecipient.avatar_url ? (
                        <img
                          src={selectedRecipient.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-brand/15 text-brand text-[15px] font-extrabold flex items-center justify-center shrink-0">
                          {selectedRecipient.display_name.charAt(0)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-ink-strong truncate">
                          {selectedRecipient.display_name}
                        </p>
                        <p className="text-[11.5px] text-gray-400 dark:text-white/40 truncate">
                          @{selectedRecipient.username}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecipient(null)
                          setRecipientQuery('')
                        }}
                        aria-label="받는 분 다시 고르기"
                        className="shrink-0 w-7 h-7 rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-white/60 text-[12px] font-bold flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={recipientQuery}
                        onChange={(e) => setRecipientQuery(e.target.value)}
                        maxLength={20}
                        placeholder="받는 분 이름을 검색하세요"
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[14px] outline-none focus:border-brand placeholder:text-gray-400 dark:placeholder:text-white/30"
                      />
                      {recipientQuery.trim() && (
                        <div className="mt-1.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
                          {recipientSearching ? (
                            <p className="px-4 py-3 text-[12.5px] text-gray-400 dark:text-white/40">
                              찾는 중...
                            </p>
                          ) : recipientResults.length === 0 ? (
                            <p className="px-4 py-3 text-[12.5px] text-gray-400 dark:text-white/40 leading-[1.6]">
                              앱에서 찾을 수 없어요.
                              아직 가입 전이라면 초대 링크로 보내주세요.
                            </p>
                          ) : (
                            recipientResults.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRecipient(u)
                                  setRecipientResults([])
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b last:border-b-0 border-gray-100 dark:border-white/[0.05] active:bg-gray-50 dark:active:bg-white/[0.04]"
                              >
                                {u.avatar_url ? (
                                  <img
                                    src={u.avatar_url}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <span className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-brand text-[13.5px] font-extrabold flex items-center justify-center shrink-0">
                                    {u.display_name.charAt(0)}
                                  </span>
                                )}
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[13.5px] font-bold text-ink-strong truncate">
                                    {u.display_name}
                                  </span>
                                  <span className="block text-[11px] text-gray-400 dark:text-white/40 truncate">
                                    @{u.username}
                                  </span>
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <p className="px-1 mt-1.5 text-[11px] text-gray-400 dark:text-white/35 leading-[1.6]">
                    봉인하면 받는 분 캡슐함에 바로 담기고, 도착 알림이 가요.
                    내용은 개봉일까지 아무도 볼 수 없어요.
                  </p>
                </div>
              )}

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

        {/* 사진 — 폴라로이드처럼 편지에 끼워 보낸다 */}
        <section className="px-4 pt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <p className="text-[13.5px] font-bold text-ink-strong">
              📷 사진 끼우기{' '}
              <span className="text-gray-400 dark:text-white/40 font-normal">
                (선택 · 최대 {MAX_PHOTOS}장)
              </span>
            </p>
            <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-0.5">
              개봉하는 날, 사진이 그 시절 그대로 인화되어 나와요
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePickPhotos(e.target.files)}
            />

            {photos.length > 0 && (
              <div className="mt-3.5 flex flex-col gap-4">
                {photos.map((photo, i) => (
                  <div
                    key={photo.previewUrl}
                    className="capsule-polaroid capsule-polaroid--developed relative mx-auto"
                    style={{ transform: `rotate(${POLAROID_TILTS[i % POLAROID_TILTS.length]})` }}
                  >
                    <img src={photo.previewUrl} alt="" className="capsule-polaroid__img" />
                    <input
                      type="text"
                      value={photo.caption}
                      onChange={(e) => handleCaptionChange(i, e.target.value)}
                      maxLength={MAX_CAPTION_LEN}
                      placeholder="한 줄 캡션 (선택)"
                      className="capsule-polaroid__caption-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      aria-label="사진 빼기"
                      className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gray-800/85 text-white text-[13px] font-bold flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoProcessing}
                className="mt-3 w-full py-3 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold disabled:opacity-60"
              >
                {photoProcessing
                  ? '사진 담는 중...'
                  : photos.length > 0
                    ? '사진 더 끼우기'
                    : '앨범에서 고르기'}
              </button>
            )}
          </div>
        </section>

        {/* 음성 */}
        <section className="px-4 pt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-bold text-ink-strong">
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
                <span className="text-[15px] font-extrabold tabular-nums text-ink-strong">
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
              📅 <strong className="text-ink-strong">{formatKoreanDate(openDate)}</strong> 아침 7시에 열려요
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
              {capsuleType === 'direct' && !selectedRecipient
                ? '받는 분을 검색해 선택해주세요'
                : capsuleType === 'invite' && !recipientName.trim()
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
