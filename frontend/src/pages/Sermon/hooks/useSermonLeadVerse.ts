import { useQuery } from '@tanstack/react-query'
import { getBibleVerse } from '../../../api/bible'
import type { ParsedReference } from '../utils/sermonMeta'

// 설교 성구의 첫 절 인용 — 목록 히어로·상세·등록 폼 미리보기가 같은 쿼리를 쓴다.
// 예전엔 세 곳이 같은 queryKey 를 각자 선언해 staleTime 이 제각각(Infinity / 기본 5분)이었다.
// 같은 키는 캐시 한 칸을 공유하므로 옵션이 어긋나면 어느 화면이 먼저 관찰하느냐에 따라
// 재요청 여부가 달라졌다. 성경 본문은 바뀌지 않으니 한 곳에서 Infinity 로 고정한다.
export const sermonLeadVerseKey = (parsed: ParsedReference | null) =>
  ['sermon-hero-verse', parsed?.bookNumber, parsed?.chapter, parsed?.verse ?? 1] as const

export const useSermonLeadVerse = (parsed: ParsedReference | null, options?: { retry?: number }) =>
  useQuery({
    queryKey: sermonLeadVerseKey(parsed),
    queryFn: () => getBibleVerse(parsed!.bookNumber!, parsed!.chapter, parsed!.verse ?? 1),
    // 책 이름을 못 알아들으면(bookNumber null) 요청 없이 곧장 미확인 상태
    enabled: parsed?.bookNumber != null,
    staleTime: Infinity,
    retry: options?.retry ?? 1,
  })
