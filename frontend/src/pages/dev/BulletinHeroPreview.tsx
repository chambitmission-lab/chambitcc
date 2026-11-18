import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBulletinDetail } from '../../api/bulletin'
import { BULLETIN_PREVIEW_STALE, bulletinKeys, useBulletins } from '../../hooks/useBulletins'
import { useTheme } from '../../contexts/ThemeContext'
import { issueDateText, pageMini, pageThumb, toIssue, type Issue, type Season } from '../News/components/bulletinIssue'

const SEASON_LABEL_KO: Record<Season, string> = { spring: '봄판', summer: '여름판', autumn: '가을판', winter: '겨울판' }
import '../News/components/bulletinShelf.css'
import './bulletinHeroPreview.css'

/**
 * /#/dev/bulletin-hero — /news?tab=bulletin '이번 주 주보' 히어로 개선 시안.
 *   ?v=now 지금 · a 새벽빛 정돈 · b 쪽 미리보기 연동 · c 펼쳐지는 주보 · d 교회 풍경 무대
 *   &device=mobile 390px 폭
 * 운영 주보 데이터(최신 1건)를 그대로 쓴다. 움직임은 처음 한 번만, 반복·사진 흔들림 없음(어르신 기준).
 */

type V = 'now' | 'a' | 'b' | 'c' | 'd'
const VARIANTS: { v: V; label: string; note: string }[] = [
  { v: 'now', label: '지금', note: '현재 운영 화면' },
  { v: 'a', label: 'A 새벽빛 정돈', note: '빛·그림자·종이결 정리, 쪽 띠를 유리 선반으로, 버튼 빛 한 번' },
  { v: 'b', label: 'B 쪽 미리보기', note: '쪽에 올리면 앞장이 그 쪽으로 바뀌고 버튼이 "3쪽부터 읽기"로' },
  { v: 'c', label: 'C 펼쳐지는 주보', note: '들어올 때 표지가 한 번 펼쳐져 1·2쪽이 나란히 — 종이 주보 접힘 그대로' },
  { v: 'd', label: 'D 교회 풍경 무대', note: '계절 교회 사진이 배경, 단풍잎 몇 장이 한 번 내려앉음' },
]

