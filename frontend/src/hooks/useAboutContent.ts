// 소개 페이지 컨텐츠 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAboutContent,
  updateAboutContent,
  uploadAboutImage,
} from '../api/aboutContent'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../locales'
import type {
  AboutContent,
  AboutFieldKey,
  UpdateAboutContentRequest,
} from '../types/aboutContent'

const aboutContentKeys = {
  all: ['about-content'] as const,
}

export const useAboutContent = () => {
  const { language, t } = useLanguage()

  const query = useQuery({
    queryKey: aboutContentKeys.all,
    queryFn: getAboutContent,
    staleTime: 1000 * 60 * 5,
  })

  const content: AboutContent = query.data ?? { fields: {}, hero_background_url: null }

  // DB 우선, 없으면 i18n 기본값
  const tx = (key: AboutFieldKey): string => {
    const stored = content.fields[key]
    if (stored) {
      const value = stored[language]
      if (value && value.trim().length > 0) return value
      // 현재 언어 값이 비어있으면 다른 언어라도 시도 → 그래도 없으면 기본값
      const fallback = stored.ko || stored.en
      if (fallback && fallback.trim().length > 0) return fallback
    }
    return t(key)
  }

  // 편집 모달에서 두 언어 값을 모두 표시하기 위한 헬퍼
  const getRawValue = (key: AboutFieldKey, lang: 'ko' | 'en'): string => {
    const stored = content.fields[key]
    if (stored && stored[lang]) return stored[lang]
    const value = translations[lang][key]
    return typeof value === 'string' ? value : ''
  }

  return {
    content,
    heroBackgroundUrl: content.hero_background_url ?? null,
    tx,
    getRawValue,
    isLoading: query.isLoading,
  }
}

export const useUpdateAboutContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAboutContentRequest) => updateAboutContent(data),
    onSuccess: (data) => {
      queryClient.setQueryData(aboutContentKeys.all, data)
    },
  })
}

export const useUploadAboutImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadAboutImage(file),
  })
}
