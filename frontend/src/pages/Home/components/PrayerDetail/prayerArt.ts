// 기도 상세 머리 그림 — 기도를 쓸 때 고른 감정(prayer.emotion)에 맞는 풍경을 깐다.
// 그림은 상황별 성구의 감정 삽화(src/assets/situation-moods)를 그대로 쓴다. moodArt.ts 와 같은 파일이라 URL(해시)이 같다.
// 감정을 고르지 않았거나 짝이 없는 감정(소망)은 중보 화면의 창가 그림 하나로 통일한다.
import type { CSSProperties } from 'react'
import type { PrayerEmotion } from '../../../../types/prayer'
import { INTERCESSION_HERO } from '../../../../utils/themeAssets'

const FILES = import.meta.glob<string>('../../../../assets/situation-moods/*.webp', {
  eager: true,
  import: 'default',
})

const urlOf = (name: string) => FILES[`../../../../assets/situation-moods/${name}.webp`]

/** 기도 감정 → 감정 삽화 키 + 초점(그림 폭·높이 비율 — situationMoods.ts 의 fx·fy 와 같은 값) */
const ART_BY_EMOTION: Partial<Record<PrayerEmotion, { key: string; fx: number; fy: number }>> = {
  tired: { key: 'weary', fx: 0.75, fy: 0.62 },
  anxious: { key: 'anxious', fx: 0.76, fy: 0.58 },
  grateful: { key: 'thankful', fx: 0.75, fy: 0.48 },
  sad: { key: 'sad', fx: 0.7, fy: 0.56 },
  lonely: { key: 'lonely', fx: 0.71, fy: 0.58 },
  angry: { key: 'forgive', fx: 0.7, fy: 0.64 },
  confused: { key: 'lost', fx: 0.67, fy: 0.64 },
}

/** .pd-art 가 읽는 CSS 변수 — 테마에 맞는 한 장만 내려받도록 배경 이미지로 건다(prayerDetail.css) */
export const prayerArtVars = (emotion?: PrayerEmotion | null): CSSProperties => {
  const art = emotion ? ART_BY_EMOTION[emotion] : undefined
  const light = art && urlOf(`${art.key}-light`)
  const dark = art && urlOf(`${art.key}-dark`)
  if (art && light && dark) {
    return {
      '--pd-art-light': `url(${light})`,
      '--pd-art-dark': `url(${dark})`,
      '--pd-art-pos': `${art.fx * 100}% ${art.fy * 100}%`,
    } as CSSProperties
  }
  return {
    '--pd-art-light': `url(${INTERCESSION_HERO.light})`,
    '--pd-art-dark': `url(${INTERCESSION_HERO.dark})`,
    '--pd-art-pos': '50% 38%',
  } as CSSProperties
}
