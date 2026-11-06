// /dev/genealogy-head — 가계도 상단 노선 카드 + 본문 노선을 로그인 없이 진도 있는 상태로 본다.
// 인물·관계는 실제 API(공개 읽기), 진도만 표본: 노선 앞쪽 ?read=비율 만큼 읽음(1 = 완주). 상태 버튼으로 비로그인·진행 중·완주 전환.
import { useMemo, useState } from 'react'
import { useMessianicGenealogy } from '../../hooks/useBibleFigure'
import GenealogyHeader from '../Bible/Genealogy/components/GenealogyHeader'
import GenealogyTree from '../Bible/Genealogy/components/GenealogyTree'
import { buildRoute } from '../Bible/Genealogy/genealogyRoute'
import { smoothScrollToElement } from '../../utils/scrollTo'
import '../Bible/Genealogy/Genealogy.css'

type Mode = 'guest' | 'progress' | 'done'

const readRatio = () => {
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('read')
  const n = q === null ? 0.6 : Number(q)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.6
}

const GenealogyHeadPreview = () => {
  const { data, isLoading } = useMessianicGenealogy()
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('progress')
  const route = useMemo(() => (data ? buildRoute(data.nodes, data.links) : null), [data])

  const progress = useMemo(() => {
    if (!route) return {}
    const figs = route.slots.filter((s) => s.kind === 'fig')
    const cut = mode === 'done' ? figs.length : Math.round(figs.length * readRatio())
    const out: Record<string, number> = {}
    figs.forEach((s, i) => {
      if (i < cut) out[s.id] = 1
      else if (i === cut) out[s.id] = 0.5
    })
    return out
  }, [route, mode])

  const loggedIn = mode !== 'guest'
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark px-4 pt-5 pb-24">
      <div className="max-w-[820px] mx-auto">
        <div className="mb-3 flex items-center gap-2 text-[13px]">
          <b className="text-ink-strong">가계도 상단 미리보기</b>
          <span className="text-gray-500">선택: {selected ?? '없음'}</span>
          <span className="ml-auto inline-flex gap-1">
            {(['guest', 'progress', 'done'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`h-8 px-3 rounded-full border ${mode === m ? 'border-brand text-brand' : 'border-gray-200 dark:border-white/10'}`}
              >
                {m === 'guest' ? '비로그인' : m === 'progress' ? '진행 중' : '완주'}
              </button>
            ))}
          </span>
        </div>
        {isLoading || !data ? (
          <p className="text-gray-500">불러오는 중…</p>
        ) : (
          <>
            <GenealogyHeader
              route={route}
              readingProgress={loggedIn ? progress : {}}
              isLoggedIn={loggedIn}
              showMetro
              onJumpEra={(k) =>
                smoothScrollToElement(document.querySelector(`.grl [data-sign="${k}"]`), { offset: 150 })
              }
              onSelectFigure={setSelected}
              toolbar={<span className="text-[12.5px] text-gray-500 px-1">툴바 자리(보기 전환·필터·검색)</span>}
            />
            <GenealogyTree
              nodes={data.nodes}
              links={data.links}
              readingProgress={loggedIn ? progress : {}}
              selectedSlug={selected}
              onSelect={setSelected}
              isLoggedIn={loggedIn}
              highlightSlugs={null}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default GenealogyHeadPreview
