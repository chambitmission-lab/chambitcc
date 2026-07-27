// 목소리 들으며 사진 보기 — 캡슐 개봉의 피날레
// 음성 편지가 재생되는 동안 사진이 천천히 줌·팬(Ken Burns)되며 넘어간다.
// 슬라이드는 한 방향으로만 진행하고 마지막 사진에 머문다 (루프 없음 —
// 각 슬라이드가 한 번만 활성화되므로 CSS 애니메이션 재시작 문제도 없다).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CapsulePhoto } from '../../types/timeCapsule'
import './capsule.css'

const KENBURNS = ['capsule-kenburns-a', 'capsule-kenburns-b', 'capsule-kenburns-c']

const MIN_SLIDE_MS = 6000
const MAX_SLIDE_MS = 15000
const DEFAULT_SLIDE_MS = 8000

interface Props {
  photos: CapsulePhoto[]
  audioUrl: string
  audioDuration: number | null
  senderLine: string
  onClose: () => void
}

const CapsuleSlideshow = ({ photos, audioUrl, audioDuration, senderLine, onClose }: Props) => {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 음성 길이를 사진 수로 나눠 슬라이드 간격을 정한다 (없으면 기본 8초)
  const slideMs = useMemo(() => {
    if (!audioDuration || photos.length === 0) return DEFAULT_SLIDE_MS
    const perSlide = ((audioDuration - 2) * 1000) / photos.length
    return Math.min(MAX_SLIDE_MS, Math.max(MIN_SLIDE_MS, perSlide))
  }, [audioDuration, photos.length])

  // 슬라이드 진행 — 마지막 사진에서 멈춘다
  useEffect(() => {
    if (index >= photos.length - 1) return
    const timer = window.setTimeout(() => setIndex((i) => i + 1), slideMs)
    return () => window.clearTimeout(timer)
  }, [index, photos.length, slideMs])

  // 감상 중에는 뒤 화면 스크롤을 잠근다
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // 음성이 끝나면 여운을 잠깐 두고 편지로 돌아간다
  const handleEnded = () => {
    window.setTimeout(onClose, 1800)
  }

  const handleClose = () => {
    audioRef.current?.pause()
    onClose()
  }

  const handleTimeUpdate = () => {
    const el = audioRef.current
    if (el?.duration) setProgress(el.currentTime / el.duration)
  }

  const current = photos[index]

  return (
    <div className="capsule-show" role="dialog" aria-label="목소리 들으며 사진 보기">
      {photos.map((photo, i) => (
        <div
          key={photo.url}
          className={`capsule-show__slide ${i === index ? 'capsule-show__slide--active' : ''}`}
        >
          <div
            className="capsule-show__bg"
            style={{ backgroundImage: `url(${photo.url})` }}
            aria-hidden
          />
          <img
            src={photo.url}
            alt=""
            className={`capsule-show__img ${i === index ? KENBURNS[i % KENBURNS.length] : ''}`}
          />
        </div>
      ))}

      {/* 위아래 그라데이션 — 글자 가독성 */}
      <div className="capsule-show__scrim" />

      <audio
        ref={audioRef}
        src={audioUrl}
        autoPlay
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        className="hidden"
      />

      {/* 상단: 보낸 사람 + 닫기 */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
        <p className="text-[13px] font-bold text-white/85 drop-shadow">🎙️ {senderLine}</p>
        <button
          type="button"
          onClick={handleClose}
          aria-label="감상 끝내기"
          className="w-9 h-9 rounded-full bg-white/15 backdrop-blur text-white text-[15px] font-bold flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* 하단: 캡션 + 진행 바 */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-6 pb-[calc(env(safe-area-inset-bottom)+22px)]">
        {current?.caption && (
          <p
            key={current.url}
            className="capsule-show__caption text-center text-[15px] font-bold text-white leading-[1.7] break-keep drop-shadow mb-4"
          >
            {current.caption}
          </p>
        )}
        <div className="h-[3px] rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white/85 rounded-full"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default CapsuleSlideshow
