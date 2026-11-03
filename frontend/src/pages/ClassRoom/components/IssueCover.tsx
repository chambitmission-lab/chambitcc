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
    <section className="relative isolate overflow-hidden rounded-[28px] mx-4 mt-3 flex flex-col bg-[linear-gradient(180deg,#c8e5ee_0px,#cfe6ee_170px,#2a63c4_290px,#163f8f_100%)] dark:bg-[linear-gradient(180deg,#07173b_0px,#06122e_200px,#0b1f4d_330px,#060f27_100%)] shadow-[0_18px_40px_-20px_rgba(20,40,80,0.55)]">
      {/* 삽화 띠 — 넓은 배너라 높이에 맞춰 오른쪽(게시판·양들)을 보여준다 */}
      <div className={`absolute inset-x-0 top-0 h-[220px] lg:h-[250px] -z-10 pointer-events-none class-hero-art cm-cover-band${artReady ? ' is-ready' : ''}`} aria-hidden />
      <div className="absolute inset-x-0 top-[185px] lg:top-[215px] h-[90px] -z-10 pointer-events-none bg-[linear-gradient(180deg,rgba(42,99,196,0)_0%,rgba(42,99,196,0.85)_70%,#2a63c4_100%)] dark:bg-[linear-gradient(180deg,rgba(11,31,77,0)_0%,rgba(11,31,77,0.9)_70%,#0b1f4d_100%)]" aria-hidden />

      <button
        type="button"
        onClick={onShare}
        className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.14] backdrop-blur-sm text-[#1b64da] dark:text-white text-[12px] font-bold shadow-sm active:scale-95 transition-transform"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        초대
      </button>

      <div className="px-5 pb-5 pt-[214px] lg:px-7 lg:pb-7 lg:pt-[244px] text-white">
        {verse && versePost ? (
          <>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11.5px] font-bold">
              <OpenBookIcon width={12} height={12} />
              {verseIsThisIssue ? '이번 주 암송' : '지금 외우는 말씀'}
              {verse.week_label && ` · ${verse.week_label}`}
            </span>
            <p className="font-serif-kr mt-3 text-[24px] lg:text-[28px] font-bold leading-[1.5] tracking-[-0.01em] break-keep [text-shadow:0_2px_14px_rgba(0,0,0,0.3)]">
              “{verse.text}”
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-[13px] font-bold text-white/85">{verse.reference}</span>
              <button
                type="button"
                onClick={() =>
                  navigate('/bible/photo-verse', {
                    state: { presetVerse: { text: verse.text, refLabel: verse.reference } },
                  })
                }
                className="inline-flex items-center gap-1 text-[12px] font-bold text-white/70 hover:text-white"
              >
                <ImageIcon width={13} height={13} />
                말씀카드
              </button>
            </div>

            {/* 반 친구 자리 — 외운 만큼 별 자리가 찬다 */}
            <button
              type="button"
              onClick={() => onOpenRecitations(versePost)}
              className="mt-4 flex items-center gap-2.5 text-left"
            >
              <span className="flex gap-1">
                {Array.from({ length: seats }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-[22px] h-[22px] rounded-full grid place-items-center transition-colors ${
                      i < recited
                        ? 'bg-amber-400 text-white shadow-[0_3px_8px_-2px_rgba(245,158,11,0.7)]'
                        : 'border-[1.5px] border-dashed border-white/50'
                    }`}
                  >
                    {i < recited && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" />
                      </svg>
                    )}
                  </span>
                ))}
              </span>
              <span className="text-[12.5px] font-bold text-white/90">
                {recited >= target
                  ? '우리 반 모두 외웠어요!'
                  : cls.is_teacher
                    ? `${recited}/${target}명 외움 · 누가 했나 ›`
                    : recited > 0
                      ? `반 친구 ${recited}명이 외웠어요`
                      : '첫 번째로 외워볼까요?'}
              </span>
            </button>

            <div className="mt-4">
              {cls.is_teacher ? (
                <button
                  type="button"
                  onClick={() => onOpenRecitations(versePost)}
                  className="w-full h-[50px] rounded-2xl bg-white text-[#191f28] text-[15px] font-bold active:scale-[0.97] transition-transform"
                >
                  암송 현황 · 다시 알리기
                </button>
              ) : (
                <VerseButtons post={versePost} onPractice={onPractice} onDark />
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif-kr text-[28px] font-bold leading-[1.3] break-keep [text-shadow:0_2px_14px_rgba(0,0,0,0.3)]">
              {cls.name}
            </h2>
            {cls.description && (
              <p className="mt-2 text-[14.5px] leading-[1.6] text-white/85 break-keep line-clamp-3">{cls.description}</p>
            )}
            <p className="mt-3 text-[12.5px] font-semibold text-white/70">
              {cls.is_teacher ? '이번 주 암송 말씀을 올리면 표지가 됩니다' : '선생님이 말씀을 올리면 여기에 펼쳐져요'}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onOpenMembers}
          className="mt-4 pt-3.5 w-full flex items-center gap-2 border-t border-white/20 text-left active:opacity-80"
        >
          <span className="flex -space-x-2">
            {cls.members.slice(0, 5).map((m) => (
              <Avatar key={m.user_id} name={m.name} avatarUrl={m.avatar_url} size={24} />
            ))}
          </span>
          <span className="text-[12px] font-bold text-white/80">
            {cls.teacher_names.length > 0 && `${cls.teacher_names[0]} 선생님 · `}
            함께하는 {cls.member_count}명 ›
          </span>
        </button>
      </div>
    </section>
  )
}

export default IssueCover
