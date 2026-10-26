// /capsule/new 단계 머리 — 배달부 양 삽화 + 뒤로/배달 길(진행) + 양의 말풍선.
// 삽화는 단계마다 바뀌고, 진행 표시는 막대가 아니라 양이 우체통까지 걸어가는 길이다.
import type { CSSProperties } from "react";
import { useThemeArt } from "../../../hooks/useThemeArt";
import type { ThemePair } from "../../../utils/themeAssets";
import { STEP_COUNT, type CreateStep } from "./createQuips";

/** 길 위를 걷는 양 머리 — 진행 표시의 손잡이 */
const SheepMark = () => (
  <svg viewBox="0 0 32 32" aria-hidden>
    <path
      d="M8.6 11.4a4.2 4.2 0 0 1 6.2-3.6 4.2 4.2 0 0 1 6.6.4 4.2 4.2 0 0 1 3.4 5.4 4.2 4.2 0 0 1-.6 6.6 4.2 4.2 0 0 1-5.4 3.8 4.2 4.2 0 0 1-6.4.2 4.2 4.2 0 0 1-5.4-4 4.2 4.2 0 0 1-.6-6.4 4.2 4.2 0 0 1 2.2-2.4Z"
      fill="#fffdf6"
      stroke="#463d33"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <ellipse cx="16" cy="17.4" rx="4.6" ry="5.4" fill="#463d33" />
    <circle cx="14.2" cy="16.4" r="1" fill="#fff" />
    <circle cx="17.8" cy="16.4" r="1" fill="#fff" />
    <path
      d="M10.6 15.2c-1.6-.4-2.8.2-3.2 1.4M21.4 15.2c1.6-.4 2.8.2 3.2 1.4"
      stroke="#463d33"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const SheepStage = ({
  step,
  art,
  artVariant,
  quip,
  speaker = "배달부 양",
  closeOnly = false,
  trail,
  onTrailClick,
  onBack,
}: {
  step: CreateStep;
  art: ThemePair;
  /** 삽화마다 잘린 구도가 달라 높이·초점을 따로 준다 (create.css .cw-art--*) */
  artVariant: string;
  quip: string;
  speaker?: string;
  /** 봉인 완료 화면 — 되돌아갈 단계가 없어 ✕(닫기)만 둔다 */
  closeOnly?: boolean;
  /** PC 왼쪽 패널의 단계별 요약 — 순서 = 단계 */
  trail?: { label: string; value: string }[];
  onTrailClick?: (step: CreateStep) => void;
  onBack: () => void;
}) => {
  const ready = useThemeArt(art);
  const progress = (step - 1) / (STEP_COUNT - 1);
  const isClose = step === 1 || closeOnly;

  return (
    <div className={`cw-stage cw-stage--${artVariant}`}>
      <div className="cw-stage__scene">
        <div
          className={`cw-art ${ready ? "is-ready" : ""}`}
          style={
            {
              "--cw-art-light": `url('${art.light}')`,
              "--cw-art-dark": `url('${art.dark}')`,
            } as CSSProperties
          }
          aria-hidden
        />

        <div className="cw-top">
          <button
            type="button"
            onClick={onBack}
            className="cw-back"
            aria-label={isClose ? "닫기" : "이전 단계"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {isClose ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>

          <div
            className="cw-path"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEP_COUNT}
            aria-valuenow={step}
            aria-label={`${STEP_COUNT}단계 중 ${step}단계`}
            style={{ "--cw-progress": progress } as CSSProperties}
          >
            <span className="cw-path__track" />
            <span className="cw-path__fill" />
            <span className="cw-path__sheep">
              <SheepMark />
            </span>
            {/* 길 끝의 우체통 — 봉인하면 닿는 곳 */}
            <span className="cw-path__box" aria-hidden>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7h16v11H4z" />
                <path d="m4 8 8 5 8-5" />
              </svg>
            </span>
          </div>
        </div>

        {/* 말풍선은 바뀔 때마다 톡 튀어나온다(key) — 화면 낭독기에도 새 대사로 읽힌다 */}
        <p className="cw-bubble" key={quip} aria-live="polite">
          <small>{speaker}</small>
          {quip}
        </p>
      </div>

      {/* PC(lg+) 왼쪽 패널 — 지금까지 담은 것. 지난 단계는 눌러서 되돌아가 고친다 (모바일은 숨김) */}
      {trail && (
        <ol className="cw-trail" aria-label="담은 것">
          {trail.map((t, i) => {
            const n = (i + 1) as CreateStep;
            const state = n < step ? "done" : n === step ? "now" : "todo";
            return (
              <li key={t.label} className={`cw-trail__item is-${state}`}>
                <button
                  type="button"
                  disabled={state !== "done"}
                  onClick={() => onTrailClick?.(n)}
                  className="cw-trail__btn"
                >
                  <span className="cw-trail__mark" aria-hidden>
                    {state === "done" ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    ) : (
                      n
                    )}
                  </span>
                  <span className="cw-trail__text">
                    <span className="cw-trail__label">{t.label}</span>
                    {t.value && state !== "todo" && (
                      <span className="cw-trail__value">{t.value}</span>
                    )}
                  </span>
                  {state === "done" && (
                    <span className="cw-trail__edit">고치기</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default SheepStage;
