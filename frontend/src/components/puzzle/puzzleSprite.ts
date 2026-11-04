// scripts/gen-puzzle-sounds.py 가 만든다 — 손으로 고치지 말 것.
// sprite.mp3 안 조각 위치 [시작초, 길이초]. anchor = 첫 소리 시각(인코더 지연 보정용)

export const PUZZLE_SPRITE_ANCHOR_RATIO = 0.25

export const PUZZLE_SPRITE = {
  anchor: 0.1085,
  snap: [[0.1, 0.32], [0.62, 0.2884], [1.1084, 0.2947], [1.603, 0.32]],
  pickup: [[2.123, 0.296]],
  complete: [[2.619, 4.2]],
} as const
