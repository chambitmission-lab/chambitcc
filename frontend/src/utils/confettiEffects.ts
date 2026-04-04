// Confetti 보상 효과 유틸리티

import confetti from 'canvas-confetti'

/**
 * 레벨업 축하 효과
 */
export const celebrateLevelUp = () => {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    })
  }, 250)
}

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

/**
 * 정원 완성 축하 효과
 */
export const celebrateGardenMilestone = () => {
  const duration = 5000
  const animationEnd = Date.now() + duration

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#ef4444', '#f9fafb', '#ec4899', '#fbbf24', '#f59e0b', '#a855f7'],
      zIndex: 9999,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#ef4444', '#f9fafb', '#ec4899', '#fbbf24', '#f59e0b', '#a855f7'],
      zIndex: 9999,
    })
  }, 100)
}

/**
 * 연속 기도 축하 효과
 */
export const celebrateStreak = (days: number) => {
  const emoji = days >= 30 ? '🔥' : days >= 7 ? '⭐' : '✨'
  
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    scalar: 1.2,
    shapes: [emoji as any],
    zIndex: 9999,
  })
}

/**
 * 간단한 축하 효과
 */
export const celebrateSimple = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    zIndex: 9999,
  })
}
