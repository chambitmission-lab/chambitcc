// 우리반 알림장 목록 (/classes)
// 내가 속한 반 + 반 만들기(교사) + 초대 코드로 참여(학부모)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateClass, useJoinClass, useMyClasses } from '../../hooks/useClassRoom'
import type { ClassSummary } from '../../types/classRoom'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { Avatar, DEPARTMENTS, DeptBadge, timeAgo } from './classUi'
import classNoteHero from '../../assets/hero/class-note.jpg'

const ClassList = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data: classes, isLoading } = useMyClasses(authed)
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const joinClass = useJoinClass()

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
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10">
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

        {/* Hero — 수채화 배경 + 브랜드 블루 워시 */}
        <section className="relative overflow-hidden rounded-[26px] mx-4 mt-5 px-6 py-7 bg-brand text-white shadow-[0_16px_44px_-14px_var(--brand-glow)]">
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
          {/* 브랜드 워시 — 글씨가 앉는 왼쪽은 진하게, 오른쪽 교회·게시판은 살려둔다 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(102deg, rgba(18,62,150,0.96) 0%, rgba(22,76,180,0.93) 46%, rgba(32,100,214,0.74) 80%, rgba(49,130,246,0.24) 100%)',
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
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2.5">
              단톡방에 묻히던 공지,
              <br />
              이제 알림장으로
            </h2>
            <p className="text-[13px] font-light leading-[1.7] text-white/90 mt-2.5 max-w-[17rem]">
              선생님은 공지·암송요절·일정을 올리고, 학부모님은 확인 버튼과 댓글로
              바로 답할 수 있어요.
            </p>
          </div>
        </section>

        {/* 만들기 / 코드 참여 */}
        <section className="px-4 mt-5 space-y-3">
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
            className="w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
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
            <EmptyNote emoji="🔑" text="로그인하면 참여 중인 반이 보여요" />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : !classes || classes.length === 0 ? (
            <EmptyNote
              emoji="🏫"
              text="아직 참여 중인 반이 없어요. 선생님께 받은 초대 코드를 입력하거나, 반을 만들어보세요!"
            />
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} onClick={() => navigate(`/classes/${cls.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreate && <CreateClassSheet onClose={() => setShowCreate(false)} />}
    </div>
  )
}

const EmptyNote = ({ emoji, text }: { emoji: string; text: string }) => (
  <div className="text-center py-12 px-6">
    <span className="text-4xl block mb-3">{emoji}</span>
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
          👥 {cls.member_count}명
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
  const [name, setName] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[2])
  const [description, setDescription] = useState('')

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
      showToast('반이 만들어졌어요! 학부모님들을 초대해볼까요?', 'success')
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

        <button
          type="button"
          onClick={handleCreate}
          disabled={createClass.isPending}
          className="w-full mt-6 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
        >
          {createClass.isPending ? '만드는 중...' : '반 만들기'}
        </button>
        <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2">
          만든 뒤 초대 링크를 카톡방에 공유하면 학부모님들이 바로 들어올 수 있어요
        </p>
      </div>
    </div>
  )
}

export default ClassList
