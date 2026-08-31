// 우리반 알림장 목록 (/classes)
// 내가 속한 반 + 반 만들기(교사) + 초대 코드로 참여(학부모)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAddClassMembers,
  useCreateClass,
  useJoinClass,
  useMyClasses,
} from '../../hooks/useClassRoom'
import type { ClassSummary } from '../../types/classRoom'
import type { CapsuleRecipient } from '../../types/timeCapsule'
import MemberSearchInput from '../../components/common/MemberSearchInput'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { Avatar, DEPARTMENTS, DeptBadge, timeAgo } from './classUi'
import { BellIcon, KeyIcon, PeopleIcon, SchoolIcon, type IconFn } from './ClassIcons'
import classNoteHero from '../../assets/hero/class-note.jpg'

const ClassList = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data: classes, isLoading } = useMyClasses(authed)
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const joinClass = useJoinClass()

  // 히어로 문구용 — 내 반이 있으면 소개 대신 현황을 띄운다
  const hasClasses = (classes?.length ?? 0) > 0
  // 마지막 알림이 가장 최근인 반 (알림이 한 번도 없는 반은 제외)
  const latestPost = classes?.reduce<ClassSummary | null>(
    (best, cls) =>
      cls.last_post_at &&
      (!best || cls.last_post_at > best.last_post_at!)
        ? cls
        : best,
    null,
  )
  // 우측 레일 요약 — 선생님으로 계신 반 수
  const teacherCount = classes?.filter((c) => c.is_teacher).length ?? 0

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    if (!authed) {
      showToast('로그인이 필요합니다', 'error')
      navigate('/login')
      return
    }
    try {
      const detail = await joinClass.mutateAsync({ inviteCode: code })
      showToast('반에 참여했어요!', 'success')
      navigate(`/classes/${detail.id}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참여에 실패했습니다', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(내 반 목록) + 우측 레일(만들기·참여·요약) 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            aria-label="홈으로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-6">
            우리반 알림장
          </h1>
        </div>

        {/* Hero — 수채화 배경 + 브랜드 블루 워시.
            이미 반에 속한 사람에겐 기능 소개 대신 "내 반 현황"을 보여준다. */}
        <section className="relative isolate overflow-hidden rounded-[26px] mx-4 mt-5 px-6 py-7 min-h-[168px] flex flex-col justify-center bg-brand text-white shadow-[0_12px_32px_-16px_var(--brand-glow)] ring-1 ring-white/[0.14] dark:ring-white/[0.1]">
          {/* 배경 그림 — 교회와 주일학교 풍경(수채화) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${classNoteHero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 46%',
            }}
            aria-hidden
          />
          {/* 브랜드 워시 — 왼쪽은 글씨 가독성만 확보할 정도로 은은하게, 오른쪽 교회·게시판은 살려둔다 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(102deg, rgba(20,66,158,0.82) 0%, rgba(24,80,186,0.72) 46%, rgba(34,102,216,0.5) 80%, rgba(49,130,246,0.16) 100%)',
            }}
            aria-hidden
          />
          {/* 하단 가독성 스크림 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(6,22,55,0) 42%, rgba(6,22,55,0.32) 76%, rgba(6,22,55,0.58) 100%)',
            }}
            aria-hidden
          />
          <div
            className="relative z-10"
            style={{ textShadow: '0 1px 14px rgba(4,16,44,0.45)' }}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-white/75">
              Class Note
            </span>
            {hasClasses ? (
              <>
                <h2 className="text-[24px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2.5">
                  참여 중인 반 {classes!.length}곳
                </h2>
                {latestPost ? (
                  // 반 이름이 길어도 줄바꿈으로 무너지지 않게 — 이름만 줄이고 한 줄 유지
                  <p className="flex items-center gap-2 text-[13px] text-white/90 mt-3 max-w-[19rem]">
                    <span className="shrink-0 opacity-75">최근 소식</span>
                    <span aria-hidden className="shrink-0 w-px h-3 bg-white/30" />
                    <span className="min-w-0 truncate font-bold">
                      {latestPost.name}
                    </span>
                    <span className="shrink-0 opacity-90">
                      {timeAgo(latestPost.last_post_at!)}
                    </span>
                  </p>
                ) : (
                  <p className="text-[13px] font-light leading-[1.7] text-white/90 mt-2.5 max-w-[17rem] break-keep">
                    아직 올라온 알림이 없어요. 반에 들어가 첫 소식을 남겨보세요.
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-[24px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2.5">
                  반에 참여해 보세요
                </h2>
                <p className="text-[13px] font-light leading-[1.7] text-white/90 mt-2.5 max-w-[17rem] break-keep">
                  공지·암송요절·일정을 반별로 받아보고, 확인 버튼과 댓글로 바로
                  답할 수 있어요.
                </p>
              </>
            )}
          </div>
        </section>

        {/* 만들기 / 코드 참여 — lg에선 우측 레일의 같은 액션이 대신한다 */}
        <section className="px-4 mt-5 space-y-3 lg:hidden">
          <button
            type="button"
            onClick={() => {
              if (!authed) {
                showToast('로그인이 필요합니다', 'error')
                navigate('/login')
                return
              }
              setShowCreate(true)
            }}
            className="relative w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold hover:-translate-y-0.5 transition-all seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]"
          >
            + 우리 반 만들기 (선생님)
          </button>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="초대 코드로 참여 (예: AB12CD34)"
              maxLength={8}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={joinClass.isPending || joinCode.trim().length < 4}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-40"
            >
              참여
            </button>
          </div>
        </section>

        {/* 내 반 목록 */}
        <section className="px-4 pt-8">
          <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-4 px-0.5">
            내 반
          </h3>
          {!authed ? (
            <EmptyNote icon={KeyIcon} text="로그인하면 참여 중인 반이 보여요" />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : !classes || classes.length === 0 ? (
            <EmptyNote
              icon={SchoolIcon}
              text="아직 참여 중인 반이 없어요. 선생님께 받은 초대 코드를 입력하거나, 반을 만들어보세요!"
            />
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
              {classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} onClick={() => navigate(`/classes/${cls.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 우측 위젯 레일 (lg+) — 반 만들기·코드 참여를 항상 손 닿는 곳에,
          본문은 반 카드에만 집중하게 한다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
          <button
            type="button"
            onClick={() => {
              if (!authed) {
                showToast('로그인이 필요합니다', 'error')
                navigate('/login')
                return
              }
              setShowCreate(true)
            }}
            className="relative w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold hover:-translate-y-0.5 transition-all seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]"
          >
            + 우리 반 만들기 (선생님)
          </button>

          <p className="mt-4 mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
            초대 코드로 참여
          </p>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="예: AB12CD34"
              maxLength={8}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white dark:bg-[#15151d] border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={joinClass.isPending || joinCode.trim().length < 4}
              className="shrink-0 px-3.5 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-40"
            >
              참여
            </button>
          </div>
        </section>

        {hasClasses && (
          <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
            <p className="mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              한눈에
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                  참여 중인 반
                </span>
                <span className="text-[16px] font-bold text-brand tabular-nums">
                  {classes!.length}
                </span>
              </div>
              {teacherCount > 0 && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                    선생님으로 계신 반
                  </span>
                  <span className="text-[16px] font-bold text-ink-strong tabular-nums">
                    {teacherCount}
                  </span>
                </div>
              )}
            </div>
            {latestPost?.last_post_at && (
              <button
                type="button"
                onClick={() => navigate(`/classes/${latestPost.id}`)}
                className="mt-3 w-full flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--card-border)] text-left hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
              >
                <BellIcon width={13} height={13} className="shrink-0 text-brand" />
                <span className="flex-1 min-w-0 truncate text-[12.5px] font-bold text-ink-strong">
                  {latestPost.name}
                </span>
                <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">
                  {timeAgo(latestPost.last_post_at)}
                </span>
              </button>
            )}
          </section>
        )}
      </aside>
      </div>

      {showCreate && <CreateClassSheet onClose={() => setShowCreate(false)} />}
    </div>
  )
}

const EmptyNote = ({ icon: Icon, text }: { icon: IconFn; text: string }) => (
  <div className="text-center py-12 px-6">
    <Icon width={36} height={36} className="mx-auto mb-3 text-gray-400 dark:text-white/40" />
    <p className="text-[13px] text-gray-500 dark:text-white/55 leading-[1.7]">{text}</p>
  </div>
)

const ClassCard = ({ cls, onClick }: { cls: ClassSummary; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985]"
  >
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center">
        <Avatar name={cls.name} size={28} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="flex-1 min-w-0 text-[15px] font-bold text-ink-strong truncate">
            {cls.name}
          </h4>
          <DeptBadge department={cls.department} />
          {cls.is_teacher && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[11px] font-bold leading-none">
              교사
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-400 dark:text-white/45 mt-1">
          <PeopleIcon width={12} height={12} className="inline-block align-[-1.5px] mr-0.5" />
          {cls.member_count}명
          {cls.teacher_names.length > 0 && ` · ${cls.teacher_names.join('·')} 선생님`}
          {cls.last_post_at && (
            <span className="ml-1.5 font-semibold text-brand">
              최근 알림 {timeAgo(cls.last_post_at)}
            </span>
          )}
        </p>
      </div>
    </div>
  </button>
)

// ── 반 만들기 바텀시트 ──
const CreateClassSheet = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const createClass = useCreateClass()
  const addMembers = useAddClassMembers()
  const [name, setName] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[2])
  const [description, setDescription] = useState('')
  // 앱 사용자 바로 추가 — 검색해서 여러 명 선택, 반 생성 직후 한 번에 추가한다
  const [picked, setPicked] = useState<CapsuleRecipient[]>([])

  useModalBackButton(onClose)

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('반 이름을 입력해주세요', 'error')
      return
    }
    try {
      const cls = await createClass.mutateAsync({
        name: name.trim(),
        department,
        description: description.trim() || null,
      })
      let addFailed = false
      if (picked.length > 0) {
        try {
          await addMembers.mutateAsync({
            classId: cls.id,
            userIds: picked.map((p) => p.id),
          })
        } catch {
          addFailed = true
        }
      }
      if (addFailed) {
        showToast('반은 만들어졌지만 멤버 추가에 실패했어요. 초대 코드를 공유해주세요', 'error')
      } else if (picked.length > 0) {
        showToast(`반이 만들어졌어요! ${picked.length}명을 바로 초대했어요`, 'success')
      } else {
        showToast('반이 만들어졌어요! 학부모님들을 초대해볼까요?', 'success')
      }
      onClose()
      navigate(`/classes/${cls.id}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '반 만들기에 실패했습니다', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4" />
        <h3 className="text-[17px] font-bold text-ink-strong mb-1">우리 반 만들기</h3>
        <p className="text-[12px] text-gray-400 dark:text-white/45 mb-4">
          반을 만든 분이 담당 선생님이 돼요. 알림장 글은 선생님만 쓸 수 있어요.
        </p>

        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mb-1.5">
          부서
        </label>
        <div className="flex gap-2 flex-wrap">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDepartment(d)}
              className={`px-3.5 py-2 rounded-full text-[13px] font-bold transition-all ${
                department === d
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mt-5 mb-1.5">
          반 이름
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="예: 2026 유년부 1-3반"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand"
        />

        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mt-5 mb-1.5">
          소개 (선택)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          placeholder="예: 주미 선생님 반이에요. 매주 암송요절을 올려드려요!"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand"
        />

        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mt-5 mb-1.5">
          멤버 바로 추가 (선택)
        </label>
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {picked.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[var(--brand-soft)] text-brand"
              >
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-brand/15 text-[10px] font-extrabold flex items-center justify-center">
                    {u.display_name.charAt(0)}
                  </span>
                )}
                <span className="text-[12.5px] font-bold">{u.display_name}</span>
                <button
                  type="button"
                  onClick={() => setPicked((prev) => prev.filter((p) => p.id !== u.id))}
                  aria-label={`${u.display_name} 빼기`}
                  className="text-[11px] font-bold opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <MemberSearchInput
          excludeIds={picked.map((p) => p.id)}
          onPick={(u) => setPicked((prev) => [...prev, u])}
          emptyHint="앱에서 찾을 수 없어요. 아직 가입 전이라면 만든 뒤 초대 코드를 공유해주세요."
        />
        <p className="px-1 mt-1.5 text-[11px] text-gray-400 dark:text-white/35 leading-[1.6]">
          선택한 분들은 반이 만들어지면 바로 멤버로 들어오고, 초대 알림을 받아요.
        </p>

        <button
          type="button"
          onClick={handleCreate}
          disabled={createClass.isPending || addMembers.isPending}
          className="w-full mt-6 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
        >
          {createClass.isPending || addMembers.isPending ? '만드는 중...' : '반 만들기'}
        </button>
        <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2">
          만든 뒤 초대 링크를 카톡방에 공유하면 학부모님들이 바로 들어올 수 있어요
        </p>
      </div>
    </div>
  )
}

export default ClassList
