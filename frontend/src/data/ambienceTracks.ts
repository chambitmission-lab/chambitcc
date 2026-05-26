// 배경음(ambience) 카탈로그 — 여러 페이지에서 공유.
// src 가 있는 트랙은 public/sounds 경로에서 로드됨. 파일이 아직 없으면 폴백으로 무음 처리.
// 파일 추가 시 .mp3 / .ogg / .webm 중 적절한 포맷을 public/sounds/ 디렉토리에 두고
// src 값만 맞춰주면 즉시 동작.

export interface AmbienceTrack {
  id: string
  /** material-icons-outlined 이름 */
  icon: string
  labelKey: string
  /** public 경로 기준 src. undefined 이면 무음 */
  src?: string
  /** 기본 볼륨 0~1 */
  volume?: number
}

const SILENT: AmbienceTrack = {
  id: 'silent',
  icon: 'volume_off',
  labelKey: 'ambienceSilent',
}

// 집중 기도시간 화면(/prayer-focus) 트랙
export const PRAYER_AMBIENCE_TRACKS: AmbienceTrack[] = [
  SILENT,
  { id: 'rain', icon: 'rainy', labelKey: 'ambienceRain', src: '/sounds/ambience-rain.mp3', volume: 0.5 },
  { id: 'dawn', icon: 'wb_twilight', labelKey: 'ambienceDawn', src: '/sounds/ambience-dawn.mp3', volume: 0.4 },
  { id: 'piano', icon: 'piano', labelKey: 'ambiencePiano', src: '/sounds/ambience-piano.mp3', volume: 0.45 },
  { id: 'candle', icon: 'local_fire_department', labelKey: 'ambienceCandle', src: '/sounds/ambience-candle.mp3', volume: 0.35 },
  { id: 'church', icon: 'church', labelKey: 'ambienceChurch', src: '/sounds/ambience-church.mp3', volume: 0.4 },
]

// 신앙 여정(/growth, /weekly-story) 트랙 — 묵상·회상에 어울리는 잔잔한 곡 위주.
// 파일이 없으면 자동 무음 fallback. mp3를 public/sounds/ 에 떨궈 넣으면 즉시 활성화.
export const GROWTH_AMBIENCE_TRACKS: AmbienceTrack[] = [
  SILENT,
  {
    id: 'growth-piano',
    icon: 'piano',
    labelKey: 'ambienceGrowthPiano',
    src: '/sounds/ambience-growth-piano.mp3',
    volume: 0.4,
  },
  {
    id: 'growth-hymn',
    icon: 'church',
    labelKey: 'ambienceGrowthHymn',
    src: '/sounds/ambience-growth-hymn.mp3',
    volume: 0.4,
  },
  {
    id: 'growth-worship',
    icon: 'auto_awesome',
    labelKey: 'ambienceGrowthWorship',
    src: '/sounds/ambience-growth-worship.mp3',
    volume: 0.4,
  },
  {
    id: 'growth-nature',
    icon: 'forest',
    labelKey: 'ambienceGrowthNature',
    src: '/sounds/ambience-growth-nature.mp3',
    volume: 0.45,
  },
  {
    id: 'growth-strings',
    icon: 'graphic_eq',
    labelKey: 'ambienceGrowthStrings',
    src: '/sounds/ambience-growth-strings.mp3',
    volume: 0.4,
  },
]

export const findAmbience = (id: string): AmbienceTrack | undefined => {
  for (const t of PRAYER_AMBIENCE_TRACKS) if (t.id === id) return t
  for (const t of GROWTH_AMBIENCE_TRACKS) if (t.id === id) return t
  return undefined
}
