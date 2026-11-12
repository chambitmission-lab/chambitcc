// 행사 앨범 목록 (Single Responsibility: 연도별로 묶은 앨범 한 줄 목록)
// 모바일: 누르면 넘겨보기(EventAlbumReel)가 그 앨범부터 열린다.
// PC: 2단의 왼쪽 칸 — 누르면 오른쪽 상세가 바뀌고, 고른 줄은 브랜드 면으로 표시된다.
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { useLanguage } from '../../../contexts/LanguageContext'
import { AlbumIcon } from './NewsIcons'
import { CommentIcon } from './EventAlbumReactionBar'

interface EventAlbumListProps {
  posts: EventAlbumPost[]
  selectedId?: number | null
  onSelect: (post: EventAlbumPost) => void
  isAdmin?: boolean
}

const EventAlbumList = ({ posts, selectedId, onSelect, isAdmin }: EventAlbumListProps) => {
  const { t } = useLanguage()

  // 목록은 서버가 행사일 내림차순으로 준다 — 연도가 바뀌는 자리에 머리글만 끼운다
  const groups: { year: string; items: EventAlbumPost[] }[] = []
  for (const post of posts) {
    const year = post.event_date.slice(0, 4)
    const last = groups[groups.length - 1]
    if (last?.year === year) last.items.push(post)
    else groups.push({ year, items: [post] })
  }

  return (
    <div className="flex flex-col">
      {groups.map((g) => (
        <section key={g.year} aria-label={t('newsEaYear').replace('{year}', g.year)}>
          <p className="px-2 pt-3 pb-1.5 text-[12px] lg:text-[14px] font-extrabold tracking-[0.04em] text-gray-400 dark:text-white/40 tabular-nums">
            {g.year}
          </p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((post) => {
              const active = post.id === selectedId
              const [, m, d] = post.event_date.split('-').map(Number)
              return (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(post)}
                    aria-current={active ? 'true' : undefined}
                    className={[
                      'w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-colors',
                      active
                        ? 'bg-[var(--brand-soft-strong)]'
                        : 'hover:bg-gray-100/80 dark:hover:bg-white/[0.04] active:bg-gray-100 dark:active:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <span className="relative shrink-0 w-[68px] h-[68px] lg:w-16 lg:h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.05]">
                      {post.cover_url ? (
                        <img
                          src={post.cover_url}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-brand opacity-55">
                          <AlbumIcon width={22} height={22} />
                        </span>
                      )}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={[
                            'truncate text-[15px] lg:text-[17px] font-bold tracking-[-0.01em]',
                            active ? 'text-brand' : 'text-ink-strong',
                          ].join(' ')}
                        >
                          {post.title}
                        </span>
                        {isAdmin && !post.is_published && (
                          <span className="shrink-0 inline-flex items-center px-1.5 h-5 rounded-full bg-gray-500/15 text-gray-600 dark:text-white/60 text-[10.5px] lg:text-[12.5px] font-bold">
                            {t('newsPrivate')}
                          </span>
                        )}
                      </span>
                      <span className="block mt-0.5 truncate text-[12.5px] lg:text-[14.5px] text-gray-500 dark:text-white/50">
                        {m}.{d} · {post.tag} · {t('newsEaPhotoCount').replace('{n}', String(post.photo_count))}
                      </span>
                      {(post.reaction_count > 0 || post.comment_count > 0) && (
                        <span className="mt-1 flex items-center gap-2.5 text-[11.5px] lg:text-[13.5px] font-bold text-gray-400 dark:text-white/40 tabular-nums">
                          {post.reaction_count > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <span aria-hidden="true">❤️</span>
                              {post.reaction_count}
                            </span>
                          )}
                          {post.comment_count > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <CommentIcon size={13} />
                              {post.comment_count}
                            </span>
                          )}
                        </span>
                      )}
                    </span>

                    {/* 모바일은 누르면 넘겨보기로 들어간다는 표시 */}
                    <svg className="lg:hidden shrink-0 text-gray-300 dark:text-white/25" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default EventAlbumList
