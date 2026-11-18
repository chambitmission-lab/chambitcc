// 임시 — 로컬 확인용(운영 API 동일 출처 프록시). 커밋하지 않는다.
import { mergeConfig, type UserConfig } from 'vite'
import base from './vite.config'

export default async (env: any) => {
  const b: UserConfig = typeof base === 'function' ? await (base as any)(env) : (base as UserConfig)
  return mergeConfig(b, {
    server: {
      proxy: {
        '/api': { target: 'https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app', changeOrigin: true },
      },
    },
  })
}
