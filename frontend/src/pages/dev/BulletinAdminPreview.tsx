// /dev/bulletins-admin — 주보 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 BulletinDesk 를 표본으로 띄운다. 쪽 그림은 public/ 의 교회 사진을
// 빌려 쓰고, 상세(쪽 목록) 캐시를 미리 채워 API 를 부르지 않는다. 수정·삭제·다시 읽기는 토스트만.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import BulletinDesk, { type BulletinSeg, type BulletinSort } from '../Admin/components/BulletinDesk'
import { adminBulletinDetailKey, overallAi } from '../Admin/components/bulletinDeskUtils'
import InstagramBulletinViewer from '../News/components/InstagramBulletinViewer'
import type { Bulletin } from '../../types/bulletin'
import type { BulletinAiStatus } from '../../api/bulletin'
import { showToast } from '../../utils/toast'

const IMG = [
  '/images/visit/scene-autumn-day.webp',
  '/images/visit/church-day.webp',
  '/images/visit/scene-winter-day.webp',
  '/images/visit/scene-spring-day.webp',
  '/images/visit/scene-summer-day.webp',
  '/images/visit/church-night.webp',
]

const sundays = (() => {
  const out: string[] = []
  const t = new Date()
  t.setDate(t.getDate() + ((7 - t.getDay()) % 7))
  for (let i = 0; i < 16; i++) {
    const d = new Date(t)
    d.setDate(t.getDate() - i * 7)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return out
})()

const SAMPLE: Bulletin[] = sundays.map((date, i) => {
  const [y, m, d] = date.split('-').map(Number)
  return {
    id: 100 - i,
    title: i === 3 ? '추수감사주일 주보' : `${y}년 ${m}월 ${d}일`,
    description: i === 3 ? '추수감사주일 연합예배 순서와 감사 헌금 안내가 함께 실려 있어요.' : '',
    bulletin_date: date,
    views: [3, 18, 17, 9, 26, 62, 10, 4, 8, 12, 7, 15, 5, 11, 6, 9][i],
    is_published: 1,
    created_at: `${date}T10:00:00`,
    updated_at: `${date}T10:00:00`,
    page_count: i === 0 ? 7 : 8,
    thumbnail_url: IMG[i % IMG.length],
  }
})

const done = { state: 'done' as const, attempts: 1, done_at: '2026-11-27T09:12:00' }
const AI: Record<string, BulletinAiStatus> = Object.fromEntries(
  SAMPLE.map((b, i) => [
    String(b.id),
    i === 0
      ? { column: done, news: { state: 'running', attempts: 1 }, digital: { state: 'queued', attempts: 0 } }
      : i === 2
        ? { column: done, news: done, digital: { state: 'gave_up', attempts: 3 } }
        : i >= 6
          ? { column: { state: 'idle', attempts: 0 }, news: { state: 'idle', attempts: 0 }, digital: { state: 'idle', attempts: 0 } }
          : { column: done, news: done, digital: done },
  ]),
) as Record<string, BulletinAiStatus>

const BulletinAdminPreview = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  // 상세 캐시를 미리 채운다 — 미리보기는 API 없이 쪽을 보여 준다
  useState(() => {
    SAMPLE.forEach((b) =>
      qc.setQueryData(adminBulletinDetailKey(b.id), {
        ...b,
        pages: Array.from({ length: b.page_count ?? 0 }, (_, i) => ({
          id: b.id * 100 + i,
          bulletin_id: b.id,
          page_number: i + 1,
          image_url: IMG[(b.id + i) % IMG.length],
          created_at: b.created_at,
        })),
      }),
    )
    return null
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<BulletinSeg>('all')
  const [sort, setSort] = useState<BulletinSort>('recent')
  const [viewer, setViewer] = useState<{ b: Bulletin; page: number } | null>(null)

  const filtered = useMemo(
    () =>
      SAMPLE.filter(
        (b) =>
          (seg === 'all' || (seg === 'year' ? b.bulletin_date.startsWith(String(new Date().getFullYear())) : overallAi(AI[String(b.id)]) === 'attention')) &&
          (!searchTerm || b.title.includes(searchTerm)),
      ).sort((a, b) => (sort === 'views' ? b.views - a.views : sort === 'recent' ? b.bulletin_date.localeCompare(a.bulletin_date) : a.bulletin_date.localeCompare(b.bulletin_date))),
    [seg, searchTerm, sort],
  )

  return (
    <BulletinDesk
      bulletins={SAMPLE}
      filtered={filtered}
      loading={false}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      seg={seg}
      onSegChange={setSeg}
      sort={sort}
      onSortChange={setSort}
      onClearFilters={() => {
        setSearchTerm('')
        setSeg('all')
      }}
      onCreate={() => showToast('미리보기 — 등록 창은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEdit={(b) => showToast(`미리보기 — ${b.title} 수정`, 'info')}
      onDelete={(b) => showToast(`미리보기 — ${b.title} 삭제`, 'info')}
      onViewPublic={() => navigate('/news?tab=bulletin')}
      onOpenViewer={(b, page) => setViewer({ b: qc.getQueryData<Bulletin>(adminBulletinDetailKey(b.id)) ?? b, page })}
      onImportNews={(b) => showToast(`미리보기 — ${b.title} 일정 다시 만들기`, 'info')}
      onImportDigital={(b) => showToast(`미리보기 — ${b.title} 디지털 다시 읽기`, 'info')}
      importingId={null}
      aiStatus={AI}
    >
      {viewer && <InstagramBulletinViewer bulletin={viewer.b} initialPage={viewer.page} onClose={() => setViewer(null)} />}
    </BulletinDesk>
  )
}

export default BulletinAdminPreview
