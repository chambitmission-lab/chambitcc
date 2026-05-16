// 배경음(ambience) 카탈로그
// src 가 있는 트랙은 public/sounds 경로에서 로드됨. 파일이 아직 없으면 폴백으로 무음 처리.
// 파일 추가 시 .mp3 / .ogg / .webm 중 적절한 포맷을 public/sounds/ 디렉토리에 두고
// AMBIENCE_TRACKS 의 src 값만 맞춰주면 즉시 동작.

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

export const AMBIENCE_TRACKS: AmbienceTrack[] = [
  { id: 'silent', icon: 'volume_off', labelKey: 'ambienceSilent' },
  { id: 'rain', icon: 'rainy', labelKey: 'ambienceRain', src: '/sounds/ambience-rain.mp3', volume: 0.5 },
  { id: 'dawn', icon: 'wb_twilight', labelKey: 'ambienceDawn', src: '/sounds/ambience-dawn.mp3', volume: 0.4 },
  { id: 'piano', icon: 'piano', labelKey: 'ambiencePiano', src: '/sounds/ambience-piano.mp3', volume: 0.45 },
  { id: 'candle', icon: 'local_fire_department', labelKey: 'ambienceCandle', src: '/sounds/ambience-candle.mp3', volume: 0.35 },
  { id: 'church', icon: 'church', labelKey: 'ambienceChurch', src: '/sounds/ambience-church.mp3', volume: 0.4 },
]

export const findAmbience = (id: string): AmbienceTrack | undefined =>
  AMBIENCE_TRACKS.find((a) => a.id === id)
