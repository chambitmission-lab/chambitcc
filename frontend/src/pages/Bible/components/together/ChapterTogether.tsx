// 함께 읽기 화면 조각 — 장 상단 "함께" 캡션, 방금 남긴 묵상 배너(fixed), 절 묵상 시트(portal).
// 숫자 계산은 useChapterTogether 가 하고 여기는 그리기만 한다. 캡션은 본문 흐름 안(상단)에
// 놓이고 배너·시트는 화면에 고정이라 이 컴포넌트를 본문 맨 위에 두면 셋 다 제자리다.
import type { BibleVerse } from '../../../../types/bible'
import { lazyModal } from '../../../../utils/lazyModal'
import type { ChapterTogetherState } from '../../hooks/useChapterTogether'
import ChapterPresencePill from './ChapterPresencePill'
import ReflectionLiveBanner from './ReflectionLiveBanner'
const VerseReflectionSheet = lazyModal(() => import('./VerseReflectionSheet'))

interface ChapterTogetherProps {
  bookNumber: number
  chapter: number
  bookNameKo: string
  together: ChapterTogetherState
  /** 절 번호 → 절 (병합 자리표시자는 묶음 첫 절로). 배너가 탭한 절의 시트를 열 때 */
  findVerse: (verseNo: number) => BibleVerse | undefined
  /** 묵상 시트에 띄울 절 — 절 칩·액션 메뉴·배너가 모두 이 하나를 연다. null 이면 닫힘 */
  reflectionTarget: BibleVerse | null
  onReflectionTargetChange: (verse: BibleVerse | null) => void
}

const ChapterTogether = ({
  bookNumber,
  chapter,
  bookNameKo,
  together,
  findVerse,
  reflectionTarget,
  onReflectionTargetChange,
}: ChapterTogetherProps) => (
  <>
    {/* 지금 이 장을 함께 읽는 성도 / 오늘 읽은 성도 */}
    <ChapterPresencePill
      loading={together.loading}
      total={together.total}
      readersToday={together.readersToday}
      meReadToday={together.meReadToday}
      meCounted={together.meCounted}
      mePending={together.mePending}
    />

    {/* 같은 장을 읽는 성도가 방금 남긴 묵상 배너 (탭하면 그 절의 시트) */}
    <ReflectionLiveBanner
      bookNumber={bookNumber}
      chapter={chapter}
      bookNameKo={bookNameKo}
      onOpen={(verseNo) => {
        const found = findVerse(verseNo)
        if (found) onReflectionTargetChange(found)
      }}
    />

    {/* 절 묵상 나눔 시트 (목록에 하나) */}
    {reflectionTarget && (
      <VerseReflectionSheet
        verseId={reflectionTarget.id}
        bookNumber={bookNumber}
        chapter={chapter}
        verse={reflectionTarget.verse}
        verseReference={`${bookNameKo} ${chapter}:${reflectionTarget.verse}`}
        verseText={reflectionTarget.text}
        chapterOthers={together.chapterOthers}
        meCounted={together.meCounted}
        onClose={() => onReflectionTargetChange(null)}
      />
    )}
  </>
)

export default ChapterTogether
