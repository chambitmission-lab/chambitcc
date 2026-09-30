// Confetti 보상 효과 유틸리티

import confetti from 'canvas-confetti'

/**
 * 업적 달성 축하 효과
 */
export const celebrateAchievement = () => {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

/**
 * 꽃 피어남 효과 (작은 축하)
 */
export const celebrateFlowerBloom = (x: number = 0.5, y: number = 0.5) => {
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x, y },
    colors: ['#ef4444', '#f9fafb', '#ec4899', '#fbbf24', '#f59e0b', '#a855f7'],
    zIndex: 9999,
  })
}
