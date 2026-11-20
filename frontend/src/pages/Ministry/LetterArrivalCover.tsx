// 목양칼럼 첫 화면 '편지 도착' 표지 (2026-11 개편, 시안 A2).
// 편지 날짜의 계절 교회 사진(라이트 낮 / 다크 밤) 위에 편지지 한 장이 내려앉고,
// 소인 도장(날짜·절기)이 찍히고 목사님 서명이 써진다. 계절 입자가 편지 쪽으로 떨어진다.
// 움직임은 들어올 때 한 번 + 입자뿐(어르신 화면 — 사진·카드는 제자리).

import { useRef } from 'react'
import type { Column } from '../../types/column'
import andongProfile from '../../assets/andong.webp'
import signature from '../../assets/signature-andongcheol.png'
import { columnPlainText } from './blockFormat'
import { PEN, SERIF, formatLetterDate, isThisWeek, readingLabel } from './letterFormat'
import { letterSeasonOf, seasonScene } from './letterSeason'
import LetterPostmark from './LetterPostmark'
import LetterSeasonFx from './LetterSeasonFx'
import './letterCover.css'

interface LetterArrivalCoverProps {
  language: string
  column: Column
  /** 몇 번째 편지인지 — 지금까지 쌓인 통수 */
  issueNumber: number
  /** 읽기 모달이 열려 있으면 입자를 멈춘다 */
  paused: boolean
  onOpen: (column: Column) => void
}

const LetterArrivalCover = ({ language, column, issueNumber, paused, onOpen }: LetterArrivalCoverProps) => {
  const ko = language === 'ko'
  const boxRef = useRef<HTMLElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)
  const season = letterSeasonOf(column.date)
  const amen = column.amen_count ?? 0

  return (
    <section
      ref={boxRef}
      aria-label={ko ? '이번 주 목양칼럼' : "This week's letter"}
      className="lc-cover-lift relative overflow-hidden lg:rounded-[32px] lg:h-[620px] lg:bg-sky-400 lg:dark:bg-[#0b1838]"
    >
      {/* 계절 교회 사진 — 교회가 오른쪽에 오도록.
          모바일은 표지 전체가 아니라 위쪽 가로 띠로만 깐다: 세로로 긴 판에 3:1 사진을 채우면
          18%만 보여 교회가 잘리고 판이 길쭉해 보인다 → 띠로 두면 교회 건물이 통째로 보이고,
          편지지는 띠 아래 끝에 걸쳐 놓인다. */}
      <div
        className="lc-photo-lift absolute inset-x-0 top-0 h-[236px] sm:h-[280px] rounded-[26px] overflow-hidden bg-sky-400 dark:bg-[#0b1838] lg:inset-0 lg:h-auto lg:rounded-none"
        aria-hidden="true"
      >
        <img
          src={seasonScene(season, 'day')}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[100%_50%] lg:object-[85%_50%] dark:hidden"
        />
        <img
          src={seasonScene(season, 'night')}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[100%_50%] lg:object-[85%_50%] hidden dark:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent dark:from-black/30" />
      </div>

      <LetterSeasonFx key={season} season={season} boxRef={boxRef} targetRef={letterRef} paused={paused} />

      <div className="relative px-4 lg:px-12 pt-5 lg:pt-9 pb-8 lg:pb-0 h-full">
        <div className="flex items-center gap-2.5 text-white [text-shadow:0_1px_10px_rgba(0,40,100,0.45)]">
          <span className="text-[18px] lg:text-[22px] font-semibold" style={{ fontFamily: SERIF }}>
            {ko ? '참빛 목회서신' : 'Chambit Pastoral Letter'}
          </span>
          <span className="text-[13px] lg:text-[14px] text-white/90">No.{issueNumber}</span>
        </div>
        {/* 모바일은 편지 위로 교회 사진이 보이게 하늘을 남긴다(사진 띠 아래 끝에 편지가 70px쯤 걸친다) */}
        <div className="h-[120px] sm:h-[160px] lg:hidden" aria-hidden="true" />

        <div ref={letterRef} className="lg:absolute lg:left-12 lg:bottom-12 w-full lg:w-[600px]">
          <article
            className="lc-letter relative cursor-pointer rounded-[20px] lg:rounded-[22px] bg-white dark:bg-[#141c2e] px-5 lg:px-10 pt-7 lg:pt-8 pb-5 lg:pb-7 ring-1 ring-black/[0.04] shadow-[0_16px_36px_-16px_rgba(10,40,100,0.4)] lg:shadow-[0_30px_70px_-20px_rgba(10,40,100,0.55)] dark:ring-white/10"
            onClick={() => onOpen(column)}
          >
            <LetterPostmark
              date={column.date}
              language={language}
              className="lc-stamp absolute -top-9 right-3 lg:-top-10 lg:right-4 w-[92px] h-[92px] lg:w-[108px] lg:h-[108px] text-[#c2410c]/85 dark:text-amber-300/85 pointer-events-none"
            />
            <div className="pr-20 lg:pr-24 text-[13px] lg:text-[14px] leading-snug">
              <span className="font-bold text-[var(--brand)]">
                {isThisWeek(column.date)
                  ? ko
                    ? '이번 주 편지가 도착했어요'
                    : "This week's letter has arrived"
                  : ko
                    ? '가장 최근 편지'
                    : 'Latest letter'}
              </span>
              <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                {formatLetterDate(column.date, language)}
                <span className="mx-1.5 opacity-60">·</span>
                {readingLabel(column.content, language, true)}
              </div>
            </div>

            {ko && (
              <div className="text-[24px] lg:text-[28px] text-gray-600 dark:text-gray-300 mt-3" style={{ fontFamily: PEN }}>
                사랑하는 참빛 성도님께,
              </div>
            )}
            <h2
              className="text-[28px] lg:text-[42px] font-semibold leading-[1.25] text-ink-strong mt-1 tracking-[-0.02em] break-keep"
              style={{ fontFamily: SERIF }}
            >
              {column.title}
            </h2>
            <p
              className="text-[16px] lg:text-[18px] leading-[1.85] text-gray-600 dark:text-gray-300 mt-2.5 lg:mt-4 line-clamp-2 lg:line-clamp-3 break-keep"
              style={{ fontFamily: SERIF }}
            >
              {columnPlainText(column.content)}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 lg:mt-6 pt-4 lg:pt-5 border-t border-dashed border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <img src={andongProfile} alt="" className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover flex-shrink-0" />
                <img src={signature} alt={column.author} className="lc-sign h-8 lg:h-9 dark:invert" />
                {amen > 0 && (
                  <span className="text-[13px] lg:text-[14px] text-[var(--brand)] font-semibold whitespace-nowrap">
                    {ko ? `아멘 ${amen}` : `Amen ${amen}`}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen(column)
                }}
                className="w-full sm:w-auto h-[50px] lg:h-[54px] px-6 lg:px-7 rounded-full bg-[var(--brand)] text-white text-[16px] lg:text-[17px] font-bold whitespace-nowrap hover:brightness-110 transition-[filter]"
              >
                {ko ? '편지 읽기' : 'Read letter'}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default LetterArrivalCover
