// 4단계 — 함께 넣을 것(선택). 사진은 폴라로이드, 목소리는 카세트 —
// 개봉 날 꺼내질 모습 그대로 고르게 한다. 오늘의 말씀·신앙 기록(P.S.)은 저절로 담긴다.
import type { RefObject } from 'react'
import type { CapsuleDraftPhoto } from '../../../types/timeCapsule'
import { Icon, MicGlyph, PhotoGlyph } from '../capsuleIcons'

// 폴라로이드가 아무렇게나 놓인 느낌 — 순서별 고정 기울기
const POLAROID_TILTS = ['-2.2deg', '2.4deg', '-1.4deg']

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const StepExtras = ({
  photos,
  maxPhotos,
  maxCaption,
  photoProcessing,
  photoInputRef,
  onPickPhotos,
  onRemovePhoto,
  onCaptionChange,
  recordingState,
  recordingTime,
  maxRecordSeconds,
  audioUrl,
  recordError,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  enclosures,
}: {
  photos: CapsuleDraftPhoto[]
  maxPhotos: number
  maxCaption: number
  photoProcessing: boolean
  photoInputRef: RefObject<HTMLInputElement | null>
  onPickPhotos: (files: FileList | null) => void
  onRemovePhoto: (index: number) => void
  onCaptionChange: (index: number, caption: string) => void
  recordingState: string
  recordingTime: number
  maxRecordSeconds: number
  audioUrl: string | null
  recordError: string | null
  onStartRecording: () => void
  onStopRecording: () => void
  onResetRecording: () => void
  /** 저절로 함께 봉인되는 것들 (말씀 P.S.·기도 등) */
  enclosures: string[]
}) => {
  const recording = recordingState === 'recording' || recordingState === 'paused'
  const photosFull = photos.length >= maxPhotos

  return (
    <>
      <h2 className="cw-title">함께 넣을 게 있나요?</h2>
      <p className="cw-sub">없어도 괜찮아요. 편지만으로도 충분해요</p>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onPickPhotos(e.target.files)}
      />

      <div className="cw-tiles">
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={photoProcessing || photosFull}
          className={`cw-tile cw-tile--center ${photos.length > 0 ? 'is-on' : ''}`}
        >
          <span className="cw-polaroid-mini" aria-hidden>
            <i>
              <Icon size={22}>
                <PhotoGlyph />
              </Icon>
            </i>
          </span>
          <b>{photoProcessing ? '사진 담는 중…' : photos.length > 0 ? '사진 더 끼우기' : '사진 끼우기'}</b>
          <span className="cw-dots" aria-label={`${photos.length} / ${maxPhotos}장`}>
            {Array.from({ length: maxPhotos }, (_, i) => (
              <i key={i} className={i < photos.length ? 'is-on' : ''} />
            ))}
          </span>
        </button>

        <button
          type="button"
          onClick={recording ? onStopRecording : audioUrl ? undefined : onStartRecording}
          disabled={!!audioUrl && !recording}
          className={`cw-tile cw-tile--center ${recording || audioUrl ? 'is-on' : ''} ${recording ? 'is-recording' : ''}`}
        >
          <span className="cw-cassette-mini" aria-hidden>
            <i />
            <i />
          </span>
          <b>{recording ? '녹음 마치기' : audioUrl ? '목소리 담김' : '목소리 남기기'}</b>
          <span>
            {recording
              ? `${formatSeconds(recordingTime)} / ${formatSeconds(maxRecordSeconds)}`
              : audioUrl
                ? formatSeconds(Math.min(recordingTime, maxRecordSeconds))
                : `${maxRecordSeconds / 60}분까지`}
          </span>
        </button>
      </div>

      {recordError && <p className="cw-note cw-note--error">{recordError}</p>}

      {recording && (
        <div className="cw-rec">
          <span className="cw-rec__dot" />
          <span className="cw-rec__time">{formatSeconds(recordingTime)}</span>
          <div className="cw-rec__bar">
            <i style={{ width: `${Math.min(100, (recordingTime / maxRecordSeconds) * 100)}%` }} />
          </div>
          <button type="button" onClick={onStopRecording} className="cw-btn cw-btn--sm">
            완료
          </button>
        </div>
      )}

      {audioUrl && !recording && (
        <div className="cw-voice">
          <span className="cw-voice__icon">
            <Icon size={18}>
              <MicGlyph />
            </Icon>
          </span>
          <audio controls src={audioUrl} className="flex-1 min-w-0" />
          <button type="button" onClick={onResetRecording} className="cw-voice__redo">
            다시 녹음
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div className="cw-photos">
          {photos.map((photo, i) => (
            <div
              key={photo.previewUrl}
              className="capsule-polaroid capsule-polaroid--developed cw-photos__item"
              style={{ transform: `rotate(${POLAROID_TILTS[i % POLAROID_TILTS.length]})` }}
            >
              <img src={photo.previewUrl} alt="" className="capsule-polaroid__img" />
              <input
                type="text"
                value={photo.caption}
                onChange={(e) => onCaptionChange(i, e.target.value)}
                maxLength={maxCaption}
                placeholder="한 줄 캡션"
                className="capsule-polaroid__caption-input"
                aria-label={`${i + 1}번째 사진 캡션`}
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(i)}
                aria-label="사진 빼기"
                className="cw-photos__remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {enclosures.length > 0 && (
        <div className="cw-enclose">
          <p className="cw-enclose__head">저절로 함께 담겨요</p>
          <ul>
            {enclosures.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default StepExtras
