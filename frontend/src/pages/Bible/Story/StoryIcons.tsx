/**
 * 처음 만나는 성경(스토리 모드) 아이콘 — Phosphor Icons Duotone.
 * 10막 42화 데이터(data/act01~10.ts)의 이모지는 집필하기 쉬운 형태로 그대로 두고,
 * <StoryGlyph emoji="🌍" /> 가 렌더 시점에 앱 아이콘 결(Phosphor duotone)로 바꿔 그린다.
 * 매핑에 없는 이모지는 원래 글자를 그대로 출력해 깨지지 않는다. (같은 방식: PlanGlyph · EduGlyph · HistoryGlyph)
 *
 * 색은 currentColor 를 따르므로 감싸는 요소의 color 로 잉크를 정한다.
 * Phosphor 에 없는 소재는 화의 제목 뜻으로 바꿔 골랐다 — 🎺 확성기, 🐑 돋보기(잃어버린 것을 찾아서),
 * 🕯️ 음표(낯선 땅의 노래), 🤼 던지는 사람(씨름), 🍎 잎 달린 열매.
 */
import type { CSSProperties, ReactElement } from 'react'
import {
  Bank,
  Bird,
  BookOpen,
  Bread,
  Broadcast,
  Cactus,
  CastleTurret,
  Confetti,
  Cross,
  CrownSimple,
  Crown,
  DoorOpen,
  EnvelopeSimple,
  FishSimple,
  Flame,
  GlobeHemisphereEast,
  Grains,
  HeartBreak,
  Horse,
  Lightning,
  MagnifyingGlass,
  Megaphone,
  MoonStars,
  Mountains,
  MusicNote,
  Orange,
  Path,
  PersonSimpleThrow,
  Rainbow,
  Scroll,
  ShootingStar,
  Star,
  SunHorizon,
  Target,
  Tornado,
  Wall,
  Waves,
  Wind,
  type Icon,
} from '../../../components/icons/phosphor'

type StoryIconProps = {
  size?: number
  className?: string
  style?: CSSProperties
}

const duotone =
  (Base: Icon) =>
  ({ size = 20, className, style }: StoryIconProps) => (
    <Base
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 이모지 → 아이콘. 변이 선택자(FE0F)는 떼고 맞춘다. 주석은 해당 화 제목 */
const GLYPHS: Record<string, (p: StoryIconProps) => ReactElement> = {
  '🌍': duotone(GlobeHemisphereEast), // 세상이 시작되다 · 온 세상으로
  '🍎': duotone(Orange), // 무언가 잘못되다 — 선악과(잎 달린 열매)
  '🌊': duotone(Waves), // 노아 · 홍해 · 폭풍
  '🗼': duotone(CastleTurret), // 하늘에 닿으려던 탑
  '🌠': duotone(ShootingStar), // 한 사람을 부르시다 — 별처럼 많은 자손
  '⛰': duotone(Mountains), // 산 위의 시험
  '🤼': duotone(PersonSimpleThrow), // 씨름하는 사람
  '🌈': duotone(Rainbow), // 꿈꾸는 소년 · 모든 눈물이 씻기다
  '🔥': duotone(Flame), // 불타는 떨기나무
  '📜': duotone(Scroll), // 산에서 받은 열 마디
  '🏜': duotone(Cactus), // 광야의 40년
  '🎺': duotone(Megaphone), // 무너지는 성벽 — 나팔
  '🌀': duotone(Tornado), // 영웅들의 시대, 흔들리는 백성
  '🌾': duotone(Grains), // 이방 여인의 선택 — 이삭줍기
  '👑': duotone(Crown), // 왕을 달라는 백성
  '🎯': duotone(Target), // 목동이 왕이 되다 — 물맷돌
  '🏛': duotone(Bank), // 지혜의 왕과 성전
  '💔': duotone(HeartBreak), // 나라가 둘로 갈라지다
  '⚡': duotone(Lightning), // 불의 선지자 엘리야
  '🐋': duotone(FishSimple), // 도망친 선지자
  '📢': duotone(Broadcast), // 선지자들의 외침
  '🕯': duotone(MusicNote), // 무너진 성전, 낯선 땅의 노래
  '🧱': duotone(Wall), // 집으로 돌아가다 — 성벽 재건
  '👸': duotone(CrownSimple), // 죽으면 죽으리이다 — 에스더
  '🌒': duotone(MoonStars), // 400년의 침묵
  '⭐': duotone(Star), // 구유에 누우신 왕
  '🕊': duotone(Bird), // 물과 광야에서 — 비둘기
  '🏔': duotone(Mountains), // 산 위의 가르침
  '🐑': duotone(MagnifyingGlass), // 잃어버린 것을 찾아서
  '🫏': duotone(Horse), // 마지막 일주일이 시작되다 — 나귀
  '🍞': duotone(Bread), // 마지막 식사, 그리고 겟세마네
  '✝': duotone(Cross), // 십자가
  '🌅': duotone(SunHorizon), // 사흘째 새벽
  '💨': duotone(Wind), // 바람과 불의 날
  '🛤': duotone(Path), // 박해자가 전도자로 — 다메섹 길
  '✉': duotone(EnvelopeSimple), // 교회에게 보낸 편지들
  '📖': duotone(BookOpen), // 마지막 책, 문 앞에 서신 분
  '🚪': duotone(DoorOpen), // 이제 당신의 차례
  '🎉': duotone(Confetti), // 완주 축하 히어로
}

const normalize = (e: string) => e.replace(/️/g, '').trim()

/** 매핑된 아이콘이 있으면 SVG로, 없으면 원래 이모지를 그대로 보여준다 */
export const StoryGlyph = ({
  emoji,
  size = 20,
  className,
  style,
}: StoryIconProps & { emoji?: string | null }) => {
  if (!emoji) return null
  const Glyph = GLYPHS[normalize(emoji)]
  if (!Glyph) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
        {emoji}
      </span>
    )
  }
  return <Glyph size={size} className={className} style={style} />
}
