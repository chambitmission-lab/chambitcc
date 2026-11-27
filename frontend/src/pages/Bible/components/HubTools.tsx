import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import parchmentUrl from '../../../assets/atlas/parchment.webp'
import parchmentNightUrl from '../../../assets/atlas/parchment-night.webp'
import moodLightUrl from '../../../assets/situation-moods/rest-light-sm.webp'
import moodDarkUrl from '../../../assets/situation-moods/rest-dark-sm.webp'
import { HUB_PARABLE_PICKS } from '../data/parables/hubPicks'
import { useParableRead } from '../Parables/parableProgress'
import { dashTexts } from '../bibleStudyTexts'

/**
 * /bible 허브 '성경 공부 도구' — 무대 + 썸네일 (2026-11-27 A2 시안).
 * 무대: 예수님의 비유 한 편을 그림과 함께 크게. 썸네일: 나머지 도구를 아이콘 대신 내용 미리보기로.
 * 같은 묶음을 PC 우측 레일(rail)과 모바일 본문(inline) 두 자리에 그린다 — 배치는 CSS(hub-tools.css)가 가른다.
 * 그림은 전부 CSS 배경(--art-light/--art-dark)이라 숨은 쪽·안 쓰는 테마 그림은 받지 않는다.
 */

/** 본편 화 수 — 화 데이터를 import 하지 않으려고 숫자만 둔다(storyProgress 와 같은 이유) */
const STORY_TOTAL = 42

// 무대 비유 다섯 편의 작은 그림(720px)만 — 비유 그림 전체 표(parableImages)는 도감 청크에 둔다
const PARABLE_ART = import.meta.glob<string>(
  '../../../assets/parables/{lost-sheep,prodigal-son,good-samaritan,sower,mustard-seed}-{light,dark}-sm.webp',
  { eager: true, import: 'default' },
)

const artVars = (light?: string, dark?: string): CSSProperties =>
  ({
    '--art-light': `url(${light ?? dark})`,
    '--art-dark': `url(${dark ?? light})`,
  }) as CSSProperties

const parableArt = (id: string): CSSProperties =>
  artVars(
    PARABLE_ART[`../../../assets/parables/${id}-light-sm.webp`],
    PARABLE_ART[`../../../assets/parables/${id}-dark-sm.webp`],
  )

const ATLAS_ART = artVars(parchmentUrl, parchmentNightUrl)
const MOOD_ART = artVars(moodLightUrl, moodDarkUrl)
// 사진 카드 미리보기 속 '내 사진' — 무대 그림과 겹치지 않게 씨 뿌리는 자·겨자씨 중 하나
const photoArtFor = (stageId: string) => parableArt(stageId === 'sower' ? 'mustard-seed' : 'sower')

/** 한국 날짜 기준 일련번호 — 다섯 편을 다 읽은 뒤 '오늘의 비유'를 하루 한 편씩 돌린다 */
const kstDayIndex = () => Math.floor((Date.now() + 9 * 60 * 60 * 1000) / 86_400_000)

const WAVE_BARS: ReadonlyArray<readonly [number, number]> = [
  [9, 8], [5, 16], [1, 24], [7, 12], [3, 20], [9, 8], [4, 18], [8, 10], [2, 22], [10, 6],
]

interface WarmHandlers {
  onPointerEnter: () => void
  onPointerDown: () => void
}

interface HubToolsProps {
  layout: 'rail' | 'inline'
  language: keyof typeof dashTexts
  storyReadCount: number
  /** 로그인했을 때만 즐겨찾기 듣기 썸네일이 보인다 */
  showFavorites: boolean
  favoritesCount: number
  onOpenFavorites: () => void
  warmFavorites: () => void
  /** 목적지 청크·첫 데이터 예열 핸들러 (BibleStudy.warmRoute) */
  warmRoute: (path: string) => WarmHandlers
}

