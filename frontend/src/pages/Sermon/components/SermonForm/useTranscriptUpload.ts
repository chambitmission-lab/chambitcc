// 트랜스크립트 업로드 훅
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyzeTranscript } from '../../../../api/sermon'
import { showToast } from '../../../../utils/toast'
import { isAuthenticated, isAdmin } from '../../../../utils/auth'

export const useTranscriptUpload = (sermonId: number | null) => {
  const queryClient = useQueryClient()
  const [uploadResult, setUploadResult] = useState<{
    total_references: number
    references_saved: number
  } | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
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
      
      return analyzeTranscript(sermonId, file)
    },
    onSuccess: (data) => {
      setUploadResult({
        total_references: data.total_references,
        references_saved: data.references_saved,
      })
      showToast(
        `${data.references_saved}개의 성경 구절이 추출되었습니다`,
        'success'
      )
      
      // 성경 구절 목록 캐시 무효화하여 새로고침
      if (sermonId) {
        queryClient.invalidateQueries({ queryKey: ['sermon-bible-references', sermonId] })
        queryClient.invalidateQueries({ queryKey: ['sermon', sermonId] })
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

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      showToast('JSON 파일만 업로드할 수 있습니다', 'error')
      return
    }
    uploadMutation.mutate(file)
  }

  return {
    handleFileSelect,
    isUploading: uploadMutation.isPending,
    uploadResult,
  }
}
