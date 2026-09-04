/**
 * 신앙 여정·주간 스토리 카드용 아이콘 (Phosphor Icons Duotone).
 *
 * 프로필의 세 카드(요즘 나의 걸음 · 나의 신앙 여정 · 이번 주 스토리)가 쓰던
 * 컬러 이모지(🙏 💛 🔥 🌱 …)를 걷어낸 자리. 이모지는 OS/폰트마다 생김새와
 * 채도가 달라 카드 톤이 기기별로 흔들리고, 칩·링의 색 액센트와 따로 놀았다.
 * (같은 문법: EmotionIcons · ThanksIcons)
 *
 * 색은 currentColor를 따르므로 부모의 text-* 클래스가 그대로 먹는다.
 */
import type { CSSProperties, ReactElement } from 'react'
import {
  Bird,
  BookOpen,
  BookOpenText,
  Books,
  Cactus,
  CalendarCheck,
  CalendarHeart,
  ChatCircleDots,
  Flame,
  GameController,
  HandHeart,
  Handshake,
  HandsPraying,
  Mountains,
  MusicNotes,
  NotePencil,
  PersonSimpleWalk,
  Plant,
  Quotes,
  Sparkle,
  SunHorizon,
  Timer,
  Trophy,
  UsersThree,
  type Icon,
} from './phosphor'
import type { JourneyStageKey, TimelineDomain, TimelineEvent } from '../../types/growth'
import { EmotionGlyph } from '../../pages/Home/components/EmotionIcons'
import { MeditationEmotionGlyph } from '../../pages/Bible/Meditation/MeditationIcons'
import { ThanksIcon } from './ThanksIcons'
import type { ThanksEmotion } from '../../types/thanks'

export type GrowthIconProps = {
  size?: number
  className?: string
  style?: CSSProperties
}

