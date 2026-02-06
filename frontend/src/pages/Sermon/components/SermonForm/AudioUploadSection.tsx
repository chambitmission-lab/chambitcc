// 오디오 업로드 섹션 컴포넌트
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

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        음성 파일
      </label>
      {audioState.file ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              선택된 파일: {audioState.file.name}
            </p>
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <span className="material-icons-outlined">delete</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRecordingStart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
          >
            <span className="material-icons-outlined">mic</span>
            녹음하기
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
            <span className="material-icons-outlined">upload_file</span>
            파일 선택
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  )
}
