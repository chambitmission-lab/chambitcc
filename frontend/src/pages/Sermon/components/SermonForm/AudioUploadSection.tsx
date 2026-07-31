// 오디오 업로드 섹션 컴포넌트 — 부모 섹션 카드 안에서 버튼/파일 상태만 렌더
import type { AudioUploadState } from './types'

interface AudioUploadSectionProps {
  audioState: AudioUploadState
  onRecordingStart: () => void
  onFileSelect: (file: File) => void
  onRemove: () => void
}

export const AudioUploadSection = ({
  audioState,
  onRecordingStart,
  onFileSelect,
  onRemove,
}: AudioUploadSectionProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  // 중복 클릭 방지
  const handleRecordingClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onRecordingStart()
  }

  if (audioState.file) {
    return (
      <div className="sf-audio-file">
        <span className="material-icons-outlined sf-audio-file-icon">graphic_eq</span>
        <span className="sf-audio-file-name">{audioState.file.name}</span>
        <button type="button" onClick={onRemove} className="sf-audio-file-remove" aria-label="음성 파일 제거">
          <span className="material-icons-outlined">delete</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="sf-audio-actions">
        <button type="button" onClick={handleRecordingClick} className="sf-audio-btn record">
          <span className="material-icons-outlined">mic</span>
          녹음하기
        </button>
        <label className="sf-audio-btn upload">
          <span className="material-icons-outlined">upload_file</span>
          파일 선택
          <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
      <p className="sf-hint">녹음하거나 음성 파일을 올리면 목록·상세에서 바로 들을 수 있습니다</p>
    </>
  )
}