const duotone =
  (Base: Icon) =>
  ({ size = 16, className, style }: GrowthIconProps) => (
    <Base
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 요즘 나의 걸음 칩 */
export const AnsweredIcon = duotone(Sparkle) // 응답된 기도
export const IntercessionIcon = duotone(HandsPraying) // 함께한 기도
export const ThanksRecordIcon = duotone(HandHeart) // 감사 기록

/** 신앙 여정 카드 */
export const StreakFlameIcon = duotone(Flame) // 연속 기록
export const SproutIcon = duotone(Plant) // 성장 링 가운데 새싹

/** 하루의 대표 활동 → 아이콘 (주간 스토리 트레이). 백엔드 icon 이모지 대체 */
const DOMAIN_ICONS: Record<TimelineDomain, (p: GrowthIconProps) => ReactElement> = {
  prayer: duotone(HandsPraying),
  bible: duotone(BookOpenText),
  devotional: duotone(NotePencil),
  thanks: duotone(HandHeart),
  community: duotone(UsersThree),
  game: duotone(GameController),
}

/** 도메인이 비면(집계 전 등) null — 호출부가 점(·) 등으로 대체한다 */
export const DomainGlyph = ({
  domain,
  size = 16,
  className,
  style,
}: GrowthIconProps & { domain: TimelineDomain | undefined }) => {
  if (!domain) return null
  const Glyph = DOMAIN_ICONS[domain]
  if (!Glyph) return null
  return <Glyph size={size} className={className} style={style} />
}

/* =========================================================================
   /growth (신앙 여정) 화면 — 백엔드가 내려주는 icon 이모지를 쓰지 않고
   key/type/domain 으로 아이콘을 고른다. 백엔드를 건드리지 않고도 화면에서
   이모지를 걷어낼 수 있고, 색이 currentColor 라 카드 액센트와 맞아떨어진다.
   ========================================================================= */

export type GrowthGlyphName =
  | 'prayer'
  | 'intercession'
  | 'answered'
  | 'verses'
  | 'note'
  | 'thanks'
  | 'sprout'
  | 'flame'
  | 'trophy'
  | 'days'
  | 'books'
  | 'game'
  | 'session'
  | 'plan'
  | 'post'
  | 'quote'
  | 'book'

const GROWTH_GLYPHS: Record<GrowthGlyphName, (p: GrowthIconProps) => ReactElement> = {
  prayer: duotone(HandsPraying), // 기도 (🙏)
  intercession: duotone(Handshake), // 함께 기도 (🤝)
  answered: duotone(Sparkle), // 응답 (✨)
  verses: duotone(BookOpenText), // 읽은 절 (📖)
  note: duotone(NotePencil), // 묵상 노트 (📝)
  thanks: duotone(HandHeart), // 감사 (🌸)
  sprout: duotone(Plant), // 여정의 싹 (🌱)
  flame: duotone(Flame), // 연속 활동 (🔥)
  trophy: duotone(Trophy), // 최장 연속 (🏆)
  days: duotone(CalendarHeart), // 함께한 날 (📅)
  books: duotone(Books), // 완독한 책 (📚)
  game: duotone(GameController), // 게임 (🎲)
  session: duotone(Timer), // 집중 기도 — 촛불 대신 스톱워치(하단 도크와 같은 은유)
  plan: duotone(CalendarCheck), // 통독 플랜 (📅)
  post: duotone(ChatCircleDots), // 나눔 글 (💬)
  quote: duotone(Quotes), // 마음 신호 (💭)
  book: duotone(BookOpen), // 읽기 동선의 책 (📖)
}

/** 이름으로 고르는 여정 아이콘. 통계 셀·칩·섹션 어디서나 같은 이름을 쓴다. */
export const GrowthGlyph = ({
  name,
  size = 16,
  className,
  style,
}: GrowthIconProps & { name: GrowthGlyphName }) => {
  const Glyph = GROWTH_GLYPHS[name]
  if (!Glyph) return null
  return <Glyph size={size} className={className} style={style} />
}

/** 이번 달 vs 지난 달 행 (MonthDelta.key) → 아이콘 */
export const DELTA_GLYPH: Record<string, GrowthGlyphName> = {
  prayers: 'prayer',
  intercessions: 'intercession',
  verses_read: 'verses',
  thanks: 'thanks',
  meditations: 'sprout',
}

/** 여정의 이정표 칩 (GrowthMilestone.key) → 아이콘 */
export const MILESTONE_GLYPH: Record<string, GrowthGlyphName> = {
  days: 'days',
  best_streak: 'flame',
  books: 'books',
  answered: 'answered',
  prayers: 'prayer',
}

/** 말씀 여정 단계(stage_key) → 아이콘. 백엔드 stage_icon 이모지 대체 */
const STAGE_GLYPHS: Record<JourneyStageKey, (p: GrowthIconProps) => ReactElement> = {
  calling: duotone(Bird), // 부르심 (🕊️)
  galilee: duotone(Sparkle), // 갈릴리 (✨)
  origin: duotone(SunHorizon), // 시작 (🌅)
  sinai: duotone(Mountains), // 시내산 (⛰️)
  wilderness: duotone(Cactus), // 광야 (🏜️)
  canaan: duotone(Plant), // 가나안 (🌾)
  zion: duotone(MusicNotes), // 시온 (🎶)
  pilgrim: duotone(PersonSimpleWalk), // 순례 (🚶)
}

export const JourneyStageGlyph = ({
  stage,
  size = 26,
  className,
  style,
}: GrowthIconProps & { stage: JourneyStageKey }) => {
  const Glyph = STAGE_GLYPHS[stage] ?? STAGE_GLYPHS.pilgrim
  return <Glyph size={size} className={className} style={style} />
}

/**
 * 활동 기록 한 줄의 아이콘.
 * 기도·묵상·감사는 그때의 감정에 따라 아이콘이 달라지던 값이라, 백엔드 이모지 대신
 * 이미 있는 감정 아이콘 세트(EmotionIcons · MeditationIcons · ThanksIcons)로 넘긴다.
 * 감정이 비어 있으면 활동 종류의 기본 아이콘으로 떨어진다.
 */
const TYPE_GLYPH: Record<string, GrowthGlyphName> = {
  prayer: 'prayer',
  answered: 'answered',
  session: 'session',
  read: 'verses',
  note: 'note',
  meditation: 'sprout',
  thanks: 'thanks',
  plan: 'plan',
  game: 'game',
  post: 'post',
  intercession: 'intercession',
}

export const TimelineEventGlyph = ({
  event,
  size = 15,
  className,
  style,
}: GrowthIconProps & { event: TimelineEvent }) => {
  const emotion = typeof event.meta?.emotion === 'string' ? event.meta.emotion : ''

  if (emotion) {
    if (event.type === 'prayer') {
      return <EmotionGlyph emotion={emotion} size={size} className={className} style={style} />
    }
    if (event.type === 'meditation') {
      return (
        <MeditationEmotionGlyph
          emotion={emotion as Parameters<typeof MeditationEmotionGlyph>[0]['emotion']}
          size={size}
          className={className}
          style={style}
        />
      )
    }
    if (event.type === 'thanks') {
      return (
        <ThanksIcon
          name={emotion as ThanksEmotion}
          size={size}
          className={className}
          style={style}
        />
      )
    }
  }

  return (
    <GrowthGlyph
      name={TYPE_GLYPH[event.type] ?? 'sprout'}
      size={size}
      className={className}
      style={style}
    />
  )
}
