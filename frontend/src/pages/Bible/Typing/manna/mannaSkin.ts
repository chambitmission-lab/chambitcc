import { useEffect, useState } from 'react'
import { safeStorage } from '../../../../utils/safeStorage'
import { ensureFontFamily } from '../../../../utils/deferredFonts'
import type { MannaResult } from './mannaEngine'

/**
 * 화면 스타일 두 벌 — 이제 말씀 잇기(/bible/typing/link)만 고른다. 만나 내리기는 드롭 한 벌.
 *  arcade : 오락실 레트로(도트 서체·네온·하이스코어·STAGE CLEAR)
 *  drop   : 스트리트 스티커(굵은 외곽선 글씨·컬러 블록·유형 카드)
 */
export type MannaSkin = 'arcade' | 'drop'

const SKIN_KEY = 'manna-skin'

export const MANNA_SKINS: { key: MannaSkin; label: string; desc: string }[] = [
  { key: 'drop', label: '드롭', desc: '스티커 · 컬러' },
  { key: 'arcade', label: '아케이드', desc: '오락실 · 도트' },
]

const readSkin = (): MannaSkin => (safeStorage.get(SKIN_KEY) === 'arcade' ? 'arcade' : 'drop')

export const useMannaSkin = () => {
  const [skin, setSkinState] = useState<MannaSkin>(readSkin)
  const setSkin = (s: MannaSkin) => {
    setSkinState(s)
    safeStorage.set(SKIN_KEY, s)
  }
  // 드롭 제목 서체(Black Han Sans)는 그 스킨을 쓸 때만 붙인다 — 아케이드 도트 서체는 CSS @font-face 라 쓸 때만 내려온다
  useEffect(() => {
    if (skin === 'drop') void ensureFontFamily('blackHanSans')
  }, [skin])
  return [skin, setSkin] as const
}

/** 손가락이 주 입력인 기기 — 화면 키보드가 무대 아래 절반을 덮으니 만나를 가로로 흘려 보낸다 */
export const isTouchDevice = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches

/** 만나 콤보 터짐 문구 — 10콤보마다 화면 가운데 한 번 */
export const BURST_EVERY = 10
export const burstText = (combo: number) => {
  const lines = ['미쳤다!', '폼 미쳤다', '손 풀렸다', '갓벽!', '멈추지 마']
  return lines[Math.floor(combo / BURST_EVERY - 1) % lines.length]
}

/** 오늘의 '만나 유형' — 드롭 결과 카드. 한 판 기록에서 가장 두드러진 버릇 하나를 고른다 */
export interface MannaPersona {
  key: string
  title: string
  desc: string
  icon: string
  /** 유형을 뒷받침하는 숫자 한 칸 */
  stat: { label: string; value: string }
}

export const mannaPersona = (r: MannaResult, verses: number): MannaPersona => {
  const minutes = Math.max(r.durationMs / 60000, 0.25)
  const wpm = r.wordsCaught / minutes
  if (r.reachedCanaan && r.perfectVerses === verses && verses > 0)
    return { key: 'perfect', title: '한 톨도 안 흘린\n완벽주의형', desc: '여덟 절을 한 단어도 놓치지 않았어요.\n말씀 앞에 진심인 타입.', icon: 'verified', stat: { label: '온전히 새김', value: `${r.perfectVerses}/${verses}` } }
  if (r.closeCalls >= 5)
    return { key: 'thriller', title: '아슬아슬\n스릴러형', desc: `땅에 닿기 직전에만 ${r.closeCalls}번 거뒀어요.\n심장 쫄깃한 걸 즐기는 타입.`, icon: 'bolt', stat: { label: '아슬아슬', value: `×${r.closeCalls}` } }
  if (r.maxCombo >= 20)
    return { key: 'combo', title: '콤보\n폭주기관차형', desc: `한 번 붙으면 안 멈춰요.\n최고 ${r.maxCombo}콤보까지 질주.`, icon: 'local_fire_department', stat: { label: '최고 콤보', value: `${r.maxCombo}` } }
  if (r.goldCaught >= 4)
    return { key: 'gold', title: '핵심만 쏙쏙\n골드헌터형', desc: `금빛 핵심 말씀을 ${r.goldCaught}개나 챙겼어요.\n요점 정리의 달인.`, icon: 'auto_awesome', stat: { label: '핵심 말씀', value: `×${r.goldCaught}` } }
  if (wpm >= 22)
    return { key: 'speed', title: '번개 손가락\n스피드러너형', desc: `1분에 ${Math.round(wpm)}단어씩 거뒀어요.\n키보드가 뜨거워요.`, icon: 'speed', stat: { label: '분당 단어', value: `${Math.round(wpm)}` } }
  if (r.wordsMissed > r.wordsCaught * 0.4)
    return { key: 'stroll', title: '여유만만\n광야 산책러형', desc: '놓쳐도 서두르지 않아요.\n다음 판엔 항아리를 더 채워 봐요.', icon: 'hiking', stat: { label: '거둔 만나', value: `${r.wordsCaught}` } }
  return { key: 'steady', title: '꾸준한\n광야 순례자형', desc: '한 절 한 절 차근차근.\n결국 끝까지 가는 타입.', icon: 'directions_walk', stat: { label: '새긴 말씀', value: `${r.versesDone}절` } }
}

/** 올해 몇째 날인지 — 아케이드 STAGE 번호 */
export const dayOfYear = (d = new Date()) => Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)

/** ISO 주차 — 드롭 시즌 번호(월요일 시작, 부서 대항전 주와 같다) */
export const isoWeek = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7)
}

/** 이번 주(월~주일) 끝까지 남은 날 — 주일이면 0 */
export const daysLeftInWeek = (d = new Date()) => (7 - (d.getDay() || 7)) % 7

/** 결과 다시하기 — 오락실 CONTINUE 카운트다운(9→0, 끝나면 그냥 '다시 하기') */
export const useContinueCountdown = (enabled: boolean) => {
  const [n, setN] = useState(enabled ? 9 : 0)
  useEffect(() => {
    if (!enabled || n <= 0) return
    const t = setTimeout(() => setN((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [enabled, n])
  return n
}
