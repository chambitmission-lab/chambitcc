import { showToast } from '../../../utils/toast'

/**
 * 성경 구절 복사/공유 — 절 액션바와 여러 절 선택 바가 함께 쓰는 포맷터.
 *
 * 포맷은 읽기 설정(Aa)에서 바꿀 수 있고 localStorage에 남는다. 복사 시점에
 * 매번 읽어오므로 설정을 바꾸면 즉시 반영된다(구독/이벤트 불필요).
 */

export type CopyStyle = 'refAfter' | 'refBefore' | 'textOnly'

export interface CopyPrefs {
  style: CopyStyle
  /** 앱 딥링크를 함께 붙일지 — 받은 사람이 누르면 그 절로 열린다 */
  withLink: boolean
}

const STORAGE_KEY = 'bible-copy-prefs'

export const DEFAULT_COPY_PREFS: CopyPrefs = { style: 'refAfter', withLink: true }

export const loadCopyPrefs = (): CopyPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COPY_PREFS
    const p = JSON.parse(raw)
    return {
      style: p.style === 'refBefore' || p.style === 'textOnly' ? p.style : 'refAfter',
      withLink: p.withLink !== false,
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

/** 첫 절로 스크롤되는 딥링크 (HashRouter + 서브경로 배포 호환) */
export const buildVerseLink = (target: VerseCopyTarget): string => {
  const first = Math.min(...target.verses.map((v) => v.verse))
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/bible/${target.bookNumber}/${target.chapter}?verse=${first}`
}

/** 본문만 — 여러 절이면 절 번호를 앞에 붙여 어디부터 어디까지인지 보이게 한다 */
const buildBody = (target: VerseCopyTarget): string => {
  const verses = [...target.verses].sort((a, b) => a.verse - b.verse)
  if (verses.length === 1) return verses[0].text.trim()
  return verses.map((v) => `${v.verse} ${v.text.trim()}`).join('\n')
}

/**
 * 복사/공유용 문자열을 만든다.
 * text에는 링크를 넣지 않고 url로 따로 돌려준다 — navigator.share에 둘 다 넘기면
 * 공유 대상 앱이 링크를 두 번 붙이는 경우가 있어서다.
 */
export const buildCopyText = (
  target: VerseCopyTarget,
  prefs: CopyPrefs = loadCopyPrefs(),
): { text: string; url: string | null; reference: string } => {
  const reference = buildReference(target)
  const body = buildBody(target)
  const text =
    prefs.style === 'textOnly'
      ? body
      : prefs.style === 'refBefore'
        ? `${reference}\n${body}`
        : `${body}\n— ${reference}`
  return { text, url: prefs.withLink ? buildVerseLink(target) : null, reference }
}

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
export const copyVerses = async (target: VerseCopyTarget) => {
  if (!target.verses.length) return
  const { text, url, reference } = buildCopyText(target)
  const full = url ? `${text}\n\n${url}` : text
  const ok = await writeToClipboard(full)
  if (ok) {
    showToast(`${reference} 복사했어요`, 'success')
  } else {
    showToast('복사에 실패했어요', 'error')
  }
}

/** 절 공유 — 네이티브 공유 시트가 없으면 복사로 폴백 */
export const shareVerses = async (target: VerseCopyTarget) => {
  if (!target.verses.length) return
  const { text, url, reference } = buildCopyText(target)
  if (navigator.share) {
    try {
      await navigator.share(url ? { title: reference, text, url } : { title: reference, text })
    } catch {
      /* 사용자가 공유 시트를 닫음 — 조용히 무시 */
    }
    return
  }
  await copyVerses(target)
}
