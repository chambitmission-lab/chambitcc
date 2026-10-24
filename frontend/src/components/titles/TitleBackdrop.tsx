// 장착 칭호 → 프로필 커버 배너 일러스트 매핑 (코지-에픽 시리즈, 36종 전체).
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
  'companion_first_lamp',
  'companion_ten_lamps',
  'bible_conqueror',
  // 필사
  'typing_first',
  'typing_one_chapter',
  'typing_shepherd',
  'typing_hundred',
  'typing_ezra',
  'typing_swift_pen',
  'typing_lightning',
  'typing_heart_tablet',
  'typing_daily_line',
  'manna_first',
  'manna_canaan',
  'manna_omer',
  'manna_every_morning',
  'manna_crown',
  // 히든
  'returned_prodigal',
  'streak_breaker',
  'leviticus_survivor',
  'eutychus_escape',
  'obadiah_finder',
  'everest_climber',
  'typing_jot_and_tittle',
  'living_legend',
] as const

const TITLE_BG: Record<string, string> = Object.fromEntries(
  TITLE_BG_KEYS.map((key) => [key, `/images/title-bg/${key}.webp`]),
)

// 원본 구도가 천장에 붙은 그림은 자르는 기준점을 더 위로 올린다(기본 50% 25% 는 ProfileHeader.css).
// PC 는 5:2 로 납작하게 잘라 위아래가 함께 깎이는데, 창문 같은 윗부분이 잘리면 답답해 보임
const TITLE_BG_POSITION: Record<string, string> = {
  typing_jot_and_tittle: '50% 15%',
  typing_one_chapter: '50% 10%', // 치켜든 두루마리 윗끝이 원본 y≈72px
}

/** 이 칭호에 커버 배너가 등록돼 있는지 — 프로필 스켈레톤이 배너 자리를 미리 잡을 때 쓴다 */
export const hasTitleBackdrop = (key: string): boolean => key in TITLE_BG

// 이미 예열한 배너 — 같은 진입에서 힌트 키와 실제 응답 키가 같으면 두 번 만들지 않는다
const warmedBackdrops = new Set<string>()

/**
 * 커버 배너 이미지를 미리 받아 둔다(브라우저 캐시) — 프로필 선요청이 칭호 응답을 기다리지 않고
 * 지난 방문 힌트 키로 먼저, 응답이 오면 그 키로 한 번 더 부른다. 배너 없는 칭호·null 은 무시.
 */
export const warmTitleBackdrop = (key: string | null | undefined): void => {
  const src = key ? TITLE_BG[key] : undefined
  if (!src || warmedBackdrops.has(src) || typeof Image === 'undefined') return
  warmedBackdrops.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

/** 장착 칭호의 커버 배너 이미지 경로(없으면 undefined) */
export const useTitleBackdropSrc = (): string | undefined => {
  const { data: equipped } = useEquippedTitle()
  return equipped ? TITLE_BG[equipped.key] : undefined
}

/** 장착 칭호 배너의 object-position(기본값을 따르면 undefined) */
export const useTitleBackdropPosition = (): string | undefined => {
  const { data: equipped } = useEquippedTitle()
  return equipped ? TITLE_BG_POSITION[equipped.key] : undefined
}
