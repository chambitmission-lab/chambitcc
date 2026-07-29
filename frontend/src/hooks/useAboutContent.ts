// 소개 페이지 컨텐츠 훅 - React Query
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAboutContent,
  updateAboutContent,
  uploadAboutImage,
} from '../api/aboutContent'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../locales'
import { readAboutContentCache, writeAboutContentCache } from '../utils/aboutContentCache'
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
    // 지난 방문 응답을 즉시 렌더해 히어로 배경 요청이 API 왕복을 기다리지 않게 한다.
    // initialData 가 아니라 placeholderData 라 백그라운드 재검증은 그대로 수행된다.
    placeholderData: readAboutContentCache,
  })

  const content: AboutContent = query.data ?? { fields: {}, hero_background_url: null }

  // 실제 서버 응답만 캐시한다(placeholder 를 되쓰면 오래된 값이 계속 연장된다).
  const fetchedContent = query.isPlaceholderData ? undefined : query.data
  useEffect(() => {
    if (fetchedContent) writeAboutContentCache(fetchedContent)
  }, [fetchedContent])

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
      writeAboutContentCache(data) // 편집 직후 다음 진입이 옛 배경을 먼저 그리지 않도록
    },
  })
}

export const useUploadAboutImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadAboutImage(file),
  })
}
