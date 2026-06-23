interface ChapterLoaderProps {
  /** 본문 첫 로딩(lg)인지, 무한 스크롤 추가 로딩(sm)인지 */
  size?: 'lg' | 'sm'
  /** 보조 안내 문구 */
  label?: string
}

/**
 * 성경 장 로딩 인디케이터.
 * 펼쳐진 말씀에서 빛(영광)이 퍼져 나가는 듯한 halo 링 + 브랜드 그라데이션 shimmer.
 * 단순 회전 스피너 대신, 묵상 분위기를 해치지 않는 잔잔하고 세련된 모션을 사용한다.
 */
const ChapterLoader = ({ size = 'lg', label }: ChapterLoaderProps) => {
  return (
    <div className={`chapter-loader chapter-loader--${size}`} role="status" aria-live="polite">
      <div className="chapter-loader__halo" aria-hidden>
        <span className="chapter-loader__ring" />
        <span className="chapter-loader__ring" />
        <span className="chapter-loader__ring" />
        <span className="chapter-loader__core">
          <span className="material-icons-round">auto_stories</span>
        </span>
        <span className="chapter-loader__spark chapter-loader__spark--1" />
        <span className="chapter-loader__spark chapter-loader__spark--2" />
        <span className="chapter-loader__spark chapter-loader__spark--3" />
      </div>

      <div className="chapter-loader__bar" aria-hidden>
        <span className="chapter-loader__bar-fill" />
      </div>

      <p className="chapter-loader__label">{label ?? '말씀을 펼치는 중'}</p>
    </div>
  )
}

export default ChapterLoader
