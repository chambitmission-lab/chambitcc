// /dev/genealogy-trail — 가계도 시대순 "말씀 오솔길"을 로그인 없이 진도 있는 상태로 본다.
// 인물·관계는 실제 API(공개 읽기), 진도만 표본: 메시아 라인 앞쪽 ?read=비율 만큼 읽음 + 다음 한 명 반쯤.
import { useMemo, useState } from 'react'
import { useMessianicGenealogy } from '../../hooks/useBibleFigure'
import EraTimeline from '../Bible/Genealogy/components/EraTimeline'
import '../Bible/Genealogy/Genealogy.css'

const readRatio = () => {
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('read')
  const n = q === null ? 0.3 : Number(q)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.3
}

const GenealogyTrailPreview = () => {
  const { data, isLoading } = useMessianicGenealogy()
  const [selected, setSelected] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(true)

  const progress = useMemo(() => {
    if (!data) return {}
    const line = data.nodes
      .filter((n) => n.is_messianic_line)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const cut = Math.round(line.length * readRatio())
    const out: Record<string, number> = {}
    line.forEach((n, i) => {
      if (i < cut) out[n.slug] = 1
      else if (i === cut) out[n.slug] = 0.5
    })
    // 아내·어머니 몇 명도 읽은 것으로 — 시대 완주 메달 확인용
    data.nodes.filter((n) => !n.is_messianic_line).slice(0, 3).forEach((n) => (out[n.slug] = 1))
    return out
  }, [data])

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark px-4 pt-5 pb-24">
      <div className="max-w-[640px] mx-auto">
        <div className="mb-3 flex items-center gap-2 text-[13px]">
          <b className="text-ink-strong">말씀 오솔길 미리보기</b>
          <span className="text-gray-500">선택: {selected ?? '없음'}</span>
          <button
            type="button"
            className="ml-auto h-8 px-3 rounded-full border border-gray-200 dark:border-white/10"
            onClick={() => setLoggedIn((v) => !v)}
          >
            {loggedIn ? '로그아웃 상태로' : '로그인 상태로'}
          </button>
        </div>
        {isLoading || !data ? (
          <p className="text-gray-500">불러오는 중…</p>
        ) : (
          <EraTimeline
            nodes={data.nodes}
            links={data.links}
            readingProgress={loggedIn ? progress : {}}
            selectedSlug={selected}
            onSelect={setSelected}
            isLoggedIn={loggedIn}
            isFiltered={false}
          />
        )}
      </div>
    </div>
  )
}

export default GenealogyTrailPreview
