// /profile 첫 그리기 전에 받아 둘 것들 — prefetch.ts 가 데이터 선요청과 나란히 부른다.
//
// 1. Gaegu 손글씨 글리프: ProfileHeader·LevelProgress·PrayerNotebook 모듈이 Google Fonts CSS 는
//    청크 평가 때 붙이지만, 실제 woff2 조각(unicode-range 분할)은 그 글자가 "그려질 때" 내려온다.
//    본문은 5개 API 가 끝난 뒤에 그려지므로 손글씨는 본문이 뜬 다음에야 받기 시작했고, 날짜·제목이
//    Pretendard → Gaegu 로 한 번 더 바뀌며 흔들렸다. 데이터를 기다리는 동안 document.fonts.load 로
//    화면에 실제로 그려질 글자(고정 라벨 + 캐시된 내 기도 제목·이름)의 조각을 미리 받는다.
//    (가계도 인물 상세 시트가 명조 조각을 예열하는 것과 같은 방식)
// 2. 커버 배너 이미지: TitleBackdrop.warmTitleBackdrop — 지난 방문 힌트 키로 즉시, 칭호 응답 뒤 한 번 더.
import type { QueryClient } from '@tanstack/react-query'
import { profile as ko } from '../../locales/ko/profile'
import { GLOW_LEVELS } from '../../types/achievement'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { profileKeys } from '../../hooks/queryKeys'
import type { ProfileDetail } from '../../types/profile'

// 수첩·등불·훈장 수첩에서 Gaegu 로 그리는 고정 문구 — 날짜("10월 18일 (토)"·"10.15")·숫자 칩·Lv 포함
const STATIC_TEXT = [
  ko.lampTitle,
  ...GLOW_LEVELS.map((l) => l.name),
  ko.notebookTitlePrayers,
  ko.notebookTitlePraying,
  ko.notebookTitleReplies,
  ko.notebookTitleNotes,
  ko.notebookAnswered,
  ko.notebookEmptyPrayers,
  ko.notebookEmptyPraying,
  ko.notebookEmptyReplies,
  ko.bookmarksEmpty,
  '0123456789.()Lv 년월일 일월화수목금토',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
].join('')

const WEIGHTS = ['400', '700'] as const

// 이미 요청한 글자 — 같은 조각을 두 번 묻지 않는다(fonts.load 자체도 캐시하지만 문자열 정리를 줄인다)
const requested = new Set<string>()

const loadGlyphs = (text: string): void => {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  const fresh = Array.from(new Set(text)).filter((ch) => !requested.has(ch) && ch.trim() !== '')
  if (fresh.length === 0) return
  for (const ch of fresh) requested.add(ch)
  const sample = fresh.join('')
  // @font-face 선언이 CSSOM 에 들어간 뒤에야 fonts.load 가 실제 조각을 받는다
  void ensureFontFamily('gaegu').then(() => {
    for (const w of WEIGHTS) {
      document.fonts.load(`${w} 20px "Gaegu"`, sample).catch(() => undefined)
    }
  })
}

/** 고정 라벨 조각 — 진입 즉시 */
export const warmProfileFontsStatic = (): void => loadGlyphs(STATIC_TEXT)

/** 캐시된 detail 로 실제 그려질 글자 조각 — 이름·내 기도 제목·함께 기도 제목·댓글 본문 */
export const warmProfileFontsFromCache = (qc: QueryClient): void => {
  const detail = qc.getQueryData<ProfileDetail>(profileKeys.detail())
  if (!detail) return
  const parts: Array<string | null | undefined> = [
    detail.stats.full_name,
    detail.stats.username,
    detail.stats.church_title,
    ...detail.my_prayers.map((p) => p.title),
    ...detail.praying_for.map((p) => p.title),
    ...detail.praying_for.map((p) => p.display_name),
    ...detail.my_replies.map((r) => r.content),
    ...detail.my_replies.map((r) => r.prayer_title),
  ]
  loadGlyphs(parts.filter((s): s is string => typeof s === 'string').join(''))
}