export default function BulletinHeroPreview() {
  const [sp, setSp] = useSearchParams()
  const v = (sp.get('v') as V) || 'a'
  const mobile = sp.get('device') === 'mobile'
  const frame = sp.get('frame') === '1'
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const { data } = useBulletins(1)
  const bulletin = data?.[0]
  const issue = useMemo(() => (bulletin ? toIssue(bulletin) : null), [bulletin])
  const [replay, setReplay] = useState(0)

  const set = (k: string, val: string | null) => {
    const n = new URLSearchParams(sp)
    if (val === null) n.delete(k)
    else n.set(k, val)
    setSp(n, { replace: true })
  }

  if (frame) {
    return (
      <div className="bhp-frame-body">{issue && <HeroVariant key={`${v}-${replay}`} v={v} issue={issue} />}</div>
    )
  }

  const cur = VARIANTS.find(x => x.v === v)
  return (
    <div className="bhp-page">
      <header className="bhp-bar">
        <strong>이번 주 주보 히어로 시안</strong>
        <div className="bhp-tabs">
          {VARIANTS.map(x => (
            <button key={x.v} className={x.v === v ? 'is-on' : ''} onClick={() => { set('v', x.v); setReplay(r => r + 1) }}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="bhp-tools">
          <button onClick={() => setReplay(r => r + 1)}>↻ 다시 재생</button>
          <button onClick={() => set('device', mobile ? null : 'mobile')}>{mobile ? 'PC 폭' : '모바일 폭'}</button>
          <button onClick={toggleTheme}>{isDark ? '라이트' : '다크'}</button>
        </div>
      </header>
      <p className="bhp-note">{cur?.note}</p>

      {mobile ? (
        <iframe
          key={`${v}-${replay}`}
          className="bhp-iframe"
          src={`${window.location.pathname}#/dev/bulletin-hero?v=${v}&frame=1`}
          title="모바일"
        />
      ) : (
        <div className="bhp-stage">
          {issue ? <HeroVariant key={`${v}-${replay}`} v={v} issue={issue} /> : <p>주보 불러오는 중…</p>}
        </div>
      )}
    </div>
  )
}

const Chevron = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

function HeroVariant({ v, issue }: { v: V; issue: Issue }) {
  const { bulletin } = issue
  const { data: preview } = useQuery({
    queryKey: bulletinKeys.preview(bulletin.id),
    queryFn: () => getBulletinDetail(bulletin.id, false),
    staleTime: BULLETIN_PREVIEW_STALE,
  })
  const pages = useMemo(() => [...(preview?.pages ?? [])].sort((a, b) => a.page_number - b.page_number), [preview])
  const cover = bulletin.thumbnail_url ?? bulletin.cover_url ?? (pages[0] && pageThumb(pages[0]))
  const pageCount = bulletin.page_count ?? pages.length
  const dateText = issueDateText(issue, 'ko')
  const [ambientReady, setAmbientReady] = useState(false)

  // 첫 진입 연출 — 부채 한 번(지금·A·B·D), 펼침 한 번(C)
  const [intro, setIntro] = useState(false)
  const [opened, setOpened] = useState(false)
  useEffect(() => {
    if (pages.length < 3) return
    const on = window.setTimeout(() => setIntro(true), 350)
    const off = window.setTimeout(() => setIntro(false), 1300)
    const open = window.setTimeout(() => setOpened(true), 600)
    return () => [on, off, open].forEach(window.clearTimeout)
  }, [pages.length])

  // B — 올린 쪽
  const [peek, setPeek] = useState<number | null>(null)
  const front = v === 'b' && peek !== null && pages[peek] ? pageThumb(pages[peek]) : cover

  const backSrc = (i: number) => (pages[i] ? pageThumb(pages[i]) : undefined)
  const ctaLabel = v === 'b' && peek ? `${peek + 1}쪽부터 읽기` : '펼쳐 읽기'

  const [m, d] = [issue.m, issue.d]

  return (
    <article className={`bsf-hero bhp-hero bhp-${v} bsf-${issue.season}`}>
      {v === 'd' ? (
        <>
          <img className="bhp-scene" src={`/images/visit/scene-${issue.season}-day.webp`} alt="" aria-hidden="true" />
          <span className="bhp-leaves" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}
          </span>
        </>
      ) : (
        cover && (
          <img className={`bsf-amb ${ambientReady ? 'is-ready' : ''}`} src={cover} alt="" aria-hidden="true" onLoad={() => setAmbientReady(true)} />
        )
      )}
      {(v === 'a' || v === 'b' || v === 'c') && <span className="bhp-dawn" aria-hidden="true" />}

      <div className="bsf-hero-grid">
        <div className="bsf-hero-info">
          <div className="flex items-center justify-between gap-2">
            <span className="bsf-chip">
              {v !== 'now' && <span className="bhp-dot" />}이번 주 주보
            </span>
            <span className="bsf-vol">
              제{issue.vol}권 {issue.no}호 · {SEASON_LABEL_KO[issue.season]}
            </span>
          </div>
          {v === 'now' ? (
            <h2 className="bsf-title">{dateText} 주보</h2>
          ) : (
            <h2 className="bsf-title bhp-title">
              <span className="bhp-md">{m}월 {d}일</span>
              <span className="bhp-sun">주일 주보</span>
            </h2>
          )}
          <p className="bsf-sub">
            {pageCount}쪽 · {bulletin.views}명이 함께 읽었어요
          </p>
        </div>

        {v === 'c' ? (
          <button type="button" className={`bhp-book ${opened ? 'is-open' : ''}`} aria-label="펼쳐 읽기">
            <span className="bhp-book-left">{backSrc(1) && <img src={backSrc(1)} alt="" />}</span>
            <span className="bhp-book-right">
              <span className="bhp-leaf">
                <span className="bhp-leaf-front">{cover && <img src={cover} alt="" />}</span>
                <span className="bhp-leaf-back">{backSrc(1) && <img src={backSrc(1)} alt="" />}</span>
              </span>
              <span className="bhp-under">{backSrc(2) && <img src={backSrc(2)} alt="" />}</span>
            </span>
            <span className="bhp-fold" />
          </button>
        ) : (
          <button type="button" className={`bsf-fan ${intro ? 'is-fanned' : ''} ${v !== 'now' ? 'bhp-fan' : ''}`} aria-label="펼쳐 읽기">
            {v !== 'now' && <span className="bhp-floor" />}
            {pages.length >= 3 && <img src={backSrc(2)} alt="" />}
            {pages.length >= 3 && <img src={backSrc(1)} alt="" />}
            {front && <img key={v === 'b' ? front : 'c'} className={v === 'b' ? 'bhp-swap' : ''} src={front} alt={bulletin.title} />}
          </button>
        )}

        <div className="bsf-hero-actions">
          {pages.length > 1 && (
            <div className={`bsf-strip scrollbar-hide ${v !== 'now' ? 'bhp-strip' : ''}`} onPointerLeave={() => setPeek(null)}>
              {pages.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={v === 'b' && (peek ?? 0) === i ? 'is-peek' : ''}
                  onPointerEnter={() => setPeek(i)}
                  onFocus={() => setPeek(i)}
                >
                  <img src={pageMini(p)} alt="" />
                  <i>{i + 1}</i>
                </button>
              ))}
            </div>
          )}
          <button type="button" className={`bsf-cta ${v !== 'now' ? 'bhp-cta' : ''}`}>
            <span key={ctaLabel} className="bhp-cta-label">{ctaLabel}</span>
            {v === 'now' ? <Chevron /> : <span className="bhp-cta-arrow"><Chevron size={14} /></span>}
          </button>
        </div>
      </div>
    </article>
  )
}
