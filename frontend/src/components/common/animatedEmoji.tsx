// 움직이는 이모티콘 — 구글 Noto Animated Emoji(fonts.gstatic.com CDN)를 사용한다.
// 키보드의 움직이는 스티커는 웹 입력창에 넣을 수 없으므로(IME 이미지 삽입 미지원)
// 앱 자체 피커로 일반 이모지 "문자"를 입력받아 저장하고, 표시할 때만 애니메이션
// WebP로 바꿔 그린다. 덕분에 서버/DB는 순수 텍스트 그대로라 백엔드 수정이 없고,
// CDN 장애·미지원 이모지는 onError로 원래 문자가 그대로 보인다.
import { useState } from 'react'

export interface AnimatedEmoji {
  char: string
  code: string // Noto CDN 경로용 코드포인트 (소문자 hex, 다중 코드포인트는 _ 연결)
  label: string
}

export interface EmojiCategory {
  key: string
  label: string
  emojis: AnimatedEmoji[]
}

// 카테고리 탭 구성 — 모든 코드포인트는 Noto CDN에 애니메이션이 실제로 존재하는지
// 확인한 것만 넣는다(없으면 404 → 정지 이모지로 폴백되어 피커에서 혼자 안 움직인다).
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    key: 'prayer',
    label: '기도·마음',
    emojis: [
      { char: '🙏', code: '1f64f', label: '기도' },
      { char: '❤️', code: '2764_fe0f', label: '사랑' },
      { char: '❤️‍🔥', code: '2764_fe0f_200d_1f525', label: '불타는 사랑' },
      { char: '❤️‍🩹', code: '2764_fe0f_200d_1fa79', label: '회복' },
      { char: '🫶', code: '1faf6', label: '손하트' },
      { char: '🫰', code: '1faf0', label: '손가락 하트' },
      { char: '💜', code: '1f49c', label: '보라 하트' },
      { char: '😇', code: '1f607', label: '천사' },
      { char: '🤝', code: '1f91d', label: '함께해요' },
      { char: '🫂', code: '1fac2', label: '안아줄게요' },
      { char: '🕊️', code: '1f54a_fe0f', label: '평화' },
      { char: '🤞', code: '1f91e', label: '기원' },
      { char: '🥰', code: '1f970', label: '사랑스러움' },
      { char: '😊', code: '1f60a', label: '미소' },
      { char: '🤗', code: '1f917', label: '포옹' },
      { char: '🦅', code: '1f985', label: '독수리 날개치며' },
    ],
  },
  {
    key: 'feeling',
    label: '감정',
    emojis: [
      { char: '🥹', code: '1f979', label: '감동의 눈물' },
      { char: '🥺', code: '1f97a', label: '간절' },
      { char: '😭', code: '1f62d', label: '눈물' },
      { char: '😢', code: '1f622', label: '슬픔' },
      { char: '🥲', code: '1f972', label: '웃픈 눈물' },
      { char: '🫠', code: '1fae0', label: '녹아내림' },
      { char: '🤩', code: '1f929', label: '반한 눈' },
      { char: '😍', code: '1f60d', label: '하트 눈' },
      { char: '😂', code: '1f602', label: '눈물 나게 웃김' },
      { char: '🤣', code: '1f923', label: '데굴데굴' },
      { char: '😅', code: '1f605', label: '식은땀' },
      { char: '🫢', code: '1fae2', label: '헉' },
      { char: '🤭', code: '1f92d', label: '웃음 참기' },
      { char: '😴', code: '1f634', label: '졸림' },
      { char: '🥱', code: '1f971', label: '하품' },
      { char: '😮‍💨', code: '1f62e_200d_1f4a8', label: '한숨' },
      { char: '👀', code: '1f440', label: '보고 있어요' },
      { char: '🫡', code: '1fae1', label: '넵!' },
      { char: '🫵', code: '1faf5', label: '너!' },
      { char: '😎', code: '1f60e', label: '멋짐' },
      { char: '🤔', code: '1f914', label: '생각 중' },
      { char: '🙄', code: '1f644', label: '눈 굴리기' },
      { char: '😌', code: '1f60c', label: '안도' },
      { char: '🤯', code: '1f92f', label: '머리 터짐' },
    ],
  },
  {
    key: 'cheer',
    label: '응원·축하',
    emojis: [
      { char: '🙌', code: '1f64c', label: '찬양' },
      { char: '👏', code: '1f44f', label: '박수' },
      { char: '💪', code: '1f4aa', label: '힘내요' },
      { char: '👍', code: '1f44d', label: '좋아요' },
      { char: '👊', code: '1f44a', label: '주먹 인사' },
      { char: '💯', code: '1f4af', label: '백점' },
      { char: '🔥', code: '1f525', label: '불꽃' },
      { char: '🚀', code: '1f680', label: '가즈아' },
      { char: '🎉', code: '1f389', label: '축하' },
      { char: '🎊', code: '1f38a', label: '폭죽' },
      { char: '🥳', code: '1f973', label: '파티' },
      { char: '🎂', code: '1f382', label: '생일 축하' },
      { char: '🎁', code: '1f381', label: '선물' },
      { char: '🎈', code: '1f388', label: '풍선' },
      { char: '🏆', code: '1f3c6', label: '트로피' },
      { char: '🥇', code: '1f947', label: '금메달' },
    ],
  },
  {
    key: 'life',
    label: '일상·자연',
    emojis: [
      { char: '✨', code: '2728', label: '반짝임' },
      { char: '🌟', code: '1f31f', label: '빛나는 별' },
      { char: '⭐', code: '2b50', label: '별' },
      { char: '💫', code: '1f4ab', label: '별똥별' },
      { char: '🌈', code: '1f308', label: '무지개' },
      { char: '🌊', code: '1f30a', label: '파도' },
      { char: '🌞', code: '1f31e', label: '햇살' },
      { char: '🌝', code: '1f31d', label: '보름달' },
      { char: '🌱', code: '1f331', label: '새싹' },
      { char: '🍀', code: '1f340', label: '네잎클로버' },
      { char: '🌸', code: '1f338', label: '벚꽃' },
      { char: '💐', code: '1f490', label: '꽃다발' },
      { char: '☕', code: '2615', label: '커피 한잔' },
      { char: '📣', code: '1f4e3', label: '전하기' },
      { char: '🎸', code: '1f3b8', label: '찬양' },
      { char: '✍️', code: '270d_fe0f', label: '기록' },
    ],
  },
]

