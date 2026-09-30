import { useEffect, useRef, useState } from 'react'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { recordMotionCard } from '../motionCard'
import type { MotionResult, MotionSlide } from '../motionCard'
import type { VerseCardStyle } from '../photoVerseCanvas'

interface MotionCardSheetProps {
  img: HTMLImageElement
  slides: MotionSlide[]
  style: VerseCardStyle
  filenameBase: string
  /** 공유 문구(출처 + 말씀 링크) */
  shareText?: string
  language: 'ko' | 'en'
  onClose: () => void
}

const TEXTS = {
  ko: {
    title: '움직이는 말씀 카드',
    recording: '영상으로 담는 중이에요',
    recordingHint: '화면을 그대로 두면 더 매끄럽게 담겨요',
    done: '완성됐어요',
    doneHint: '스토리·릴스·카톡에 올려보세요',
    save: '저장',
    share: '공유',
    retry: '다시 만들기',
    failed: '이 브라우저에서는 영상을 만들지 못했어요. 사진 카드로 저장해 주세요.',
    close: '닫기',
  },
  en: {
    title: 'Moving verse card',
    recording: 'Recording your card',
    recordingHint: 'Keep this screen open for a smoother result',
    done: 'Ready',
    doneHint: 'Post it to Stories, Reels or chat',
    save: 'Save',
    share: 'Share',
    retry: 'Record again',
    failed: "This browser couldn't record a video. Please save it as a photo card.",
    close: 'Close',
  },
}

/** 열리면 곧바로 녹화를 시작하고, 끝나면 영상을 돌려 보여준다 */
const MotionCardSheet = ({ img, slides, style, filenameBase, shareText, language, onClose }: MotionCardSheetProps) => {
  const t = TEXTS[language]
  const stageRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<MotionResult | null>(null)
  const [failed, setFailed] = useState(false)
  const [run, setRun] = useState(0)
  useModalBackButton(onClose)

  useEffect(() => {
    const ctrl = new AbortController()
    let made: MotionResult | null = null
    recordMotionCard({
      img,
      slides,
      style,
      filenameBase,
      signal: ctrl.signal,
      onProgress: setProgress,
      onCanvas: (c) => {
        const stage = stageRef.current
        if (!stage) return
        c.className = 'pv-motion__live'
        stage.replaceChildren(c)
      },
    })
      .then((r) => {
        made = r
        setResult(r)
      })
      .catch((err) => {
        if ((err as DOMException)?.name !== 'AbortError') setFailed(true)
      })
    return () => {
      ctrl.abort()
      if (made) URL.revokeObjectURL(made.url)
    }
  }, [img, slides, style, filenameBase, run])

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.file.name
    a.click()
  }

  const canShare = !!result && !!navigator.canShare?.({ files: [result.file] })
  const share = async () => {
    if (!result) return
    try {
      await navigator.share({ files: [result.file], text: shareText })
    } catch {
      /* 사용자가 닫은 경우 포함 — 저장 버튼이 남아 있다 */
    }
  }

  return (
    <div className="pv-sheet-overlay" onClick={onClose}>
      <div
        className="pv-sheet pv-motion"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-sheet__handle" aria-hidden="true" />
        <div className="pv-sheet__header">
          <h2 className="pv-sheet__title">{t.title}</h2>
          <button type="button" className="pv-sheet__close" aria-label={t.close} onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="pv-motion__body">
          {failed ? (
            <p className="pv-sheet__hint">{t.failed}</p>
          ) : result ? (
            <video className="pv-motion__video" src={result.url} autoPlay loop muted playsInline />
          ) : (
            <div ref={stageRef} className="pv-motion__stage" />
          )}

          {!failed && (
            <>
              <p className="pv-motion__status">{result ? t.done : t.recording}</p>
              <p className="pv-motion__hint">{result ? t.doneHint : t.recordingHint}</p>
              {!result && (
                <div className="pv-motion__bar" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
                  <span style={{ transform: `scaleX(${progress})` }} />
                </div>
              )}
            </>
          )}
        </div>

        {result && (
          <div className="pv-sheet__footer pv-motion__actions">
            <button type="button" className="pv-motion__ghost" onClick={() => {
                // 다시 만들기 — 진행 화면으로 돌아가 새로 녹화한다
                setProgress(0)
                setResult(null)
                setFailed(false)
                setRun((n) => n + 1)
              }}>
              <span className="material-icons-round text-[18px]">refresh</span>
              {t.retry}
            </button>
            {canShare && (
              <button type="button" className="pv-motion__ghost" onClick={share}>
                <span className="material-icons-round text-[18px]">ios_share</span>
                {t.share}
              </button>
            )}
            <button type="button" className="pv-confirm brand-gradient" onClick={download}>
              <span className="material-icons-round text-[18px]">download</span>
              {t.save}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MotionCardSheet
