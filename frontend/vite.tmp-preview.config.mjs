// 임시: 운영 API 를 프록시로 붙여 로컬 미리보기 (작업 끝나면 삭제)
import base from './vite.config.ts'
const A = 'https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app'
export default async env => {
  const c = typeof base === 'function' ? await base(env) : base
  return {
    ...c,
    server: {
      ...(c.server || {}),
      port: 5191,
      strictPort: true,
      proxy: { '/__api': { target: A, changeOrigin: true, rewrite: p => p.replace(/^\/__api/, '') } },
    },
  }
}
