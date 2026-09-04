/**
 * 공지 본문 서식 미리보기 (개발 전용 · /#/dev/notice-markup)
 *
 * 실제 화면은 관리자 로그인이 있어야 열리므로, 렌더 3종(팝업 본문 / 알림함 펼침 /
 * 알림함 접힘 한 줄)과 툴바 동작을 한 화면에서 라이트·다크로 확인한다.
 */
import { useRef, useState } from 'react'
import NoticeContent, { NoticeInline } from '../../../components/common/NoticeContent'
import NoticeMarkupToolbar from './NoticeMarkupToolbar'
import { NOTICE_TEMPLATES, noticePreviewText } from '../../../utils/noticeMarkup'

const SAMPLE = `> [!주의] 이번 주 예배 시간이 변경됩니다

일시: 9월 14일(주일) 오후 2시
장소: 본당 3층
대상: 청년부 전체
준비물: 성경, 필기구
회비: 10,000원
문의: 교회 사무실 (032-323-1004)

## 준비해 주세요

- **성경**과 필기구를 꼭 챙겨주세요
- 주차는 __지하 2층__을 이용해 주세요
- !!오후 1시 50분까지!! 입장 부탁드립니다

1. 등록 데스크에서 이름 확인
2. 배정된 자리로 이동
3. 함께 찬양으로 시작합니다

---

==변경된 시간에 맞춰 참석해 주시기 바랍니다.==
자세한 내용은 주보를 참고해 주세요.

> [!축하] 지난 주 새가족 12분이 등록하셨습니다`

const NoticeMarkupPreview = () => {
  const [source, setSource] = useState(SAMPLE)
  const ref = useRef<HTMLTextAreaElement>(null)

  return (
    <div
      className="min-h-screen p-4"
      style={{ background: 'var(--surface)', color: 'var(--text-body)' }}
    >
      <div className="mx-auto w-full max-w-lg space-y-4">
        <h1 className="text-[17px] font-bold" style={{ color: 'var(--text-strong)' }}>
          공지 본문 서식 미리보기
        </h1>

        {/* 편집 */}
        <section>
          <NoticeMarkupToolbar textareaRef={ref} value={source} onChange={setSource} />
          <textarea
            ref={ref}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={14}
            className="nmt-field w-full px-3.5 py-2.5 text-[13px] leading-[1.7] resize-none focus:outline-none"
            style={{
              background: 'var(--surface-container)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-body)',
            }}
          />
          <div className="nme-templates">
            {NOTICE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="nme-tpl"
                onClick={() => setSource(t.body)}
              >
                <span className="nme-tpl-label">{t.label}</span>
                <span className="nme-tpl-hint">{t.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <Panel title="홈 팝업 본문">
          <NoticeContent source={source} />
        </Panel>

        <Panel title="알림함 — 펼침 (compact)">
          <NoticeContent source={source} compact />
        </Panel>

        <Panel title="알림함 — 접힘 (2줄 클램프)">
          <p
            className="text-[13.5px] leading-relaxed break-words"
            style={{
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            <NoticeInline source={source} />
          </p>
        </Panel>

        <Panel title="홈 상단 배너 — 평문 한 줄">
          <p
            className="truncate text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {noticePreviewText(source)}
          </p>
        </Panel>
      </div>
    </div>
  )
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section
    className="rounded-2xl p-4"
    style={{
      background: 'var(--surface-container)',
      border: '1px solid var(--card-border)',
    }}
  >
    <p
      className="mb-3 text-[10.5px] font-bold tracking-[0.1em]"
      style={{ color: 'var(--brand)' }}
    >
      {title}
    </p>
    {children}
  </section>
)

export default NoticeMarkupPreview
