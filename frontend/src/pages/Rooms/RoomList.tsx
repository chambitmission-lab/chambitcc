// 공동 묵상방 목록 (/rooms)
// 내가 참여 중인 방 + 새 방 만들기 (본문 범위를 기간에 절 단위 자동 분배)
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBibleBooks } from '../../hooks/useBible'
import { useCreateRoom, useJoinRoom, useMyRooms } from '../../hooks/useMeditationRoom'
import type { RoomSummary } from '../../types/meditationRoom'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'

const DURATION_PRESETS = [3, 7, 14, 21, 30]
const EMOJI_PRESETS = ['🕊️', '🌱', '🔥', '🌙', '🌊', '⭐']

const RoomList = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data: rooms, isLoading } = useMyRooms(authed)
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const joinRoom = useJoinRoom()

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    try {
      const room = await joinRoom.mutateAsync(code)
      showToast('묵상방에 참여했어요!', 'success')
      navigate(`/rooms/${room.id}`)
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
            onClick={() => navigate('/bible')}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            aria-label="성경으로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">성경</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white mx-auto pr-10">
            공동 묵상방
          </h1>
        </div>

        {/* Hero */}
        <section className="relative mx-4 mt-5 overflow-hidden rounded-[26px] px-6 py-8 bg-brand shadow-[0_10px_34px_-12px_var(--brand-glow)]">
          {/* 배경 일러스트: 올리브 가지를 문 비둘기 + 함께 퍼지는 물결 */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 400 260"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            aria-hidden="true"
          >
            {/* 오른쪽 위 은은한 빛 */}
            <circle cx="386" cy="12" r="96" fill="white" opacity="0.05" />
            <circle cx="386" cy="12" r="56" fill="white" opacity="0.05" />

            {/* 물결 동심원 */}
            <circle cx="346" cy="206" r="132" stroke="white" strokeWidth="1.4" opacity="0.09" />
            <circle cx="346" cy="206" r="97" stroke="white" strokeWidth="1.4" opacity="0.11" />
            <circle cx="346" cy="206" r="64" stroke="white" strokeWidth="1.4" opacity="0.13" />

            {/* 반짝임 */}
            <path d="M312 42 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="white" opacity="0.26" />
            <path d="M372 92 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 Z" fill="white" opacity="0.2" />
            <circle cx="286" cy="66" r="2.2" fill="white" opacity="0.24" />
            <circle cx="352" cy="140" r="1.8" fill="white" opacity="0.2" />

            {/* 올리브 가지를 문 비둘기 */}
            <g
              transform="translate(252 136) rotate(-8)"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.32"
            >
              <path d="M14 40 C24 26 44 21 58 27 C72 33 84 31 97 23 C94 41 78 53 58 53 C40 53 26 50 14 40 Z" />
              <path d="M42 28 C44 13 56 3 72 4 C64 11 59 19 57 28" />
              <path d="M14 40 L4 38" />
              <circle cx="26" cy="34" r="1.7" fill="white" stroke="none" />
              <g strokeWidth="2.4">
                <path d="M4 38 C-3 44 -6 52 -3 60" />
                <path d="M-1 46 C-8 44 -12 47 -13 53 C-6 55 -2 51 -1 46 Z" />
                <path d="M-3 56 C-10 56 -13 60 -13 66 C-6 66 -3 62 -3 56 Z" />
              </g>
            </g>
          </svg>
          <div className="relative z-10">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">
              Together
            </span>
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em] leading-[1.25] text-white mt-3">
              같은 말씀,
              <br />
              함께 묵상해요
            </h2>
            <p className="text-[13px] font-light leading-[1.7] text-white/75 mt-3 max-w-[16rem]">
              방을 만들어 초대 링크를 보내면, 매일 같은 본문을 읽고 서로의 묵상에
              마음을 나눌 수 있어요.
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
            + 새 묵상방 만들기
          </button>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="초대 코드로 참여 (예: AB12CD34)"
              maxLength={8}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={joinRoom.isPending || joinCode.trim().length < 4}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-40"
            >
              참여
            </button>
          </div>
        </section>

        {/* 내 방 목록 */}
        <section className="px-4 pt-8">
          <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-[-0.02em] mb-4 px-0.5">
            내 묵상방
          </h3>
          {!authed ? (
            <EmptyNote emoji="🔑" text="로그인하면 참여 중인 묵상방이 보여요" />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : !rooms || rooms.length === 0 ? (
            <EmptyNote emoji="🕊️" text="아직 참여 중인 방이 없어요. 첫 묵상방을 만들어보세요!" />
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreate && <CreateRoomSheet onClose={() => setShowCreate(false)} />}
    </div>
  )
}

const EmptyNote = ({ emoji, text }: { emoji: string; text: string }) => (
  <div className="text-center py-12 px-6">
    <span className="text-4xl block mb-3">{emoji}</span>
    <p className="text-[13px] text-gray-500 dark:text-white/55">{text}</p>
  </div>
)

const STATUS_META: Record<string, { label: string; cls: string }> = {
  upcoming: { label: '시작 전', cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-300' },
  active: { label: '진행 중', cls: 'bg-[var(--brand-soft)] text-brand' },
  finished: { label: '마침', cls: 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300' },
}

const RoomCard = ({ room, onClick }: { room: RoomSummary; onClick: () => void }) => {
  const meta = STATUS_META[room.status] ?? STATUS_META.active
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985]"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center text-[20px]">
          {room.emoji || '🕊️'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="flex-1 min-w-0 text-[15px] font-bold text-gray-900 dark:text-white truncate">
              {room.title}
            </h4>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${meta.cls}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-[12px] text-gray-400 dark:text-white/45 mt-1">
            👥 {room.member_count}명 ·{' '}
            {room.status === 'upcoming'
              ? `${room.start_date}부터 ${room.total_days}일`
              : `${room.current_day}/${room.total_days}일차`}
            {room.my_read_count >= room.total_days ? (
              <span className="ml-1.5 font-bold text-emerald-600 dark:text-emerald-300">
                🎉 내 몫 완주
              </span>
            ) : (
              room.my_read_count > 0 && (
                <span className="ml-1.5 font-semibold text-brand">
                  ✓ 내 여정 {room.my_read_count}/{room.total_days}
                </span>
              )
            )}
          </p>
          {room.today_reference && room.status === 'active' && (
            <p className="text-[12px] font-semibold mt-1 truncate">
              {room.today_read_by_me ? (
                <span className="text-emerald-600 dark:text-emerald-300">
                  ✓ 오늘 읽음 · {room.today_reference}
                </span>
              ) : (
                <span className="text-brand">오늘 · {room.today_reference}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── 방 만들기 바텀시트 ──
const CreateRoomSheet = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const createRoom = useCreateRoom()
  // 성경 책 목록은 공용 키(['bible','books'])를 재사용 — 별도 키로 같은 데이터를 이중 캐싱하지 않는다
  const { data: books } = useBibleBooks()

  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🕊️')
  const [bookNumber, setBookNumber] = useState(1)
  const [chapterStart, setChapterStart] = useState(1)
  const [chapterEnd, setChapterEnd] = useState(1)
  const [totalDays, setTotalDays] = useState(7)

  const book = useMemo(
    () => books?.find((b) => b.book_number === bookNumber),
    [books, bookNumber],
  )
  const chapterCount = book?.chapter_count ?? 150

  const handleBookChange = (bn: number) => {
    setBookNumber(bn)
    setChapterStart(1)
    setChapterEnd(1)
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('방 이름을 입력해주세요', 'error')
      return
    }
    try {
      const room = await createRoom.mutateAsync({
        title: title.trim(),
        emoji,
        book_number: bookNumber,
        chapter_start: chapterStart,
        chapter_end: Math.max(chapterStart, chapterEnd),
        total_days: totalDays,
      })
      showToast('묵상방이 만들어졌어요! 이제 초대해볼까요?', 'success')
      onClose()
      navigate(`/rooms/${room.id}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '방 만들기에 실패했습니다', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4" />
        <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-4">새 묵상방 만들기</h3>

        {/* 이름 + 이모지 */}
        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mb-1.5">방 이름</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="예: 창세기 1장 공동 묵상"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand"
        />
        <div className="flex gap-2 mt-2.5">
          {EMOJI_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-9 h-9 rounded-xl text-[17px] flex items-center justify-center transition-all ${
                emoji === e
                  ? 'bg-[var(--brand-soft)] ring-2 ring-brand/60 scale-105'
                  : 'bg-gray-50 dark:bg-white/[0.05]'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* 본문 범위 */}
        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mt-5 mb-1.5">
          함께 읽을 본문
        </label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={bookNumber}
            onChange={(e) => handleBookChange(Number(e.target.value))}
            className="col-span-1 px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold focus:outline-none focus:border-brand"
          >
            {(books ?? []).map((b) => (
              <option key={b.book_number} value={b.book_number}>
                {b.book_name_ko}
              </option>
            ))}
          </select>
          <select
            value={chapterStart}
            onChange={(e) => {
              const v = Number(e.target.value)
              setChapterStart(v)
              if (chapterEnd < v) setChapterEnd(v)
            }}
            className="px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold focus:outline-none focus:border-brand"
          >
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>{c}장부터</option>
            ))}
          </select>
          <select
            value={Math.max(chapterStart, chapterEnd)}
            onChange={(e) => setChapterEnd(Number(e.target.value))}
            className="px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold focus:outline-none focus:border-brand"
          >
            {Array.from({ length: chapterCount - chapterStart + 1 }, (_, i) => chapterStart + i).map((c) => (
              <option key={c} value={c}>{c}장까지</option>
            ))}
          </select>
        </div>

        {/* 기간 */}
        <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mt-5 mb-1.5">
          기간 — 본문을 절 단위로 고르게 나눠드려요
        </label>
        <div className="flex gap-2 flex-wrap">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setTotalDays(d)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                totalDays === d
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {d}일
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={createRoom.isPending}
          className="w-full mt-6 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
        >
          {createRoom.isPending ? '만드는 중...' : '묵상방 만들기'}
        </button>
        <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2">
          오늘부터 시작돼요 · 만든 뒤 초대 링크를 보낼 수 있어요
        </p>
      </div>
    </div>
  )
}

export default RoomList
