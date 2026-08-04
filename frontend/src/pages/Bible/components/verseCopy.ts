import { showToast } from '../../../utils/toast'

/**
 * 성경 구절 복사/공유 — 절 액션바, 여러 절 선택 바, 공유 시트가 함께 쓰는 포맷터.
 *
 * 여러 절을 나눌 때 채팅창에서 "글자 벽"이 되지 않는 게 이 파일의 목표다.
 * 성경 본문은 원래 리스트가 아니라 문단이므로, 기본값은 절 번호를 위첨자로
 * 눌러 한 문단으로 흘려보낸다(문단형). 줄바꿈 나열이 필요하면 layout='lines'.
 *
 * 포맷은 공유 시트(및 읽기 설정 Aa)에서 바꿀 수 있고 localStorage에 남는다.
 * 복사 시점에 매번 읽어오므로 설정을 바꾸면 즉시 반영된다(구독/이벤트 불필요).
 */

export type CopyStyle = 'refAfter' | 'refBefore' | 'textOnly'
/** 절 번호 표기 — 위첨자(¹⁸)로 눌러 담거나 아예 빼거나 */
export type CopyNumbering = 'superscript' | 'none'
/** 여러 절 배치 — 한 문단으로 흘리기 / 절마다 줄바꿈 */
export type CopyLayout = 'paragraph' | 'lines'

export interface CopyPrefs {
  style: CopyStyle
  /** 앱 딥링크를 함께 붙일지 — 받은 사람이 누르면 그 절로 열린다 */
  withLink: boolean
  numbering: CopyNumbering
  layout: CopyLayout
  /** 본문을 인용부호로 감쌀지 — 출처와 본문의 경계를 만든다 */
  quote: boolean
}

const STORAGE_KEY = 'bible-copy-prefs'

/** 본문 번역본 — 출처 줄에 함께 적어 어느 역본인지 남긴다 */
export const TRANSLATION_LABEL = '개역개정'

/**
 * 채팅 말풍선이 "전체보기"로 접히기 시작하는 지점. 이보다 많이 고르면
 * 앞부분만 담고 나머지는 링크로 넘긴다 — 통째로 밀어넣는 것보다 읽힌다.
 */
const FOLD_OVER = 6
/** 접을 때 남길 절 수 */
const FOLD_KEEP = 2

export const DEFAULT_COPY_PREFS: CopyPrefs = {
  style: 'refAfter',
  withLink: true,
  numbering: 'superscript',
  layout: 'paragraph',
  quote: true,
}

export const loadCopyPrefs = (): CopyPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COPY_PREFS
    const p = JSON.parse(raw)
    return {
      style: p.style === 'refBefore' || p.style === 'textOnly' ? p.style : 'refAfter',
      withLink: p.withLink !== false,
      // 아래 셋은 나중에 생긴 설정이라 예전 저장값엔 없다 — 없으면 새 기본값을 쓴다
      numbering: p.numbering === 'none' ? 'none' : 'superscript',
      layout: p.layout === 'lines' ? 'lines' : 'paragraph',
      quote: p.quote !== false,
    }
  } catch {
    return DEFAULT_COPY_PREFS
  }
}

export const saveCopyPrefs = (p: CopyPrefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* 사파리 프라이빗 모드 등 — 저장 실패해도 이번 세션 동작엔 영향 없음 */
  }
}

export interface CopyVerse {
  verse: number
  text: string
}

export interface VerseCopyTarget {
  bookNameKo: string
  bookNumber: number
  chapter: number
  /** 절 번호 오름차순일 필요는 없다 — 내부에서 정렬/중복 제거한다 */
  verses: CopyVerse[]
}

/** [16,17,20] → "16-17, 20" — 연속 구간은 하이픈으로 묶는다 */
export const formatVerseNumbers = (nums: number[]): string => {
  const sorted = [...new Set(nums)].sort((a, b) => a - b)
  if (!sorted.length) return ''
  const parts: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i]
    if (cur === prev + 1) {
      prev = cur
      continue
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = cur
    prev = cur
  }
  return parts.join(', ')
}

/** "요한복음 3:16-17" */
export const buildReference = (target: VerseCopyTarget): string => {
  const nums = formatVerseNumbers(target.verses.map((v) => v.verse))
  return `${target.bookNameKo} ${target.chapter}:${nums}`.trim()
}

/**
 * 공유 링크의 정식 도메인.
 *
 * 어느 호스트에서 보든(미리보기 배포, vercel.app 등) 이 도메인으로 보낸다 —
 * /b/* 를 백엔드 OG 라우트로 넘기는 rewrite가 여기에만 걸려 있고, 받는 사람에게도
 * 교회 주소가 찍히는 편이 낫다.
 */
const SHARE_ORIGIN = 'https://chambitcc.kro.kr'

/** 로컬 개발에는 /b/* rewrite가 없다 — 그때만 예전 해시 딥링크로 폴백한다 */
const isLocalHost = () =>
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

/** [16,17,20] → "16-17,20" — 경로에 넣을 공백 없는 표기 */
const toVerseSpec = (nums: number[]): string =>
  formatVerseNumbers(nums).replace(/\s+/g, '')

/**
 * 공유 링크.
 *
 * 운영에서는 짧은 /b/{책}/{장}/{절} 을 쓴다. 이 주소는 백엔드가 og:* 메타를 붙여
 * 응답하므로 카톡 미리보기 카드에 실제 구절이 뜨고, 사람이 누르면 앱의 그 절로
 * 곧바로 이동한다. (해시 딥링크는 크롤러가 앱 셸만 읽어 늘 일반 홈 카드가 떴다)
 */
