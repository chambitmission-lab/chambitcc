import { lazy, Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { getReadingAids, setReadingAid, subscribeReadingAids } from '../data/readingAids'
import {
  getMessiahPromises,
  isMessiahReady,
  KIND_HINT,
  KIND_LABEL,
  loadMessiah,
  STORY_EPISODE,
  THEME_HINT,
  THEME_LABEL,
  THEME_ORDER,
  type MessiahPromise,
  type PromiseKind,
} from '../data/messiah'
import { parseRef } from '../data/crossRefs'
import { canonicalBookName } from '../../Sermon/utils/sermonMeta'
import { CrownIcon, CrossIcon, SparkleIcon } from '../components/messiah/PromiseIcons'
import { smoothScrollToElement } from '../../../utils/scrollTo'
import '../styles/messiah.css'
import './PromiseMap.css'

const MessiahSheet = lazy(() => import('../components/MessiahSheet'))

/** 목록 한 줄용 짧은 참조 — "사 7:14" 대신 책 이름 전체("이사야 7:14")로 (초보자가 약칭을 모른다) */
const shortRef = (s: string) => {
  const r = parseRef(s)
  return `${canonicalBookName(r.b)} ${r.c}:${r.v}${r.to > r.v ? `-${r.to}` : ''}`
}

type KindFilter = 'all' | PromiseKind
const FILTERS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'prophecy', label: KIND_LABEL.prophecy },
  { key: 'reading', label: KIND_LABEL.reading },
  { key: 'type', label: KIND_LABEL.type },
]

/**
 * 약속 지도(/bible/promises) — 창세기의 첫 약속부터 새 하늘과 새 땅까지, 예수님 이야기의 여섯 마디로
 * 구약 약속과 신약 성취 58쌍을 한 줄로 잇는다. 줄을 누르면 읽기 화면과 같은 약속 시트가 열린다.
 * ?p=<id> 로 들어오면(약속 시트 꼬리 링크) 그 줄로 내려가 잠깐 밝혀 준다.
 * 읽기 화면 표시(읽기 도움 '약속과 성취')도 여기서 켤 수 있다 — Aa 설정을 모르는 분들을 위한 두 번째 입구.
 */
