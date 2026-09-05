import { useEffect, useRef, useState } from 'react'
import EmojiPickerPanel from '../../../components/common/EmojiPickerPanel'
import { AnimatedEmojiText } from '../../../components/common/animatedEmoji'
import { CommentIcon, HeartIcon } from '../../../components/icons/ActionIcons'
import { useCreateRoomPost, useCreateRoomReply, useDeleteRoomPost, useDeleteRoomReply, useRoomDay, useRoomPosts, useRoomReplies, useSetDayReaction, useToggleRoomPostLike } from '../../../hooks/useMeditationRoom'
import type { RoomDetail, RoomPost, RoomPostType, RoomReactionKey } from '../../../types/meditationRoom'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import { Avatar } from '../RoomBits'
import { HandHeartIcon, ReactionGlyph, SproutIcon } from '../RoomIcons'
import { REACTIONS, pickDailyQuestion, reactionMeta } from '../roomCourses'
import { timeAgo } from './roomHomeUtils'

// ── 나눔 카드 + 피드 ──
export const DayFeed = ({ room, day }: { room: RoomDetail; day: number }) => {
  const { data: feed, isLoading } = useRoomPosts(room.id, day)
  const { data: detail } = useRoomDay(room.id, day)
  const setReaction = useSetDayReaction(room.id, day)
  const createPost = useCreateRoomPost(room.id)
  const dayInfo = room.days.find((d) => d.day_number === day)

  const [qOffset, setQOffset] = useState(0)
  const question = pickDailyQuestion(room.id, day, qOffset)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [asPrayer, setAsPrayer] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  const handleSubmit = async () => {
    const text = content.trim()
    if (!text) return
    const postType: RoomPostType = asPrayer ? 'prayer' : 'meditation'
    try {
      await createPost.mutateAsync({ dayNumber: day, postType, content: text })
      setContent('')
      setOpen(false)
      showToast(asPrayer ? '기도제목을 나눴어요 🙏' : '묵상을 나눴어요 🕊️', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '작성에 실패했습니다', 'error')
    }
  }

  const handleReact = (key: RoomReactionKey) => {
    const mine = detail?.reactions.find((r) => r.reaction === key)?.mine
    setReaction.mutate(mine ? null : key)
  }

  const reactionSummary = (detail?.reactions ?? []).filter((r) => r.count > 0)

  return (
    <section className="px-4 pt-4 pb-10 lg:max-w-[640px] lg:mx-auto">
      {/* 나눔 카드 */}
      <div className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 dark:text-white/45">오늘 본문에서 나는</p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {REACTIONS.map((r) => {
            const found = detail?.reactions.find((x) => x.reaction === r.key)
            const mine = !!found?.mine
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => handleReact(r.key)}
                disabled={setReaction.isPending}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12.5px] font-bold transition-all active:scale-95 ${
                  mine
                    ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/65'
                }`}
              >
                <ReactionGlyph reaction={r.key} size={13} />
                {r.label}
                {found && found.count > 0 && (
                  <span className={`text-[10.5px] tabular-nums ${mine ? 'text-white/80' : 'text-brand'}`}>
                    {found.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 오늘의 질문 */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--brand-soft)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-brand">오늘의 질문</p>
            <button
              type="button"
              onClick={() => setQOffset((o) => o + 1)}
              className="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-white/50 underline underline-offset-2"
            >
              다른 질문
            </button>
          </div>
          <p className="text-[14.5px] font-semibold leading-[1.55] text-ink-strong mt-1 break-keep">{question}</p>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13.5px] text-gray-400 dark:text-white/40"
          >
            이 질문에 답해볼게요…
          </button>
        ) : (
          <div className="mt-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder={asPrayer ? '함께 기도했으면 하는 제목을 적어주세요' : '짧아도 괜찮아요. 한 줄이면 충분해요'}
              className="w-full resize-none px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] leading-[1.7] placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setAsPrayer((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                  asPrayer
                    ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55'
                }`}
              >
                <HandHeartIcon size={13} /> 기도제목으로
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setContent('')
                  }}
                  className="px-3 py-2 text-[12.5px] font-semibold text-gray-400 dark:text-white/40"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createPost.isPending || !content.trim()}
                  className="px-4 py-2 rounded-full bg-brand text-white text-[12.5px] font-bold disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {createPost.isPending ? '나누는 중...' : '나누기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 반응 요약 */}
      {reactionSummary.length > 0 && (
        <div className="mt-3 px-1 flex flex-wrap gap-x-3 gap-y-1">
          {reactionSummary.map((r) => {
            const meta = reactionMeta(r.reaction)
            const head = r.names.slice(0, 2).join(', ')
            const rest = r.count - Math.min(2, r.names.length)
            return (
              <p key={r.reaction} className="text-[12px] text-gray-500 dark:text-white/55">
                <ReactionGlyph reaction={r.reaction} size={12} className="inline-block -mt-px mr-1 align-middle text-brand" />
                <b className="text-gray-700 dark:text-white/75">{head}</b>
                {rest > 0 ? ` 외 ${rest}명` : ''}
                {r.count === 1 ? '님이' : '이'} {meta?.sentence}
              </p>
            )
          })}
        </div>
      )}

      {/* 글 목록 */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ))
        ) : !feed || feed.items.length === 0 ? (
          <p className="text-center text-[13px] text-gray-400 dark:text-white/45 py-8 leading-[1.7]">
            <SproutIcon size={26} className="mx-auto mb-2 block text-gray-300 dark:text-white/25" />
            {dayInfo?.read_by_me
              ? '아직 나눈 묵상이 없어요. 위의 질문에 한 줄만 남겨보세요'
              : '본문을 읽고 나면 여기에 서로의 마음이 모여요'}
          </p>
        ) : (
          feed.items.map((post) => <PostCard key={post.id} post={post} roomAdmin={room.is_admin} />)
        )}
      </div>
    </section>
  )
}

