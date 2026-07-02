import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSituationCategories,
  getSituationVerses,
  getAllSituationCategories,
  createSituationCategory,
  updateSituationCategory,
  deleteSituationCategory,
  addSituationVerse,
  removeSituationVerse,
  seedSituations,
} from '../api/situation'

export const situationKeys = {
  all: ['situations'] as const,
  categories: () => [...situationKeys.all, 'categories'] as const,
  adminCategories: () => [...situationKeys.all, 'admin'] as const,
  verses: (id: number) => [...situationKeys.all, 'verses', id] as const,
}

export const useSituationCategories = () =>
  useQuery({
    queryKey: situationKeys.categories(),
    queryFn: getSituationCategories,
    staleTime: 1000 * 60 * 10,
  })

export const useSituationVerses = (categoryId: number, enabled = true) =>
  useQuery({
    queryKey: situationKeys.verses(categoryId),
    queryFn: () => getSituationVerses(categoryId),
    enabled: enabled && categoryId > 0,
    staleTime: 1000 * 60 * 10,
  })

// ── Admin ─────────────────────────────────────────────────────────────

export const useAdminSituationCategories = () =>
  useQuery({
    queryKey: situationKeys.adminCategories(),
    queryFn: getAllSituationCategories,
    staleTime: 0,
  })

export const useCreateSituationCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSituationCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}

export const useUpdateSituationCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateSituationCategory>[1] }) =>
      updateSituationCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}

export const useDeleteSituationCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSituationCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}

export const useAddSituationVerse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: Parameters<typeof addSituationVerse>[1] }) =>
      addSituationVerse(categoryId, data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: situationKeys.verses(vars.categoryId) }),
  })
}

export const useRemoveSituationVerse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ situationVerseId }: { situationVerseId: number; categoryId: number }) =>
      removeSituationVerse(situationVerseId),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: situationKeys.verses(vars.categoryId) }),
  })
}

export const useSeedSituations = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: seedSituations,
    onSuccess: () => qc.invalidateQueries({ queryKey: situationKeys.all }),
  })
}
