import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  VISIT_KIND_ICON,
  VISIT_KIND_LABEL,
  fetchMemberDetail,
  fetchRoster,
  type MemberDetail,
  type PastoralVisit,
} from '../../api/pastor'
import { lazyModal } from '../../utils/lazyModal'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import ProfileEditor from './components/ProfileEditor'
import VisitComposer from './components/VisitComposer'
import { Avatar } from './components/ui'
import { agoLabel, formatDay, usePastorGate } from './components/pastorUtils'

// 성도 한 사람 — 좌: 명부·심방 기록 / 우: 활동·맡긴 기도.
// 심방 내용은 내가 쓴 기록만 펼쳐진다(서버가 남의 기록 내용은 아예 보내지 않는다).

const PrayerDetail = lazyModal(() => import('../Home/components/PrayerDetail'))

type VisitTarget = { visit?: PastoralVisit } | null

const PastorMemberDetail = () => {
  const pastor = usePastorGate()
  const { id } = useParams()
  const memberId = Number(id)
  const [editing, setEditing] = useState(false)
  const [visitTarget, setVisitTarget] = useState<VisitTarget>(null)
  const [openPrayerId, setOpenPrayerId] = useState<number | null>(null)

  const { data, isPending, refetch } = useQuery<MemberDetail>({
    queryKey: ['pastor-member', memberId],
    queryFn: () => fetchMemberDetail(memberId),
    enabled: pastor && Number.isFinite(memberId),
    refetchOnMount: 'always',
  })
  // 구역 입력 제안용 — 명부 화면에서 왔으면 캐시가 이미 있다
  const { data: roster } = useQuery({ queryKey: ['pastor-roster'], queryFn: fetchRoster, enabled: editing })

  return (
    <PastorShell>
      <div className="px-4 pt-3">
        <Link to="/pastor/members" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-gray-500 dark:text-white/55 hover:text-brand">
          <span className="material-icons-outlined text-[16px]">arrow_back</span>
          성도 명부
        </Link>
      </div>

      {isPending && !data ? (
        <StatSpinner label="성도 정보를 불러오는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">성도 정보를 불러오지 못했습니다</p>
      ) : (
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="contents lg:block lg:min-w-0">
            <ProfileCard data={data} onEdit={() => setEditing(true)} />
            <VisitsCard data={data} onNew={() => setVisitTarget({})} onEdit={v => setVisitTarget({ visit: v })} />
          </div>
          <div className="contents lg:block">
            <ActivityCard data={data} />
            <SharedPrayersCard data={data} onOpen={setOpenPrayerId} />
          </div>
        </div>
      )}

      {editing && data && (
        <ProfileEditor
          memberId={memberId}
          memberName={data.name}
          profile={data.profile}
          districtSuggestions={(roster?.districts ?? []).map(d => d.value)}
          onClose={() => setEditing(false)}
        />
      )}
      {visitTarget && data && (
        <VisitComposer
          memberId={memberId}
          memberName={data.name}
          visit={visitTarget.visit}
          onClose={() => setVisitTarget(null)}
        />
      )}
      {openPrayerId && (
        <PrayerDetail
          prayerId={openPrayerId}
          onClose={() => {
            setOpenPrayerId(null)
            void refetch()
          }}
        />
      )}
    </PastorShell>
  )
}

