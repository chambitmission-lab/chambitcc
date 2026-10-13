interface Face {
  user_id: number
  name: string
  avatar_url: string | null
}

/** 겹쳐 놓은 얼굴 줄 — 누가 벌써 썼는지 */
const Faces = ({ people, max = 5 }: { people: Face[]; max?: number }) => (
  <span className="bt-faces" aria-hidden>
    {people.slice(0, max).map((p) =>
      p.avatar_url ? (
        <img key={p.user_id} className="bt-faces__item" src={p.avatar_url} alt="" loading="lazy" />
      ) : (
        <span key={p.user_id} className="bt-faces__item bt-faces__item--initial">
          {p.name.slice(0, 1)}
        </span>
      ),
    )}
  </span>
)

export default Faces
