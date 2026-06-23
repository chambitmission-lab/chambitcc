import { useEffect, useRef, useState } from 'react'
import { useBibleChapterAudio } from '../../../hooks/useBible'
import type { BibleTTSVoice } from '../../../types/bible'

interface BibleAudioPlayerProps {
  bookNumber: number
  chapter: number
}

const VOICE_STORAGE_KEY = 'bible-tts-voice'
const RATE_STORAGE_KEY = 'bible-tts-rate'
const RATE_OPTIONS = [0.75, 1, 1.25, 1.5]

const loadVoice = (): BibleTTSVoice => {
  const v = localStorage.getItem(VOICE_STORAGE_KEY)
  return v === 'male' ? 'male' : 'female'
}

const loadRate = (): number => {
  const r = Number(localStorage.getItem(RATE_STORAGE_KEY))
  return RATE_OPTIONS.includes(r) ? r : 1
}

const formatTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 성경 한 장을 오디오북처럼 들려주는 플레이어.
 * - 재생 버튼을 누른 시점에만 백엔드 TTS를 요청(지연 로딩)
 * - 한 번 받은 mp3 URL은 React Query(staleTime: Infinity)로 캐시되어 즉시 재생
 * - 음성(여성/남성)·배속은 localStorage에 기억
 *
 * 부모에서 key={`${bookNumber}-${chapter}`} 로 렌더하므로, 장이 바뀌면
 * 컴포넌트가 새로 마운트되어 상태가 초기화되고 이전 재생은 정리된다.
 */
const BibleAudioPlayer = ({ bookNumber, chapter }: BibleAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const wantPlayRef = useRef(false) // URL 로드 완료 시 자동 재생할지

  const [voice, setVoice] = useState<BibleTTSVoice>(loadVoice)
  const [rate, setRate] = useState<number>(loadRate)
  const [started, setStarted] = useState(false) // 첫 재생 이후에만 TTS 요청
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const { data, isFetching, isError } = useBibleChapterAudio(bookNumber, chapter, voice, started)
  const audioUrl = data?.audio_url

  // URL이 준비되면 배속을 적용하고, 대기 중이던 재생 요청을 실행
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.playbackRate = rate
    if (wantPlayRef.current) {
      wantPlayRef.current = false
      // iOS Safari 등에서 비동기 fetch 후 play()가 거부될 수 있음 →
      // 사용자가 한 번 더 누르면 그때는 URL이 캐시돼 동기 재생으로 성공한다.
      audio.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // 언마운트 시(장 이동 등) 재생 정지
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [])

  const requestPlay = () => {
    const audio = audioRef.current
    if (audioUrl && audio) {
      audio.play().catch(() => {})
      return
    }
    // 아직 URL이 없으면 → TTS 요청을 켜고, 로드되면 자동 재생
    wantPlayRef.current = true
    setStarted(true)
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      requestPlay()
    }
  }

  const handleVoiceChange = (v: BibleTTSVoice) => {
    if (v === voice) return
    const wasPlaying = isPlaying
    audioRef.current?.pause()
    setVoice(v)
    localStorage.setItem(VOICE_STORAGE_KEY, v)
    // 이미 듣고 있었다면 새 음성으로 이어서 재생
    if (started) wantPlayRef.current = wasPlaying
  }

  const cycleRate = () => {
    const idx = RATE_OPTIONS.indexOf(rate)
    const next = RATE_OPTIONS[(idx + 1) % RATE_OPTIONS.length]
    setRate(next)
    localStorage.setItem(RATE_STORAGE_KEY, String(next))
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    setCurrentTime(t)
    if (audioRef.current) audioRef.current.currentTime = t
  }

  const loading = isFetching && !audioUrl

  return (
    <div className="mx-3 my-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-card-dark px-3 py-2.5">
      <div className="flex items-center gap-3">
        {/* 재생 / 일시정지 */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={loading}
          aria-label={isPlaying ? '일시정지' : '재생'}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <span className="material-icons-round animate-spin text-[22px]">progress_activity</span>
          ) : (
            <span className="material-icons-round text-[26px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          )}
        </button>

        {/* 진행 바 + 시간 */}
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!duration}
            aria-label="재생 위치"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-light dark:bg-border-dark accent-primary disabled:opacity-50"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="material-icons-round text-[14px]">headphones</span>
              {loading ? '음성 준비 중…' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
            <button
              type="button"
              onClick={cycleRate}
              className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-background-dark dark:text-gray-300"
            >
              {rate}×
            </button>
          </div>
        </div>
      </div>

      {/* 음성 선택 + 안내 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="inline-flex overflow-hidden rounded-full border border-border-light dark:border-border-dark text-xs">
          {(['female', 'male'] as BibleTTSVoice[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleVoiceChange(v)}
              className={`px-3 py-1 font-medium transition ${
                voice === v
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {v === 'female' ? '여성' : '남성'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-gray-400">
          {isError ? '오디오를 불러오지 못했어요' : loading ? '처음 재생은 조금 걸려요' : '오디오북'}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          e.currentTarget.playbackRate = rate
        }}
      />
    </div>
  )
}

export default BibleAudioPlayer