// ── 명부 ─────────────────────────────────────────────
const ProfileCard = ({ data, onEdit }: { data: MemberDetail; onEdit: () => void }) => {
  const p = data.profile
  return (
    <div className="px-4 pt-3">
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5">
        <div className="flex items-start gap-4">
          <Avatar name={data.name} url={data.avatar_url} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] font-bold text-ink-strong tracking-[-0.02em]">{data.name}</h2>
              {p?.church_title && (
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand">
                  {p.church_title}
                </span>
              )}
              {p?.district && (
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65">
                  {p.district}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/45">
              앱 가입 {formatDay(data.joined_at, false) || '—'}
              {!data.is_active && ' · 비활성 계정'}
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/[0.1] text-[12.5px] font-semibold text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand"
          >
            <span className="material-icons-outlined text-[16px]">edit</span>
            {p ? '편집' : '명부 작성'}
          </button>
        </div>

        {!p ? (
          <p className="mt-4 py-4 text-center text-[12.5px] text-gray-400 dark:text-white/40 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.1]">
            아직 명부가 없습니다. 직분·구역·생일·가족을 적어 두면 교역자 모두가 함께 봅니다.
          </p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <Info label="생일">
                {p.birthday ? `${formatDay(p.birthday, false).replace(/^\d+년 /, '')}${p.birthday_lunar ? ' (음력)' : ''}` : '—'}
                {p.birthday && <span className="text-gray-400"> · {p.birthday.slice(0, 4)}년생</span>}
              </Info>
              <Info label="연락처">
                {p.phone ? (
                  <a href={`tel:${p.phone}`} className="text-brand font-semibold hover:underline">{p.phone}</a>
                ) : '—'}
              </Info>
              <Info label="교회 등록">{p.registered_at ? formatDay(p.registered_at, false) : '—'}</Info>
              <Info label="주소" wide>{p.address || '—'}</Info>
              <Info label="가족" wide>{p.family_note || '—'}</Info>
            </dl>
            {p.pastoral_note && (
              <div className="mt-4 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3">
                <p className="text-[11px] font-bold text-brand">함께 기억할 것</p>
                <p className="mt-1 text-[13px] text-ink-strong whitespace-pre-wrap leading-relaxed">{p.pastoral_note}</p>
              </div>
            )}
            {p.updated_at && (
              <p className="mt-3 text-[11px] text-gray-400 dark:text-white/35">
                {p.updated_by_name ? `${p.updated_by_name} · ` : ''}
                {formatDay(p.updated_at, false)} 수정
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const Info = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => (
  <div className={wide ? 'col-span-2 lg:col-span-3' : ''}>
    <dt className="text-[11px] font-semibold text-gray-400 dark:text-white/40">{label}</dt>
    <dd className="mt-0.5 text-[13px] text-ink-strong whitespace-pre-wrap">{children}</dd>
  </div>
)

// ── 심방 기록 ────────────────────────────────────────
const VisitsCard = ({
  data,
  onNew,
  onEdit,
}: {
  data: MemberDetail
  onNew: () => void
  onEdit: (v: PastoralVisit) => void
}) => (
  <SectionCard
    title={`심방 기록 ${data.visits.length || ''}`.trim()}
    action={
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand text-white text-[12.5px] font-bold"
      >
        <span className="material-icons-outlined text-[16px]">add</span>
        기록 남기기
      </button>
    }
  >
    {data.visits.length === 0 ? (
      <EmptyHint text="아직 심방 기록이 없습니다" />
    ) : (
      <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200 dark:before:bg-white/[0.08]">
        {data.visits.map(v => (
          <li key={v.id} className="relative flex gap-3">
            <span
              className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                v.is_mine ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-white/55'
              }`}
            >
              <span className="material-icons-outlined text-[17px]">{VISIT_KIND_ICON[v.kind]}</span>
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-bold text-ink-strong">{formatDay(v.visit_date)}</span>
                <span className="text-[12px] text-gray-500 dark:text-white/50">
                  {VISIT_KIND_LABEL[v.kind]} · {v.is_mine ? '나' : v.pastor_name}
                </span>
                {v.is_mine && (
                  <button
                    type="button"
                    onClick={() => onEdit(v)}
                    className="ml-auto text-[12px] font-semibold text-gray-400 hover:text-brand"
                  >
                    고치기
                  </button>
                )}
              </div>
              {v.is_mine ? (
                <>
                  {v.summary && (
                    <p className="mt-1 text-[13px] text-[#4b5563] dark:text-white/70 whitespace-pre-wrap leading-relaxed">
                      {v.summary}
                    </p>
                  )}
                  {v.follow_up && (
                    <p
                      className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg ${
                        v.follow_up_done
                          ? 'bg-gray-100 dark:bg-white/[0.05] text-gray-400 line-through'
                          : 'bg-[var(--brand-soft)] text-brand'
                      }`}
                    >
                      <span className="material-icons-outlined text-[14px]">
                        {v.follow_up_done ? 'task_alt' : 'flag'}
                      </span>
                      {v.follow_up}
                      {v.follow_up_date && ` · ${formatDay(v.follow_up_date, false)}`}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-[11.5px] text-gray-400 dark:text-white/35">내용은 작성한 교역자만 볼 수 있습니다</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    )}
  </SectionCard>
)

// ── 활동 ─────────────────────────────────────────────
const ActivityCard = ({ data }: { data: MemberDetail }) => (
  <SectionCard title="앱에서의 발걸음">
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-white/55">마지막 활동</p>
        <p
          className={`mt-0.5 text-[18px] font-bold tracking-[-0.02em] ${
            data.activity.days_since != null && data.activity.days_since >= 21 ? 'text-[var(--amber)]' : 'text-ink-strong'
          }`}
        >
          {agoLabel(data.activity.days_since)}
        </p>
      </div>
      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-white/55">최근 1년 기록</p>
        <p className="mt-0.5 text-[18px] font-bold tracking-[-0.02em]">
          <span className="brand-text-gradient">{data.activity.total_year.toLocaleString()}</span>
          <span className="text-[12px] font-semibold text-gray-400 ml-0.5">건</span>
        </p>
      </div>
    </div>
    <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
      말씀 읽기·기도·감사·묵상 등 남긴 기록의 수와 시점만 셉니다. 무엇을 썼는지는 보이지 않습니다.
    </p>
  </SectionCard>
)

// ── 맡긴 기도 ─────────────────────────────────────────
const SharedPrayersCard = ({ data, onOpen }: { data: MemberDetail; onOpen: (id: number) => void }) => (
  <SectionCard title="목사님께 맡긴 기도">
    {data.shared_prayers.length === 0 ? (
      <EmptyHint text="실명으로 맡긴 기도가 없습니다" />
    ) : (
      <ul className="space-y-1.5">
        {data.shared_prayers.map(p => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-brand transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 dark:text-white/40">{formatDay(p.created_at, false)}</span>
                {p.is_answered ? (
                  <span className="text-[10.5px] font-bold text-[var(--amber)]">응답됨</span>
                ) : p.pastor_replied ? (
                  <span className="text-[10.5px] font-bold text-brand">답함</span>
                ) : (
                  <span className="text-[10.5px] font-bold text-gray-500 dark:text-white/55">답 기다림</span>
                )}
              </span>
              <span className="block mt-0.5 text-[12.5px] text-ink-strong line-clamp-2">{p.title || p.excerpt}</span>
            </button>
          </li>
        ))}
      </ul>
    )}
    <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
      익명으로 맡긴 기도는 여기에 묶이지 않습니다 — 목양 기도함에서만 볼 수 있어요.
    </p>
  </SectionCard>
)

export default PastorMemberDetail
