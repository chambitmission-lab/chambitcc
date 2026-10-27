// 타임캡슐 작성 (/capsule/new) — "배달부 양과 함께" 한 걸음씩 담기.
// 받는 사람 → 여는 날 → 편지(글/손글씨) → 함께 넣을 것(사진·목소리) → 인장 꾹 봉인, 다섯 단계.
// 단계마다 배달부 양 삽화가 바뀌고 양이 한 줄씩 반응한다(create/createQuips.ts).
// 단계는 ?step= 으로 히스토리에 쌓여 휴대폰 뒤로가기가 이전 단계로 돌아간다.
// 봉인한 날의 스냅샷(절기·오늘의 말씀)은 여기서 계산해 함께 보낸다
// (절기 계산의 진실은 프론트 churchCalendar — 백엔드 season은 플레이스홀더).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { buildPresets, daysUntil, formatKoreanDate, toDateStr } from './capsuleDates'
import HandwritingSheet from './ink/HandwritingSheet'
import { buildHandwritingUpload } from './ink/inkExport'
import { emptyInkPage, filledInkPages, type InkPage } from './ink/inkModel'
import './capsule.css'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { redirectAfterLogin } from '../../utils/redirectAfterLogin'
import { CAPSULE_CREATE_ART, warmPair } from '../../utils/themeAssets'
import SheepStage from './create/SheepStage'
import CtaButton, { type CtaIcon } from './create/CtaButton'
import SealHold from './create/SealHold'
import StepRecipient from './create/StepRecipient'
import StepWhen from './create/StepWhen'
import StepLetter from './create/StepLetter'
import StepExtras from './create/StepExtras'
import {
  STEP_COUNT,
  dateQuip,
  extrasQuip,
  letterQuip,
  recipientQuip,
  sealQuip,
  type CreateStep,
} from './create/createQuips'

// 손글씨 서체는 이 화면이 쓸 때만 받는다 (src/utils/deferredFonts.ts)
ensureFontFamily('nanumPen')

const MAX_RECORD_SECONDS = 180
const MAX_MESSAGE_LEN = 5000
const MAX_PHOTOS = 3
const MAX_CAPTION_LEN = 100
// 개봉 때 전체화면 감상까지 견디는 해상도 — 원본(수 MB)은 올리지 않는다
const PHOTO_MAX_SIZE = 1600

// 단계별 삽화 — 1 받는 사람(달리는 배달부) · 2 여는 날(시간에 지쳐 뒤집힌 양) ·
// 3 편지(편지를 문 아기 양) · 4 함께 넣을 것(가방) · 5 봉인(금고 앞을 지키는 양)
const STEP_ART = {
  1: { pair: CAPSULE_CREATE_ART.recipient, variant: 'recipient' },
  2: { pair: CAPSULE_CREATE_ART.date, variant: 'date' },
  3: { pair: CAPSULE_CREATE_ART.letter, variant: 'letter' },
  4: { pair: CAPSULE_CREATE_ART.extras, variant: 'extras' },
  5: { pair: CAPSULE_CREATE_ART.seal, variant: 'seal' },
} as const

const parseStep = (raw: string | null): CreateStep => {
  const n = Number(raw)
  return (Number.isInteger(n) && n >= 1 && n <= STEP_COUNT ? n : 1) as CreateStep
}

