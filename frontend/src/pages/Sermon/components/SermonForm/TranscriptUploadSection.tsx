// 트랜스크립트 업로드 섹션 컴포넌트
import { useRef } from 'react'
import { isAdmin } from '../../../../utils/auth'

interface TranscriptUploadSectionProps {
  sermonId: number | null
  onFileSelect: (file: File) => void
  isUploading: boolean
  uploadResult: {
    total_references: number
    references_saved: number
  } | null
}

export const TranscriptUploadSection = ({
  sermonId,
  onFileSelect,
  isUploading,
  uploadResult,
}: TranscriptUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const adminUser = isAdmin()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleButtonClick = () => {
    if (!adminUser) {
      alert('관리자만 트랜스크립트를 업로드할 수 있습니다.')
      return
    }
    fileInputRef.current?.click()
  }

  // 관리자가 아니면 섹션 자체를 표시하지 않음
  if (!adminUser) {
    return null
  }

  return (
    <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
          <span className="material-icons-outlined text-white text-xl">description</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            트랜스크립트 업로드
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {sermonId 
              ? '설교 트랜스크립트 JSON 파일을 업로드하면 자동으로 성경 구절을 추출합니다.'
              : '설교를 먼저 등록한 후 트랜스크립트를 업로드할 수 있습니다.'}
          </p>

          {uploadResult && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <span className="material-icons-outlined text-sm">check_circle</span>
                <span className="text-xs font-medium">
                  {uploadResult.references_saved}개의 성경 구절이 추출되었습니다
                </span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            disabled={!sermonId || isUploading}
          />

          <button
            type="button"
            onClick={handleButtonClick}
            disabled={!sermonId || isUploading}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <span className="material-icons-outlined text-sm animate-spin">refresh</span>
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-sm">upload_file</span>
                <span>JSON 파일 선택</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