export const buildVerseLink = (target: VerseCopyTarget): string => {
  const nums = target.verses.map((v) => v.verse)
  if (isLocalHost()) {
    const { origin, pathname } = window.location
    return `${origin}${pathname}#/bible/${target.bookNumber}/${target.chapter}?verse=${Math.min(...nums)}`
  }
  return `${SHARE_ORIGIN}/b/${target.bookNumber}/${target.chapter}/${toVerseSpec(nums)}`
}

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

/** 18 → "¹⁸" — 절 번호를 본문보다 작게 눌러 문단 흐름을 끊지 않게 한다 */
export const toSuperscript = (n: number): string =>
  String(n)
    .split('')
    .map((d) => SUPERSCRIPT_DIGITS[Number(d)] ?? d)
    .join('')

export interface BodyOptions {
  numbering: CopyNumbering
  layout: CopyLayout
  /** 이 개수를 넘으면 앞 FOLD_KEEP개만 담고 …로 접는다. Infinity면 접지 않음 */
  foldOver?: number
}

export interface BuiltBody {
  body: string
  /** 접혔는지 — 호출부가 "전체 N절" 안내를 붙일지 정할 때 쓴다 */
  folded: boolean
  /** 선택된 전체 절 수 (접기 전) */
  total: number
}

/**
 * 본문 문자열을 만든다.
 *
 * 문단형에서 첫 절의 번호는 붙이지 않는다 — 어디부터인지는 출처 줄이
 * 이미 말해주고, 문단 첫 글자가 숫자로 시작하면 인용처럼 안 읽힌다.
 */
export const buildBody = (target: VerseCopyTarget, opts: BodyOptions): BuiltBody => {
  const all = [...target.verses].sort((a, b) => a.verse - b.verse)
  const foldOver = opts.foldOver ?? FOLD_OVER
  const folded = all.length > foldOver
  const shown = folded ? all.slice(0, FOLD_KEEP) : all

  if (opts.layout === 'lines') {
    const body = shown
      .map((v) =>
        opts.numbering === 'none' ? v.text.trim() : `${toSuperscript(v.verse)} ${v.text.trim()}`,
      )
      .join('\n')
    return { body: folded ? `${body}\n…` : body, folded, total: all.length }
  }

  const parts = shown.map((v, i) => {
    const text = v.text.trim()
    if (i === 0 || opts.numbering === 'none') return text
    return `${toSuperscript(v.verse)}${text}`
  })
  const body = parts.join(' ')
  return { body: folded ? `${body} …` : body, folded, total: all.length }
}

export interface BuiltShareText {
  text: string
  url: string | null
  reference: string
  folded: boolean
  total: number
}

/**
 * 복사/공유용 문자열을 만든다.
 *
 * text에는 링크를 넣지 않고 url로 따로 돌려준다 — navigator.share에 둘 다 넘기면
 * 공유 대상 앱이 링크를 두 번 붙이는 경우가 있어서다.
 */
export const buildCopyText = (
  target: VerseCopyTarget,
  prefs: CopyPrefs = loadCopyPrefs(),
): BuiltShareText => {
  const reference = buildReference(target)
  const { body, folded, total } = buildBody(target, {
    numbering: prefs.numbering,
    layout: prefs.layout,
  })
  const quoted = prefs.quote ? `“${body}”` : body
  const url = prefs.withLink ? buildVerseLink(target) : null
  const refLine = `${reference} · ${TRANSLATION_LABEL}`

  let text =
    prefs.style === 'textOnly'
      ? quoted
      : prefs.style === 'refBefore'
        ? `${refLine}\n\n${quoted}`
        : `${quoted}\n\n${refLine}`

  // 접었다면 나머지를 어디서 읽는지 알려준다 — 링크가 없으면 안내할 곳이 없다
  if (folded && url) text += `\n전체 ${total}절은 링크에서 이어 읽을 수 있어요`

  return { text, url, reference, folded, total }
}

/** 공유/복사에 실제로 나가는 최종 문자열 (본문 + 링크) */
export const buildFullText = (built: BuiltShareText): string =>
  built.url ? `${built.text}\n${built.url}` : built.text

/**
 * 클립보드 쓰기. iOS 사파리는 사용자 제스처와 같은 태스크에서 호출해야 하므로
 * 호출부는 await 없이 바로 이 함수를 부를 것 (문자열 조립은 전부 동기).
 */
export const writeToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 권한 거부/비보안 컨텍스트 → 아래 폴백 */
  }
  // 폴백: http 로 열린 개발 환경이나 구형 웹뷰
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 절 복사 + 토스트 */
export const copyVerses = async (target: VerseCopyTarget, prefs?: CopyPrefs) => {
  if (!target.verses.length) return
  const built = buildCopyText(target, prefs)
  const ok = await writeToClipboard(buildFullText(built))
  showToast(ok ? `${built.reference} 복사했어요` : '복사에 실패했어요', ok ? 'success' : 'error')
}

/**
 * 절 공유 — 네이티브 공유 시트가 없으면 복사로 폴백.
 *
 * title은 일부러 넘기지 않는다. 카카오톡 등은 title을 본문 앞에 " - "로 덧붙여
 * 출처가 위아래로 두 번 나오는 꼴이 된다(본문 시작이 출처에 먹히기까지 한다).
 */
export const shareVerses = async (target: VerseCopyTarget, prefs?: CopyPrefs) => {
  if (!target.verses.length) return
  const built = buildCopyText(target, prefs)
  if (navigator.share) {
    try {
      await navigator.share(built.url ? { text: built.text, url: built.url } : { text: built.text })
    } catch {
      /* 사용자가 공유 시트를 닫음 — 조용히 무시 */
    }
    return
  }
  await copyVerses(target, prefs)
}