const HubTools = ({
  layout,
  language,
  storyReadCount,
  showFavorites,
  favoritesCount,
  onOpenFavorites,
  warmFavorites,
  warmRoute,
}: HubToolsProps) => {
  const navigate = useNavigate()
  const dt = dashTexts[language]
  const read = useParableRead()

  // 무대 — 아직 안 읽은 입문 비유가 있으면 그 편, 다 읽었으면 날마다 한 편
  const unread = HUB_PARABLE_PICKS.find((p) => !read.has(p.id))
  const pick = unread ?? HUB_PARABLE_PICKS[kstDayIndex() % HUB_PARABLE_PICKS.length]
  const readSome = HUB_PARABLE_PICKS.some((p) => read.has(p.id))
  const stageChip = !unread ? dt.stageToday : readSome ? dt.stageNext : dt.stageFirst
  const stagePath = `/bible/parables?p=${pick.id}`

  const storyRatio = Math.min(1, storyReadCount / STORY_TOTAL)

  const thumb = (
    key: string,
    path: string,
    name: string,
    hint: string,
    preview: ReactNode,
  ) => (
    <button
      key={key}
      type="button"
      className={`hub-thumb hub-thumb--${key}`}
      aria-label={`${name} — ${hint}`}
      onClick={() => navigate(path)}
      {...warmRoute(path)}
    >
      {preview}
      <span className="hub-thumb__name">{name}</span>
    </button>
  )

  return (
    <div className={`hub-tools hub-tools--${layout}`}>
      {/* 무대 — 예수님의 비유 */}
      <button
        type="button"
        className="hub-stage"
        aria-label={`${dt.parableTitle} — ${pick.title}. ${pick.gist}`}
        onClick={() => navigate(stagePath)}
        {...warmRoute('/bible/parables')}
      >
        <span className="hub-stage__shot" style={parableArt(pick.id)}>
          <span className="hub-stage__chip">{stageChip}</span>
        </span>
        <span className="hub-stage__body">
          <span className="hub-stage__tag">{dt.parableTitle}</span>
          <span className="hub-stage__title">{pick.title}</span>
          <span className="hub-stage__gist">{pick.gist}</span>
          <span className="hub-stage__go">{dt.stageRead}</span>
        </span>
      </button>

      {/* 썸네일 — 3열. 비로그인은 다섯 개라 첫 칸(처음 만나는 성경)이 두 칸을 쓴다 */}
      <div className={`hub-thumbs${showFavorites ? '' : ' hub-thumbs--five'}`}>
        {thumb(
          'story',
          '/bible/story',
          dt.storyTitle,
          storyReadCount > 0 ? dt.storyProgress(storyReadCount) : dt.storyIntro,
          <span className="hub-thumb__pv hub-thumb__pv--story" aria-hidden="true">
            <b>{storyReadCount > 0 ? dt.storyUpTo(storyReadCount) : dt.storyTotal(STORY_TOTAL)}</b>
            <span className="hub-thumb__bar">
              <i style={{ width: `${storyRatio * 100}%` }} />
            </span>
          </span>,
        )}
        {thumb(
          'atlas',
          '/bible/atlas',
          dt.atlasTitle,
          dt.atlasText,
          <span className="hub-thumb__pv hub-thumb__pv--art hub-thumb__pv--atlas" style={ATLAS_ART} aria-hidden="true">
            <svg viewBox="0 0 100 58" preserveAspectRatio="none">
              <path
                d="M12 44 C30 18, 46 50, 62 30 S80 16, 88 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeDasharray="1 6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="12" cy="44" r="3.5" fill="currentColor" />
              <circle cx="88" cy="16" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>,
        )}
        {thumb(
          'typing',
          '/bible/typing',
          dt.typingTitle,
          dt.typingText,
          <span className="hub-thumb__pv hub-thumb__pv--typing" aria-hidden="true">
            {dt.typingSample}
            <i className="hub-thumb__caret" />
          </span>,
        )}
        {thumb(
          'situation',
          '/bible/situation',
          dt.situationTitle,
          dt.situationText,
          <span className="hub-thumb__pv hub-thumb__pv--art" style={MOOD_ART} aria-hidden="true" />,
        )}
        {thumb(
          'photo',
          '/bible/photo-verse',
          dt.photoTitle,
          dt.photoText,
          <span className="hub-thumb__pv hub-thumb__pv--photo" aria-hidden="true">
            <span className="hub-thumb__pol">
              <i style={photoArtFor(pick.id)} />
            </span>
          </span>,
        )}
        {showFavorites && (
          <button
            type="button"
            className="hub-thumb hub-thumb--listen"
            aria-label={`${dt.favTitle} — ${favoritesCount > 0 ? dt.favCount(favoritesCount) : dt.favIntro}`}
            onClick={onOpenFavorites}
            onPointerEnter={warmFavorites}
            onPointerDown={warmFavorites}
          >
            <span className="hub-thumb__pv hub-thumb__pv--listen" aria-hidden="true">
              <svg width="46" height="22" viewBox="0 0 58 26">
                {WAVE_BARS.map(([y, h], i) => (
                  <rect key={i} x={i * 6} y={y} width="3" height={h} rx="1.5" fill="currentColor" />
                ))}
              </svg>
            </span>
            <span className="hub-thumb__name">
              {favoritesCount > 0 ? dt.tileFavCount(favoritesCount) : dt.tileFavTitle}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default HubTools
