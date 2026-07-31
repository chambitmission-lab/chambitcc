// 트랜스크립트 업로드 섹션 컴포넌트 — AI 성경 구절 추출·요약 생성
import { useRef, useState } from 'react'
import { isAdmin } from '../../../../utils/auth'

interface TranscriptUploadSectionProps {
  sermonId: number | null
  onFileSelect: (file: File, autoGenerateSummary: boolean) => void
  isUploading: boolean
  uploadResult: {
    total_references: number
    references_saved: number
    summary_generated?: boolean
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
  const [autoGenerateSummary, setAutoGenerateSummary] = useState(true)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file, autoGenerateSummary)
    }
  }

  // 관리자가 아니면 섹션 자체를 표시하지 않음
  if (!adminUser) {
    return null
  }

  return (
    <div className="sf-section">
      <h3 className="sf-section-title">
        <span className="material-icons-outlined">description</span>
        트랜스크립트 업로드
      </h3>

      <p className="sf-hint" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
        {sermonId
          ? '설교 트랜스크립트 JSON 파일을 업로드하면 자동으로 성경 구절을 추출합니다.'
          : '설교를 먼저 등록한 후 트랜스크립트를 업로드할 수 있습니다.'}
      </p>

      {/* 자동 요약 생성 옵션 */}
      {sermonId && (
        <div className="sf-checkbox-row">
          <input
            type="checkbox"
            id="auto-summary"
            checked={autoGenerateSummary}
            onChange={(e) => setAutoGenerateSummary(e.target.checked)}
          />
          <label htmlFor="auto-summary">설교 내용 자동 생성 (트랜스크립트에서 요약 추출)</label>
        </div>
      )}

      {uploadResult && (
        <div className="sf-transcript-result">
          ✓ {uploadResult.references_saved}개의 성경 구절이 추출되었습니다
          {uploadResult.summary_generated && (
            <div>✓ 설교 내용이 자동으로 생성되었습니다</div>
          )}
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
        onClick={() => fileInputRef.current?.click()}
        disabled={!sermonId || isUploading}
        className="sf-transcript-btn"
      >
        {isUploading ? (
          <>
            <span className="material-icons-outlined animate-spin">refresh</span>
            <span>분석 중...</span>
          </>
        ) : (
          <>
            <span className="material-icons-outlined">upload_file</span>
            <span>JSON 파일 선택</span>
          </>
        )}
      </button>
    </div>
  )
}
