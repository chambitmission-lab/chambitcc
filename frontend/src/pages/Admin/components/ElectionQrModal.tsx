// 투표 QR — 현장에서 휴대폰 카메라로 찍으면 선거 화면(/elections/:id)이 바로 열린다.
//
// QR 에는 선거 주소만 담는다(개인별 토큰 없음). 로그인 안 한 폰이면 선거 화면이 로그인을
// 먼저 청하고, 로그인 뒤엔 서버가 선거인 명부로 투표 자격을 가른다 — 주소가 퍼져도 괜찮다.
// 프로젝터에 그대로 띄울 수 있게 PC 에선 QR 을 크게, 종이로 붙일 때는 '인쇄'로 한 장짜리 안내문을 뽑는다.
import { useMemo, useState } from 'react'
import { renderSVG } from 'uqr'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { electionVoteUrl } from '../../../utils/inviteLink'
import { showToast } from '../../../utils/toast'
import { CloseButton } from './SeatEventComposer'

interface Props {
  electionId: number
  title: string
  onClose: () => void
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

const ElectionQrModal = ({ electionId, title, onClose }: Props) => {
  useModalBackButton(onClose)
  const [copied, setCopied] = useState(false)

  const url = electionVoteUrl(electionId)
  const svg = useMemo(() => renderSVG(url, { ecc: 'M', border: 2 }), [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('복사에 실패했어요. 주소를 직접 알려주세요: ' + url, 'error')
    }
  }

  // 인쇄는 새 창에 안내문 한 장만 그려서 — 뒤에 깔린 현황판까지 같이 찍히지 않게
  const print = () => {
    const w = window.open('', '_blank', 'width=720,height=900')
    if (!w) {
      showToast('팝업이 막혀 인쇄 창을 열지 못했어요', 'error')
      return
    }
    w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${escapeHtml(title)} 투표 QR</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { margin: 0; font-family: system-ui, -apple-system, 'Malgun Gothic', sans-serif; color: #111; text-align: center; }
  h1 { font-size: 30px; margin: 24px 0 6px; letter-spacing: -0.02em; }
  .sub { font-size: 18px; color: #444; margin: 0 0 28px; }
  .qr { width: 110mm; height: 110mm; margin: 0 auto; }
  .qr svg { width: 100%; height: 100%; }
  ol { display: inline-block; text-align: left; font-size: 19px; line-height: 1.9; margin: 28px auto 0; padding-left: 1.4em; }
  .note { margin-top: 18px; font-size: 15px; color: #555; }
  .url { margin-top: 10px; font-size: 12px; color: #888; word-break: break-all; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="sub">휴대폰 카메라로 찍어 투표해 주세요</p>
<div class="qr">${svg}</div>
<ol>
  <li>카메라로 QR 코드를 찍어요</li>
  <li>교회 앱에 로그인해요</li>
  <li>후보를 골라 투표해요</li>
</ol>
<p class="note">선거인 명부에 있는 분만 투표할 수 있어요</p>
<p class="url">${escapeHtml(url)}</p>
<script>window.onload = function () { window.print(); };</script>
</body></html>`)
    w.document.close()
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] lg:max-w-[560px] rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] px-6 pt-6 pb-5 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3">
          <CloseButton onClick={onClose} />
        </div>
        <p className="text-[12.5px] font-bold text-brand">투표 QR</p>
        <h2 className="mt-1 px-8 text-[20px] lg:text-[24px] font-extrabold text-ink-strong tracking-[-0.02em]">
          {title}
        </h2>
        <p className="mt-1.5 text-[14px] lg:text-[16px] text-ink-muted">휴대폰 카메라로 찍으면 투표 화면이 열려요</p>

        {/* QR 은 다크에서도 흰 바탕 — 검은 바탕에선 카메라가 못 읽는 경우가 있다 */}
        <div
          className="mx-auto mt-5 w-64 h-64 lg:w-[400px] lg:h-[400px] p-3 rounded-2xl bg-white border border-gray-200 [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <p className="mt-4 text-[13px] lg:text-[15px] text-ink-muted leading-relaxed">
          로그인이 필요해요 · 선거인 명부에 있는 분만 투표할 수 있어요
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13.5px] font-bold text-ink hover:border-brand hover:text-brand transition-colors"
          >
            {copied ? '복사했어요' : '링크 복사'}
          </button>
          <button
            type="button"
            onClick={print}
            className="flex-1 py-2.5 rounded-xl bg-brand text-white text-[13.5px] font-bold"
          >
            인쇄
          </button>
        </div>
      </div>
    </div>
  )
}

export default ElectionQrModal
