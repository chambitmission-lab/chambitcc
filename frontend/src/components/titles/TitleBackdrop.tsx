// 장착 칭호 → 프로필 커버 배너 일러스트 매핑 (코지-에픽 시리즈, 26종 전체).
// 이미지는 public/images/title-bg/<key>.webp — 새 칭호는 docs/title-bg-prompts.md 의
// 프롬프트로 이미지를 만들어 저장한 뒤 여기에 키를 추가
// (미등록 칭호는 배너 없이 기존 프로필 레이아웃 그대로)
import { useEquippedTitle } from '../../hooks/useTitles'

const TITLE_BG_KEYS = [
  // 시간
  'dawn_riser',
  'night_owl',
  'faithful_watchman',
  'unbroken_month',
  'day_and_night',
  'three_meals',
  'keep_sabbath',
  'attendance_king',
  'hundred_days',
  // 패턴
  'story_graduate',
  'moses_companion',
  'wisdom_king',
  'gospel_witness',
  'seen_the_end',
  'storm_reader',
  'plan_finisher',
  'plan_collector',
  'word_marathoner',
  'bible_conqueror',
  // 히든
  'returned_prodigal',
  'streak_breaker',
  'leviticus_survivor',
  'eutychus_escape',
  'obadiah_finder',
  'everest_climber',
  'living_legend',
] as const

const TITLE_BG: Record<string, string> = Object.fromEntries(
  TITLE_BG_KEYS.map((key) => [key, `/images/title-bg/${key}.webp`]),
)

/** 장착 칭호의 커버 배너 이미지 경로(없으면 undefined) */
export const useTitleBackdropSrc = (): string | undefined => {
  const { data: equipped } = useEquippedTitle()
  return equipped ? TITLE_BG[equipped.key] : undefined
}
