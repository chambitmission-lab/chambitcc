// /dev/weekly-prayers-admin — 공동 기도제목 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 WeeklyPrayerDesk 를 표본으로 띄운다. 상세는 React Query 캐시에
// 미리 심어 두고, 공개 스위치·삭제는 이 화면 안에서만 바뀐다(서버 호출 없음).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import WeeklyPrayerDesk from '../Admin/components/WeeklyPrayerDesk'
import WeeklyPrayerComposer, { type WeeklyPrayerDraft } from '../Admin/components/WeeklyPrayerComposer'
import { filterWeeks, nextFreeSunday, upcomingSunday, weekDateOf, type WpSeg } from '../Admin/components/weeklyPrayerDeskUtils'
import { weeklyPrayerKeys } from '../../hooks/queryKeys'
import type { WeeklyPrayer, WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import { showToast } from '../../utils/toast'

const ITEMS = [
  { title: '나라와 민족을 위하여', body: '이 땅의 지도자들에게 지혜를 주시고, 공의와 평화가 강물같이 흐르게 하소서.', scripture: '딤전 2:1-2' },
  { title: '다음 세대를 위하여', body: '교회학교 아이들과 청년들이 말씀 안에서 자라 세상의 빛이 되게 하소서.', scripture: '시 78:4' },
  { title: '', body: '아픈 성도들과 그 가정을 기억하사 치료의 광선을 비추어 주옵소서.', scripture: null },
  { title: '성탄과 대림절을 준비하며', body: '오실 주님을 기다리는 마음으로 한 주를 살게 하소서.', scripture: '사 9:6' },
]

const ymdShift = (weeks: number) => {
  const d = weekDateOf(upcomingSunday())
  d.setDate(d.getDate() + weeks * 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 이번 주는 비워 둬서 '아직이에요' 띠를 본다 — ?this=1 이면 이번 주도 채운다
const build = (withThisWeek: boolean): WeeklyPrayer[] =>
  [1, ...(withThisWeek ? [0] : []), -1, -2, -3, -4, -5, -7].map((w, i) => ({
    id: 100 + i,
    week_date: ymdShift(w),
    title: w === 1 ? '대림절 첫째 주 기도제목' : '기도제목',
    is_published: w !== 1 && w !== -5,
    prayed_user_count: Math.max(0, 14 - i * 2),
    items: ITEMS.slice(0, 2 + (i % 3)).map((it, j) => ({ ...it, id: i * 10 + j, amen_count: Math.max(0, 9 - i - j * 2) })),
  }))

const toListItem = (p: WeeklyPrayer): WeeklyPrayerListItem => ({
  id: p.id,
  week_date: p.week_date,
  title: p.title,
  is_published: p.is_published,
  item_count: p.items.length,
  preview: p.items[0]?.title || p.items[0]?.body?.split('.')[0] || null,
  amen_total: p.items.reduce((s, it) => s + (it.amen_count ?? 0), 0),
})

const WeeklyPrayerAdminPreview = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const seed = useMemo(() => {
    const all = build(new URLSearchParams(window.location.hash.split('?')[1]).get('this') === '1')
    all.forEach((p) => qc.setQueryData(weeklyPrayerKeys.detail(p.id), p))
    return all
  }, [qc])
  const [list, setList] = useState<WeeklyPrayerListItem[]>(() => seed.map(toListItem))
  const [seg, setSeg] = useState<WpSeg>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<WeeklyPrayerDraft | null>(null)
  const filtered = useMemo(() => filterWeeks(list, seg), [list, seg])

  const copy = (p: WeeklyPrayerListItem) => {
    const full = seed.find((s) => s.id === p.id)
    setDraft({ editingId: null, weekDate: nextFreeSunday(list), title: p.title, isPublished: true, items: full?.items ?? [], copiedFrom: p.week_date })
  }

  return (
    <>
      <WeeklyPrayerDesk
        list={list}
        filtered={filtered}
        loading={false}
        seg={seg}
        onSegChange={setSeg}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setDraft({ editingId: null, weekDate: nextFreeSunday(list), title: '기도제목', isPublished: true, items: [] })}
        onStartThisWeek={() => copy(filterWeeks(list, 'all').find((p) => p.week_date < upcomingSunday()) ?? list[0])}
        onBack={() => navigate(-1)}
        onViewPublic={() => navigate('/prayer-topics')}
        onEdit={(p) => {
          const full = seed.find((s) => s.id === p.id)
          setDraft({ editingId: p.id, weekDate: p.week_date, title: p.title, isPublished: p.is_published, items: full?.items ?? [] })
        }}
        onTogglePublished={(p) => setList((l) => l.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))}
        onDelete={(p) => setList((l) => l.filter((x) => x.id !== p.id))}
        onCopyToNew={copy}
        onOpenScreen={() => showToast('미리보기 — 예배 스크린은 실제 화면에서', 'info')}
      />
      {draft && (
        <WeeklyPrayerComposer
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={async () => {
            showToast('미리보기 — 저장은 실제 화면에서', 'info')
            setDraft(null)
          }}
          onParse={async (text) =>
            text
              .split(/\n\s*\n/)
              .map((b) => b.trim())
              .filter(Boolean)
              .map((b) => {
                const [first, ...rest] = b.split('\n')
                return { title: first.replace(/^\d+\.\s*/, ''), body: rest.join('\n').replace(/^\s*"|"\s*$/g, ''), scripture: null }
              })
          }
        />
      )}
    </>
  )
}

export default WeeklyPrayerAdminPreview
