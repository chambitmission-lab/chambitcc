// 장 본문(chapterData)에서 바로 계산되는 색인 — 서버 왕복 없이 chapterData 만 보고 만든다.
// 병합 구간(신 6:18-19 등)은 화면엔 첫 절 하나만 그리므로 "묶음 전체 id"와
// "자리표시자 → 첫 절" 두 방향 색인이 필요하고, 해석 패널은 절 번호 → 본문 맵을 쓴다.
import { useMemo } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../types/bible'

export interface ChapterVerseIndex {
  /** 로드된 절 전부 (병합 자리표시자 포함, 페이지 순) */
  allVerses: BibleVerse[]
  /** 병합 묶음 첫 절 id → 함께 읽음 처리할 절 id 전부 (숨은 절 포함) */
  mergedMemberIds: Map<number, number[]>
  /** 병합 자리표시자 절 번호 → 첫 절 번호 (딥링크·배너가 옮겨 잡는다) */
  mergedAnchorByVerse: Map<number, number>
  /** 절 번호 → 본문. 자리표시자는 묶음 첫 절의 본문으로 채워 둔다 */
  verseTextMap: Map<number, string>
  bookNameKo: string
  /** 장 전체 절 수 (서버 값). 본문이 아직 없으면 undefined */
  chapterTotalVerses: number | undefined
  /** 절 번호로 절 찾기 — 자리표시자를 가리키면 묶음 첫 절을 돌려준다 */
  findVerse: (verseNo: number) => BibleVerse | undefined
  /** 자리표시자 절 번호면 첫 절 번호로, 아니면 그대로 */
  anchorVerse: (verseNo: number) => number
}

export const useChapterVerseIndex = (
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined,
): ChapterVerseIndex =>
  useMemo(() => {
    const allVerses = chapterData?.pages.flatMap((page) => page.verses) ?? []
    const idByVerse = new Map(allVerses.map((v) => [v.verse, v.id]))
    const mergedMemberIds = new Map<number, number[]>()
    const mergedAnchorByVerse = new Map<number, number>()
    const verseTextMap = new Map<number, string>()
    for (const v of allVerses) {
      verseTextMap.set(v.verse, v.text)
      if (v.merged_into) mergedAnchorByVerse.set(v.verse, v.merged_into)
      const members = v.merged_verses
      if (members?.length && v.verse === members[0]) {
        mergedMemberIds.set(
          v.id,
          members.map((n) => idByVerse.get(n)).filter((id): id is number => id != null),
        )
      }
    }
    // 병합 자리표시자는 본문이 비어 있다 — 묶음 첫 절의 본문으로 대신 채운다
    // (19절에 달린 해석을 열어도 말씀이 빈칸으로 뜨지 않게)
    for (const v of allVerses) {
      if (v.merged_into) verseTextMap.set(v.verse, verseTextMap.get(v.merged_into) ?? '')
    }
    const anchorVerse = (verseNo: number) => mergedAnchorByVerse.get(verseNo) ?? verseNo
    const findVerse = (verseNo: number) => {
      const target = anchorVerse(verseNo)
      return allVerses.find((v) => v.verse === target)
    }
    return {
      allVerses,
      mergedMemberIds,
      mergedAnchorByVerse,
      verseTextMap,
      bookNameKo: chapterData?.pages[0]?.book_name_ko ?? '',
      chapterTotalVerses: chapterData?.pages[0]?.total_verses,
      findVerse,
      anchorVerse,
    }
  }, [chapterData])