export const ANIMATED_EMOJIS: AnimatedEmoji[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis)

const byChar = new Map<string, AnimatedEmoji>()
for (const e of ANIMATED_EMOJIS) byChar.set(e.char, e)
// 키보드에 따라 변형 선택자(U+FE0F) 없이 입력되는 경우도 같은 애니메이션으로 매칭
for (const e of ANIMATED_EMOJIS) {
  const bare = e.char.replace(/️/g, '')
  if (bare !== e.char && !byChar.has(bare)) byChar.set(bare, e)
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// 긴 문자(FE0F 포함형)가 먼저 매칭되도록 정렬
const emojiPattern = new RegExp(
  `(${[...byChar.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')})`,
  'g'
)

export const animatedEmojiUrl = (code: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`

// 자주 쓴 이모티콘 — 기기별 로컬 저장(서버 스키마 변경 없음). 최근 사용 순 8개.
const RECENT_KEY = 'animated_emoji_recent'
const RECENT_MAX = 8

export const getRecentEmojis = (): AnimatedEmoji[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const chars: unknown = JSON.parse(raw)
    if (!Array.isArray(chars)) return []
    // 목록에서 빠진 이모지는 조용히 버린다
    return chars
      .map((c) => (typeof c === 'string' ? byChar.get(c) : undefined))
      .filter((e): e is AnimatedEmoji => !!e)
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

export const pushRecentEmoji = (char: string): AnimatedEmoji[] => {
  const next = [char, ...getRecentEmojis().map((e) => e.char).filter((c) => c !== char)].slice(
    0,
    RECENT_MAX
  )
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // 저장 실패(프라이빗 모드 등)해도 입력 자체는 막지 않는다
  }
  return next.map((c) => byChar.get(c)).filter((e): e is AnimatedEmoji => !!e)
}

interface AnimatedEmojiImgProps {
  emoji: AnimatedEmoji
  size: number
}

// CDN에 애니메이션이 없거나 로드 실패하면 원래 이모지 문자로 폴백
export const AnimatedEmojiImg = ({ emoji, size }: AnimatedEmojiImgProps) => {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}>{emoji.char}</span>
    )
  }

  return (
    <img
      src={animatedEmojiUrl(emoji.code)}
      alt={emoji.char}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className="inline-block align-[-0.35em] mx-px select-none"
    />
  )
}

interface AnimatedEmojiTextProps {
  content: string
  className?: string
}

// 텍스트 안의 지원 이모지를 움직이는 이미지로 바꿔 그린다.
// 이모지(1~3개)만 있는 댓글은 메신저처럼 큼직한 스티커로 보여준다.
export const AnimatedEmojiText = ({ content, className }: AnimatedEmojiTextProps) => {
  const parts = content.split(emojiPattern)
  const emojiCount = parts.filter((p) => byChar.has(p)).length
  const stickerOnly =
    emojiCount > 0 && emojiCount <= 3 && parts.every((p) => byChar.has(p) || p.trim() === '')
  const size = stickerOnly ? 52 : 21

  return (
    <p className={className}>
      {parts.map((part, i) => {
        const emoji = byChar.get(part)
        return emoji ? <AnimatedEmojiImg key={i} emoji={emoji} size={size} /> : part
      })}
    </p>
  )
}