// ── 글 카드 ──
export const PostCard = ({ post, roomAdmin }: { post: RoomPost; roomAdmin: boolean }) => {
  const toggleLike = useToggleRoomPostLike(post.room_id)
  const deletePost = useDeleteRoomPost(post.room_id)
  const [showReplies, setShowReplies] = useState(false)

  const handleDelete = async () => {
    if (
      !(await confirmDialog({
        title: '글 삭제',
        message: '이 글을 삭제할까요?',
        description: '삭제된 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deletePost.mutateAsync(post.id)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  return (
    <article className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
      <div className="flex items-center gap-2.5">
        <Avatar name={post.name} avatarUrl={post.avatar_url} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13.5px] font-bold text-ink-strong truncate">{post.name}</span>
            {post.post_type === 'prayer' && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[10.5px] font-bold leading-none">
                <HandHeartIcon size={11} className="inline-block -mt-px mr-0.5 align-middle" />
                기도제목
              </span>
            )}
          </div>
          <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{timeAgo(post.created_at)}</span>
        </div>
        {(post.is_mine || roomAdmin) && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="삭제"
            className="shrink-0 text-gray-300 dark:text-white/30 hover:text-red-500 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      <AnimatedEmojiText
        content={post.content}
        className="text-[14px] leading-[1.75] text-gray-800 dark:text-white/85 mt-3 whitespace-pre-wrap break-words"
      />

      <div className="flex items-center gap-4 mt-3.5">
        <button
          type="button"
          onClick={() => toggleLike.mutate(post.id)}
          disabled={toggleLike.isPending}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors ${
            post.liked_by_me ? 'text-rose-500' : 'text-gray-400 dark:text-white/45 hover:text-rose-400'
          }`}
        >
          <HeartIcon size={17} filled={post.liked_by_me} />
          {post.like_count > 0 ? post.like_count : '마음'}
        </button>
        <button
          type="button"
          onClick={() => setShowReplies((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors ${
            showReplies ? 'text-brand' : 'text-gray-400 dark:text-white/45 hover:text-brand'
          }`}
        >
          <CommentIcon size={17} />
          {post.reply_count > 0 ? post.reply_count : '댓글'}
        </button>
      </div>

      {showReplies && <Replies roomId={post.room_id} postId={post.id} roomAdmin={roomAdmin} />}
    </article>
  )
}

// ── 댓글 — 움직이는 이모티콘 지원 ──
export const Replies = ({ roomId, postId, roomAdmin }: { roomId: number; postId: number; roomAdmin: boolean }) => {
  const { data: replies, isLoading } = useRoomReplies(roomId, postId)
  const createReply = useCreateRoomReply(roomId, postId)
  const deleteReply = useDeleteRoomReply(roomId, postId)
  const [text, setText] = useState('')
  const [stickers, setStickers] = useState(false)

  const handleSubmit = async () => {
    const content = text.trim()
    if (!content) return
    try {
      await createReply.mutateAsync(content)
      setText('')
      setStickers(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '댓글 작성에 실패했습니다', 'error')
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
      {isLoading ? (
        <p className="text-[12px] text-gray-400 dark:text-white/40 py-2">불러오는 중...</p>
      ) : (
        (replies ?? []).map((r) => (
          <div key={r.id} className="flex items-start gap-2 py-1.5">
            <Avatar name={r.name} avatarUrl={r.avatar_url} size={26} />
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-bold text-gray-800 dark:text-white/85 mr-1.5">{r.name}</span>
              <AnimatedEmojiText content={r.content} className="inline text-[13px] text-gray-700 dark:text-white/75 break-words" />
              <span className="block text-[10.5px] text-gray-400 dark:text-white/35 mt-0.5">{timeAgo(r.created_at)}</span>
            </div>
            {(r.is_mine || roomAdmin) && (
              <button
                type="button"
                onClick={() => deleteReply.mutate(r.id)}
                aria-label="댓글 삭제"
                className="shrink-0 text-[11px] text-gray-300 dark:text-white/25 hover:text-red-500"
              >
                삭제
              </button>
            )}
          </div>
        ))
      )}
      <div className="flex items-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => setStickers((v) => !v)}
          aria-label="이모티콘"
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[17px] transition-colors ${
            stickers ? 'bg-[var(--brand-soft)]' : 'bg-gray-50 dark:bg-white/[0.05]'
          }`}
        >
          😊
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit()
          }}
          maxLength={1000}
          placeholder="따뜻한 한마디"
          className="flex-1 min-w-0 px-3.5 py-2 rounded-full bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] focus:outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createReply.isPending || !text.trim()}
          className="shrink-0 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold disabled:opacity-40"
        >
          등록
        </button>
      </div>
      {stickers && (
        <EmojiPickerPanel
          className="mt-2"
          onSelect={(ch) => setText((t) => t + ch)}
          disabled={createReply.isPending}
        />
      )}
    </div>
  )
}
