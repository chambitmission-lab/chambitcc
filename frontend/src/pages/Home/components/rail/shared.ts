// 레일 위젯 공용 값 — 언어 폴백 · 감정 메타.

import type { Language } from '../../../../locales'

// 표시 전용 — 영어 모드에서 _en 값이 있으면 사용, 없으면 한글로 폴백 (Worship.tsx와 같은 규칙).
// 요일·시간 파싱은 항상 한글 원본 필드를 쓴다.
const pick = (language: Language, ko: string | undefined | null, en: string | undefined | null): string =>
  language === 'en' && en ? en : (ko ?? '')

// 기도 작성 시트의 감정 옵션과 같은 키·이모지·라벨 (PrayerComposer와 동기화)
const EMOTION_META: Record<string, { emoji: string; label: string; labelEn: string }> = {
  anxious: { emoji: '😟', label: '불안', labelEn: 'Anxious' },
  tired: { emoji: '😮‍💨', label: '지침', labelEn: 'Weary' },
  sad: { emoji: '😢', label: '슬픔', labelEn: 'Sad' },
  lonely: { emoji: '🥺', label: '외로움', labelEn: 'Lonely' },
  angry: { emoji: '😠', label: '분노', labelEn: 'Angry' },
  confused: { emoji: '😵‍💫', label: '혼란', labelEn: 'Lost' },
  hopeful: { emoji: '🌱', label: '소망', labelEn: 'Hopeful' },
  grateful: { emoji: '🙏', label: '감사', labelEn: 'Grateful' },
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { pick, EMOTION_META }
