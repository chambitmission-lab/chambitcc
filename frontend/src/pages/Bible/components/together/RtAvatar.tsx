import type { ReflectionAuthor } from '../../../../api/bibleReflection'

/** 묵상·댓글 작성자 아바타 — 사진이 없으면 이름 첫 글자 */
const RtAvatar = ({ author, small = false }: { author: ReflectionAuthor; small?: boolean }) => (
  <span className={`rt-avatar ${small ? 'rt-avatar--sm' : ''}`} aria-hidden>
    {author.avatar_url ? (
      <img src={author.avatar_url} alt="" loading="lazy" />
    ) : (
      (author.display_name || '성').slice(0, 1)
    )}
  </span>
)

export default RtAvatar
