import { defineConfig } from 'vitest/config'

// vite.config.ts 와 분리 — SEO 주입·version.json 같은 빌드 플러그인을 테스트가 끌지 않도록.
// TZ 를 일부러 서울이 아닌 곳으로 두어, 서울 고정 포매터가 기기 타임존과 무관함을 테스트가 보장한다.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: { TZ: 'America/Los_Angeles' },
  },
})