const PromiseMap = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const focusId = params.get('p')
  const [ready, setReady] = useState(isMessiahReady)
  const [filter, setFilter] = useState<KindFilter>('all')
  const [open, setOpen] = useState<MessiahPromise | null>(null)
  const [flash, setFlash] = useState<string | null>(focusId)
  const showInReader = useSyncExternalStore(subscribeReadingAids, getReadingAids).messiah

  useEffect(() => {
    if (ready) return
    let alive = true
    loadMessiah().then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [ready])

  const all = useMemo(() => (ready ? getMessiahPromises() : []), [ready])
  const groups = useMemo(
    () =>
      THEME_ORDER.map((theme) => ({
        theme,
        items: all.filter((p) => p.theme === theme && (filter === 'all' || p.kind === filter)),
      })).filter((g) => g.items.length),
    [all, filter],
  )

  // 시트 꼬리 링크로 들어온 경우 — 그 약속 줄로 내려가 잠깐 밝힌다
  useEffect(() => {
    if (!ready || !focusId) return
    const el = document.getElementById(`promise-${focusId}`)
    if (el) smoothScrollToElement(el, { offset: Math.round(window.innerHeight * 0.35) })
    const t = window.setTimeout(() => setFlash(null), 2400)
    return () => window.clearTimeout(t)
  }, [ready, focusId])

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="read" />
        <div className="max-w-md mx-auto min-h-screen pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:pb-8">
          {/* 모바일 헤더 */}
          <div className="lg:hidden sticky top-14 z-20 bg-[var(--app-canvas)] dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => navigate('/bible')}
              className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
              aria-label="성경으로"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="text-sm font-semibold">성경</span>
            </button>
            <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10">약속과 성취</h1>
          </div>

          <div className="pm-page">
            {/* 머리 */}
            <header className="pm-hero">
              <SparkleIcon size={30} className="pm-hero__spark" />
              <p className="pm-hero__eyebrow">구약에서 신약으로</p>
              <h2 className="pm-hero__title">
                하나의 이야기로
                <br />
                이어지는 약속 {all.length || ''}
              </h2>
              <p className="pm-hero__lead">
                구약 곳곳에 담긴 메시아의 약속이 신약에서 예수님으로 이루어져요. 신약이 직접 이어 놓은
                곳만 모았어요.
              </p>
              <button type="button" className="pm-hero__story" onClick={() => navigate('/bible/story')}>
                이야기로 먼저 만나기 · 처음 만나는 성경 ‘약속의 실’
                <span className="material-icons-round text-[16px]" aria-hidden>chevron_right</span>
              </button>
            </header>

            {/* 읽기 화면 표시 켜기 */}
            <button
              type="button"
              className={`pm-toggle${showInReader ? ' is-on' : ''}`}
              aria-pressed={showInReader}
              onClick={() => setReadingAid('messiah', !showInReader)}
            >
              <span className="pm-toggle__icons" aria-hidden>
                <span className="pm-toggle__ot"><CrownIcon size={14} /></span>
                <span className="pm-toggle__nt"><CrossIcon size={14} /></span>
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="pm-toggle__title">성경 읽을 때 표시하기</span>
                <span className="pm-toggle__sub">
                  {showInReader
                    ? '읽기 화면에서 약속 절은 금빛, 성취 절은 푸른 줄로 보여요'
                    : '켜면 읽기 화면에서 이 절들을 바로 알아볼 수 있어요'}
                </span>
              </span>
              <span className="pm-switch" aria-hidden />
            </button>

            {/* 종류 필터 */}
            <div className="pm-filters" role="tablist" aria-label="약속의 종류">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`pm-filter pm-filter--${f.key}${filter === f.key ? ' is-on' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {filter !== 'all' && <p className="pm-filter-hint">{KIND_HINT[filter]}</p>}

            {/* 여섯 마디 */}
            {!ready ? (
              <p className="pm-loading">약속을 펼치는 중…</p>
            ) : (
              <ol className="pm-line">
                {groups.map((g) => {
                  return (
                    <li key={g.theme} className="pm-station">
                      <div className="pm-station__head">
                        <span className="pm-station__num">{THEME_ORDER.indexOf(g.theme) + 1}</span>
                        <div className="min-w-0">
                          <h3 className="pm-station__title">{THEME_LABEL[g.theme]}</h3>
                          <p className="pm-station__hint">{THEME_HINT[g.theme]}</p>
                        </div>
                      </div>
                      <ul className="pm-items">
                        {g.items.map((p) => (
                          <li key={p.id}>
                            <button
                              id={`promise-${p.id}`}
                              type="button"
                              className={`pm-item${flash === p.id ? ' is-flash' : ''}`}
                              onClick={() => setOpen(p)}
                            >
                              <span className="pm-item__body">
                                <span className="pm-item__top">
                                  <span className="pm-item__title">{p.title}</span>
                                  <span className={`pm-kind pm-kind--${p.kind}`}>{KIND_LABEL[p.kind]}</span>
                                  {STORY_EPISODE[p.id] && <span className="pm-kind pm-kind--story">이야기</span>}
                                </span>
                                <span className="pm-item__refs">
                                  <span className="pm-item__ot">{shortRef(p.ot)}</span>
                                  <span className="pm-item__arrow" aria-hidden>→</span>
                                  <span className="pm-item__nt">{shortRef(p.nt[0])}{p.nt.length > 1 ? ` 외 ${p.nt.length - 1}` : ''}</span>
                                </span>
                              </span>
                              <span className="material-icons-round pm-item__go" aria-hidden>chevron_right</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ol>
            )}

            <p className="pm-foot">
              신약이 직접 인용하거나 예수님께 이어 설명한 곳만 담았어요. 직접 예언은 구약이 앞일을 말한 곳,
              신약의 해석은 시편 같은 고백을 신약이 예수님께 이어 읽은 곳, 상징과 모형은 구약의 인물·사건을 신약이
              예수님의 그림으로 설명한 곳이에요.
            </p>
          </div>
        </div>
      </div>

      {open && (
        <Suspense fallback={null}>
          <MessiahSheet promises={[open]} fromMap onClose={() => setOpen(null)} />
        </Suspense>
      )}

      <BibleBottomNav active="read" />
    </div>
  )
}

export default PromiseMap