const SEASON_LABELS: Record<string, string> = {
  advent: '대림절',
  christmas: '성탄절기',
  lent: '사순절',
  easter: '부활절기',
  epiphany: '주현절기',
  ordinary: '연중',
}

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
  const [searchParams, setSearchParams] = useSearchParams()

  // 기도→묵상→캡슐 딥링크 (#/capsule/new?from=prayer&prayerId=…&title=…&openDate=…&openLabel=…)
  // — 묵상 마지막 화면의 타임캡슐 초대에서 넘어온 초기값. 최초 진입 값만 쓴다.
  const suggested = useMemo(() => {
    const rawDate = searchParams.get('openDate')
    return {
      fromPrayer: searchParams.get('from') === 'prayer',
      prayerId: Number(searchParams.get('prayerId')) || undefined,
      // 누군가의 기도 지난달 마무리 → 그 한 달(등불·편지·기도제목)을 함께 봉인
      intercessionCycleId:
        searchParams.get('from') === 'intercession'
          ? Number(searchParams.get('intercessionCycleId')) || undefined
          : undefined,
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
  // 편지는 타자로도, 펜으로도 쓴다. 전환해도 양쪽 내용은 남고 봉인 때 둘 다 담긴다
  const [letterMode, setLetterMode] = useState<'type' | 'pen'>('type')
  const [inkPages, setInkPages] = useState<InkPage[]>(() => [emptyInkPage()])
  const [inkOpen, setInkOpen] = useState(false)
  const [presetKey, setPresetKey] = useState(suggested.openDate ? 'custom' : '1y')
  const [customDate, setCustomDate] = useState(suggested.openDate)
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
      redirectAfterLogin.set(qs ? `/capsule/new?${qs}` : '/capsule/new')
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
  const sealedIntercessionCycleId = capsuleType === 'self' ? suggested.intercessionCycleId : undefined

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

  const writtenInkPages = filledInkPages(inkPages)
  const hasInk = writtenInkPages.length > 0
  const hasLetter = message.trim().length > 0 || !!audioBlob || hasInk

  const canSubmit =
    !!openDate &&
    hasLetter &&
    recipientReady &&
    !photoProcessing &&
    !createCapsule.isPending

  // 손글씨 편지지 머리에 적힐 받는 사람
  const inkAddressee =
    capsuleType === 'self'
      ? '미래의 나'
      : capsuleType === 'direct'
        ? recipientName.trim() || selectedRecipient?.display_name || '소중한 분'
        : recipientName.trim() || '소중한 분'

  // 인장 꾹 누르기가 확인을 대신한다 (SealHold)
  const handleSeal = async () => {
    if (!canSubmit) return
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
    // 손글씨는 봉인 직전에 굽는다 — 장마다 투명 PNG + 획 JSON
    let handwriting
    if (hasInk) {
      try {
        handwriting = await buildHandwritingUpload(writtenInkPages)
      } catch {
        showToast('손글씨를 담는 데 실패했어요. 다시 시도해주세요', 'error')
        return
      }
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
        intercessionCycleId: sealedIntercessionCycleId,
        clientSnapshot,
        audioBlob,
        audioDuration: audioBlob ? Math.min(recordingTime, MAX_RECORD_SECONDS) : undefined,
        photos: photos.length > 0 ? photos : undefined,
        handwriting,
      })
      if (summary.capsule_type === 'invite' || summary.capsule_type === 'direct') {
        setCreated(summary)
      } else {
        showToast(`봉인 완료! ${formatKoreanDate(summary.open_at)} 아침에 만나요 🕰️`, 'success')
        navigate('/capsule', { replace: true })
      }
    } catch (e) {
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

  // ── 단계 이동 ────────────────────────────────────────────────
  const step = parseStep(searchParams.get('step'))

  // 새로고침·공유 링크로 중간 단계에 떨어지면 초안이 비어 있다 — 첫 단계로 되돌린다
  useEffect(() => {
    if (searchParams.get('step')) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('step')
          return next
        },
        { replace: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 앞으로는 히스토리를 쌓고(push), 뒤로는 히스토리를 되감는다 — 휴대폰 뒤로가기와 같은 길
  const goStep = (n: CreateStep) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('step', String(n))
      return next
    })
  const backTo = (n: CreateStep) => {
    if (n < step) navigate(n - step)
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
    // 다음 단계 삽화를 미리 데워 둔다 — 넘기는 순간 그림이 비어 보이지 않게
    const next = STEP_ART[(step + 1) as CreateStep]
    if (next) void warmPair(next.pair)
  }, [step])

  // 아래 고정 버튼 줄 위로 참비(챗봇) 버튼을 비켜세운다
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--chat-fab-lift', '1.75rem')
    return () => {
      root.style.removeProperty('--chat-fab-lift')
    }
  }, [])

  const isSelf = capsuleType === 'self'
  const nights = openDate ? daysUntil(`${openDate}T00:00:00`) : null
  const recording = recordingState === 'recording' || recordingState === 'paused'
  const hasWritten = message.trim().length > 0 || hasInk
  const openDateText = openDate ? formatKoreanDate(openDate) : '그날'

  const quip =
    step === 1
      ? recipientQuip(isSelf ? 'self' : 'other')
      : step === 2
        ? dateQuip(presetKey, nights)
        : step === 3
          ? letterQuip(message.trim().length, hasInk)
          : step === 4
            ? extrasQuip(photos.length, !!audioBlob, recording)
            : sealQuip(openDateText)

  // 저절로 함께 봉인되는 것들 — 4단계 안내와 5단계 요약이 같은 목록을 쓴다
  const enclosures = [
    '오늘의 말씀과 지금의 신앙 기록 (P.S.)',
    ...(sealedPrayerId ? ['방금의 기도와 붙들었던 말씀'] : []),
    ...(sealedIntercessionCycleId ? ['함께 기도해 준 지난 한 달'] : []),
  ]

  const recipientLabel = isSelf
    ? '미래의 나'
    : capsuleType === 'direct'
      ? selectedRecipient
        ? `${selectedRecipient.display_name}님`
        : '받는 분'
      : recipientName.trim() || '받는 분'

  // 담은 것 목록 — 5단계 요약과 PC 왼쪽 패널(배달 길)이 같이 쓴다
  const voiceText = audioBlob
    ? `목소리 ${Math.floor(Math.min(recordingTime, MAX_RECORD_SECONDS) / 60)}:${String(
        Math.min(recordingTime, MAX_RECORD_SECONDS) % 60,
      ).padStart(2, '0')}`
    : ''
  const letterParts = [
    message.trim() && `편지 ${message.trim().length.toLocaleString()}자`,
    hasInk && `손글씨 ${writtenInkPages.length}장`,
  ].filter(Boolean) as string[]
  const extraParts = [photos.length > 0 && `사진 ${photos.length}장`, voiceText].filter(Boolean) as string[]
  const trail = [
    { label: '받는 사람', value: recipientReady ? recipientLabel : '' },
    { label: '여는 날', value: openDate ? `${openDateText}${nights !== null ? ` · ${nights.toLocaleString()}밤` : ''}` : '' },
    { label: '편지', value: letterParts.length ? letterParts.join(' · ') : step > 3 ? '목소리로만' : '' },
    { label: '함께 넣을 것', value: extraParts.length ? extraParts.join(' · ') : step > 4 ? '없음' : '' },
    { label: '봉인', value: '' },
  ]

  // 단계별 아래 버튼 — 고른 답을 버튼이 말한다("미래의 나에게 보낼게요")
  type Foot = { label: string; icon?: CtaIcon; disabled?: boolean; ghost?: boolean; onClick: () => void }
  const foot: Foot | null =
    step === 1
      ? recipientReady
        ? {
            label: `${recipientLabel}${recipientLabel.endsWith('님') ? '께' : '에게'} 보낼게요`,
            icon: 'mail',
            onClick: () => goStep(2),
          }
        : {
            label: capsuleType === 'direct' ? '받는 분을 골라 주세요' : '받는 분 이름을 적어 주세요',
            disabled: true,
            onClick: () => {},
          }
      : step === 2
        ? openDate
          ? { label: '이날 배달해 주세요', icon: 'calendar', onClick: () => goStep(3) }
          : { label: '날짜를 골라 주세요', disabled: true, onClick: () => {} }
        : step === 3
          ? hasWritten
            ? { label: '다 썼어요!', icon: 'pen', onClick: () => goStep(4) }
            : { label: '편지를 써 주세요', disabled: true, onClick: () => {} }
          : step === 4
            ? recording
              ? { label: '녹음을 마쳐 주세요', disabled: true, onClick: () => {} }
              : !hasLetter
                ? { label: '편지나 목소리 하나는 담아 주세요', disabled: true, onClick: () => {} }
                : photos.length > 0 || audioBlob
                  ? { label: '다 넣었어요', icon: 'box', onClick: () => goStep(5) }
                  : { label: '이대로 충분해요', ghost: true, onClick: () => goStep(5) }
            : null

  // 선물 캡슐 봉인 완료 화면 — direct는 배달 완료 안내, invite는 초대 링크 전달
  if (created) {
    const isDirect = created.capsule_type === 'direct'
    const name = created.recipient_name || '소중한 분'
    return (
      <div className="cw-page page-stage">
        <div className="cw-shell screen-fit-minus-header">
          <SheepStage
            step={5}
            art={STEP_ART[5].pair}
            artVariant={STEP_ART[5].variant}
            quip={
              isDirect
                ? `${name}님 캡슐함에 쏙 넣고 왔어요!`
                : '초대장만 전해 주시면 나머지는 제가 할게요'
            }
            closeOnly
            onBack={() => navigate('/capsule', { replace: true })}
          />
          <main className="cw-body cw-body--center">
            <h2 className="cw-title">
              {isDirect ? (
                <>
                  {name}님의 캡슐함에
                  <br />
                  바로 담아드렸어요
                </>
              ) : (
                <>
                  {name}에게 보낼
                  <br />
                  캡슐이 봉인됐어요
                </>
              )}
            </h2>
            <p className="cw-sub">
              {isDirect ? (
                <>
                  받는 분께 도착 알림이 갔어요.
                  <br />
                  내용은 {formatKoreanDate(created.open_at)}
                  {created.open_label ? ` (${created.open_label})` : ''} 아침까지 봉인돼요.
                </>
              ) : (
                <>
                  아래 링크를 받는 분께 전해 주세요.
                  <br />
                  {formatKoreanDate(created.open_at)}
                  {created.open_label ? ` (${created.open_label})` : ''} 아침에 열 수 있어요.
                </>
              )}
            </p>
          </main>
          <footer className="cw-foot">
            {!isDirect && <CtaButton label="초대 링크 전하기" icon="link" amber onClick={handleShareCreated} />}
            <CtaButton
              label="캡슐함으로 가기"
              icon="home"
              ghost={!isDirect}
              onClick={() => navigate('/capsule', { replace: true })}
            />
          </footer>
        </div>
      </div>
    )
  }

  let body: ReactNode
  if (step === 1) {
    body = (
      <StepRecipient
        capsuleType={capsuleType}
        onTypeChange={setCapsuleType}
        recipientName={recipientName}
        onRecipientNameChange={setRecipientName}
        recipientQuery={recipientQuery}
        onRecipientQueryChange={setRecipientQuery}
        recipientResults={recipientResults}
        recipientSearching={recipientSearching}
        selectedRecipient={selectedRecipient}
        onSelectRecipient={(u) => {
          setSelectedRecipient(u)
          if (u) setRecipientResults([])
        }}
        sealsPrayer={!!suggested.prayerId}
        sealsIntercession={!!suggested.intercessionCycleId}
      />
    )
  } else if (step === 2) {
    body = (
      <StepWhen
        presets={presets}
        presetKey={presetKey}
        onPresetChange={setPresetKey}
        customDate={customDate}
        onCustomDateChange={setCustomDate}
        openDate={openDate}
        nights={nights}
      />
    )
  } else if (step === 3) {
    body = (
      <>
        <StepLetter
          isSelf={isSelf}
          addressee={inkAddressee}
          title={title}
          onTitleChange={setTitle}
          message={message}
          onMessageChange={setMessage}
          maxLength={MAX_MESSAGE_LEN}
          letterMode={letterMode}
          onLetterModeChange={setLetterMode}
          inkPages={inkPages}
          writtenInkCount={writtenInkPages.length}
          onOpenInk={() => setInkOpen(true)}
        />
        {/* 글·손글씨 없이 목소리만 남기는 길 — 내용 필수 규칙은 셋 중 하나 */}
        {!hasWritten && (
          <button type="button" onClick={() => goStep(4)} className="cw-textlink">
            글 대신 목소리로만 남길래요 →
          </button>
        )}
      </>
    )
  } else if (step === 4) {
    body = (
      <StepExtras
        photos={photos}
        maxPhotos={MAX_PHOTOS}
        maxCaption={MAX_CAPTION_LEN}
        photoProcessing={photoProcessing}
        photoInputRef={photoInputRef}
        onPickPhotos={handlePickPhotos}
        onRemovePhoto={handleRemovePhoto}
        onCaptionChange={handleCaptionChange}
        recordingState={recordingState}
        recordingTime={recordingTime}
        maxRecordSeconds={MAX_RECORD_SECONDS}
        audioUrl={audioUrl}
        recordError={recordError}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onResetRecording={resetRecording}
        enclosures={enclosures}
      />
    )
  } else {
    const contents = [...letterParts, ...extraParts]
    body = (
      <div className="cw-body--center">
        <h2 className="cw-title">캡슐 문을 닫을까요?</h2>
        <p className="cw-sub">
          닫으면 {openDateText} 아침까지 {isSelf ? '나조차도' : '받는 분도, 나도'} 열어볼 수 없어요
        </p>

        {/* 고른 것들 — 누르면 그 단계로 되돌아가 고친다 */}
        <div className="cw-summary">
          <button type="button" onClick={() => backTo(1)} className="cw-summary__row">
            <span>받는 사람</span>
            <b>{recipientLabel}</b>
          </button>
          <button type="button" onClick={() => backTo(2)} className="cw-summary__row">
            <span>여는 날</span>
            <b>
              {openDateText}
              {openLabel ? ` · ${openLabel}` : ''}
            </b>
          </button>
          <button type="button" onClick={() => backTo(3)} className="cw-summary__row">
            <span>담은 것</span>
            <b>{contents.length ? contents.join(' · ') : '아직 없어요'}</b>
          </button>
          <p className="cw-summary__ps">+ {enclosures.join(' · ')}</p>
        </div>

        <SealHold disabled={!canSubmit} pending={createCapsule.isPending} onSeal={handleSeal} />

        {!canSubmit && !createCapsule.isPending ? (
          <p className="cw-note text-center">
            {!recipientReady
              ? '받는 분을 먼저 정해 주세요'
              : !hasLetter
                ? '편지 글·손글씨·목소리 중 하나는 담아야 해요'
                : !openDate
                  ? '여는 날을 골라 주세요'
                  : photoProcessing
                    ? '사진을 담는 중이에요'
                    : ''}
          </p>
        ) : (
          capsuleType === 'invite' && <p className="cw-note text-center">봉인하면 받는 분께 전할 초대 링크가 만들어져요</p>
        )}
      </div>
    )
  }

  const art = STEP_ART[step]

  return (
    <div className="cw-page page-stage">
      <div className="cw-shell screen-fit-minus-header">
        <SheepStage
          step={step}
          art={art.pair}
          artVariant={art.variant}
          quip={quip}
          speaker={step === 3 ? '아기 양' : '배달부 양'}
          trail={trail}
          onTrailClick={backTo}
          onBack={() => navigate(-1)}
        />

        {/* key — 단계가 바뀌면 본문이 새로 들어온다(등장 연출) */}
        <main className="cw-body" key={step}>
          {body}
        </main>

        {foot && (
          <footer className="cw-foot">
            <CtaButton
              label={foot.label}
              icon={foot.icon}
              ghost={foot.ghost}
              disabled={foot.disabled}
              onClick={foot.onClick}
            />
          </footer>
        )}
      </div>

      {/* 손글씨 편지지 — 전체화면. 닫으면 쓴 그대로 남는다 */}
      {inkOpen && (
        <HandwritingSheet
          pages={inkPages}
          onChange={setInkPages}
          onClose={() => setInkOpen(false)}
          addressee={inkAddressee}
        />
      )}
    </div>
  )
}

export default CapsuleCreate
