// 트랜스크립트 업로드 훅
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyzeTranscript } from '../../../../api/sermon'
import { showToast } from '../../../../utils/toast'
import { isAuthenticated, isAdmin } from '../../../../utils/auth'

export const useTranscriptUpload = (
  sermonId: number | null,
  onSummaryGenerated?: (summary: string) => void
) => {
  const queryClient = useQueryClient()
  const [uploadResult, setUploadResult] = useState<{
    total_references: number
    references_saved: number
    summary_generated?: boolean
  } | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async ({ file, autoGenerateSummary }: { file: File; autoGenerateSummary: boolean }) => {
      // 인증 확인
      if (!isAuthenticated()) {
        throw new Error('로그인이 필요합니다')
      }
      
      // 관리자 권한 확인
      if (!isAdmin()) {
        throw new Error('관리자 권한이 필요합니다')
      }
      
      if (!sermonId) {
        throw new Error('설교 ID가 없습니다')
      }
      
      return analyzeTranscript(sermonId, file, autoGenerateSummary)
    },
    onSuccess: (data) => {
      setUploadResult({
        total_references: data.total_references,
        references_saved: data.references_saved,
        summary_generated: data.summary_generated,
      })
      
      let message = `${data.references_saved}개의 성경 구절이 추출되었습니다`
      if (data.summary_generated) {
        message += '\n설교 내용이 자동으로 생성되었습니다'
        
        // 생성된 요약을 콜백으로 전달
        if (onSummaryGenerated && data.summary) {
          onSummaryGenerated(data.summary)
        }
      }
      
      showToast(message, 'success')
      
      // 성경 구절 목록 및 설교 상세 캐시 무효화하여 새로고침
      if (sermonId) {
        queryClient.invalidateQueries({ queryKey: ['sermon-bible-references', sermonId] })
        queryClient.invalidateQueries({ queryKey: ['sermon', sermonId] })
        queryClient.invalidateQueries({ queryKey: ['sermons'] })
      }
    },
    onError: (error: Error) => {
      let errorMessage = error.message || '트랜스크립트 분석에 실패했습니다'
      
      // 401 오류 처리
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.'
      }
      // 403 오류 처리
      else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = '관리자 권한이 필요합니다.'
      }
      
      showToast(errorMessage, 'error')
    },
  })

  const handleFileSelect = (file: File, autoGenerateSummary: boolean = true) => {
    if (!file.name.endsWith('.json')) {
      showToast('JSON 파일만 업로드할 수 있습니다', 'error')
      return
    }
    uploadMutation.mutate({ file, autoGenerateSummary })
  }

  return {
    handleFileSelect,
    isUploading: uploadMutation.isPending,
    uploadResult,
  }
}
