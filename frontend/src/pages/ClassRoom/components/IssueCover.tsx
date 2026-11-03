// 주간 매거진 표지 — 반 삽화(게시판 앞 양들) 위에 이번 호 말씀.
// 말씀이 없으면 반 이름·소개로 표지를 꾸민다. 글은 아래 어두운 스크림 위에만 둔다.
import { useNavigate } from 'react-router-dom'
import type { ClassDetail, ClassPost } from '../../../types/classRoom'
import { Avatar } from '../classUi'
import { responseTarget } from '../classWeek'
import { ImageIcon, OpenBookIcon } from '../ClassIcons'
import { VerseButtons } from './IssueActions'

interface Props {
  cls: ClassDetail
  versePost: ClassPost | null
  verseIsThisIssue: boolean
  artReady: boolean
  onShare: () => void
  onOpenMembers: () => void
  onPractice: (post: ClassPost) => void
  onOpenRecitations: (post: ClassPost) => void
}

const IssueCover = ({
  cls,
  versePost,
  verseIsThisIssue,
  artReady,
  onShare,
  onOpenMembers,
  onPractice,
  onOpenRecitations,
}: Props) => {
  const navigate = useNavigate()
  const verse = versePost?.verse
  const target = responseTarget(cls.member_count)
  const recited = versePost?.recite_count ?? 0
  const seats = Math.min(target, 8)

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] mx-4 mt-3 flex flex-col ring-1 ring-[#3182f6]/10 dark:ring-white/[0.07] bg-[linear-gradient(180deg,#c8e5ee_0px,#d7ebf1_170px,#eef6f9_250px,#ffffff_330px)] dark:bg-[linear-gradient(180deg,#07173b_0px,#06122e_190px,#0a1634_290px,#0d1630_100%)] shadow-[0_16px_36px_-22px_rgba(30,70,130,0.45)] dark:shadow-[0_16px_36px_-20px_rgba(0,0,0,0.7)]">
      {/* 삽화 띠 — 넓은 배너라 높이에 맞춰 오른쪽(게시판·양들)을 보여주고, 아래 끝은 흰 면으로 녹인다 */}
      <div className={`absolute inset-x-0 top-0 h-[220px] lg:h-[250px] -z-10 pointer-events-none class-hero-art cm-cover-band${artReady ? ' is-ready' : ''}`} aria-hidden />

      <button
        type="button"
        onClick={onShare}
        className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 dark:bg-white/[0.14] backdrop-blur-sm text-[#1b64da] dark:text-white text-[12px] font-bold shadow-sm active:scale-95 transition-transform"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        초대
      </button>

      <div className="px-5 pb-5 pt-[210px] lg:px-10 lg:pb-7 lg:pt-[236px] text-center">
        {verse && versePost ? (
          <>
            <p className="inline-flex items-center gap-1 text-[12px] font-extrabold tracking-[0.04em] text-brand">
              <OpenBookIcon width={13} height={13} />
              {verseIsThisIssue ? '이번 주 암송' : '지금 외우는 말씀'}
              {verse.week_label && ` · ${verse.week_label}`}
            </p>
            <p className="font-serif-kr mt-3 text-[23px] lg:text-[28px] font-bold leading-[1.55] tracking-[-0.01em] text-[#152648] dark:text-white break-keep">
              “{verse.text}”
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-[13.5px] font-bold text-[#41527a] dark:text-white/75">{verse.reference}</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-white/20" aria-hidden />
              <button
                type="button"
                onClick={() =>
                  navigate('/bible/photo-verse', {
                    state: { presetVerse: { text: verse.text, refLabel: verse.reference } },
                  })
                }
                className="inline-flex items-center gap-1 text-[12.5px] font-bold text-gray-500 dark:text-white/55 hover:text-brand"
              >
                <ImageIcon width={13} height={13} />
                말씀카드
              </button>
            </div>

            {/* 반 친구 자리 — 외운 만큼 별 자리가 찬다 */}
            <button
              type="button"
              onClick={() => onOpenRecitations(versePost)}
              className="mt-5 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-amber-400/[0.12] dark:bg-amber-300/10"
            >
              <span className="flex gap-1">
                {Array.from({ length: seats }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-[20px] h-[20px] rounded-full grid place-items-center ${
                      i < recited
                        ? 'bg-amber-400 text-white shadow-[0_3px_8px_-3px_rgba(245,158,11,0.8)]'
                        : 'border-[1.5px] border-dashed border-amber-400/60 dark:border-amber-300/40'
                    }`}
                  >
                    {i < recited && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" />
                      </svg>
                    )}
                  </span>
                ))}
              </span>
              <span className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
                {recited >= target
                  ? '우리 반 모두 외웠어요!'
                  : cls.is_teacher
                    ? `${recited}/${target}명 외움 · 누가 했나 ›`
                    : recited > 0
                      ? `반 친구 ${recited}명이 외웠어요`
                      : '첫 번째로 외워볼까요?'}
              </span>
            </button>

            <div className="mt-5 lg:max-w-[440px] lg:mx-auto">
              {cls.is_teacher ? (
                <button
                  type="button"
                  onClick={() => onOpenRecitations(versePost)}
                  className="w-full h-[50px] rounded-2xl bg-[var(--brand-soft)] text-brand text-[15px] font-bold active:scale-[0.97] transition-transform"
                >
                  암송 현황 · 다시 알리기
                </button>
              ) : (
                <VerseButtons post={versePost} onPractice={onPractice} onDark={false} />
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif-kr text-[26px] font-bold leading-[1.35] text-[#152648] dark:text-white break-keep">
              {cls.name}
            </h2>
            {cls.description && (
              <p className="mt-2 text-[14.5px] leading-[1.6] text-[#41527a] dark:text-white/75 break-keep line-clamp-3">{cls.description}</p>
            )}
            <p className="mt-3 text-[12.5px] font-semibold text-gray-400 dark:text-white/50">
              {cls.is_teacher ? '이번 주 암송 말씀을 올리면 표지가 됩니다' : '선생님이 말씀을 올리면 여기에 펼쳐져요'}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onOpenMembers}
          className="mt-5 pt-4 w-full flex items-center justify-center gap-2 border-t border-gray-100 dark:border-white/[0.08] active:opacity-80"
        >
          <span className="flex -space-x-2">
            {cls.members.slice(0, 5).map((m) => (
              <Avatar key={m.user_id} name={m.name} avatarUrl={m.avatar_url} size={24} />
            ))}
          </span>
          <span className="text-[12.5px] font-bold text-gray-500 dark:text-white/60">
            {cls.teacher_names.length > 0 && `${cls.teacher_names[0]} 선생님 · `}
            함께하는 {cls.member_count}명 ›
          </span>
        </button>
      </div>
    </section>
  )
}

export default IssueCover
