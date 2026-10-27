// /capsule/new 단계 머리 — 배달부 양 삽화 + 뒤로/배달 길(진행) + 양의 말풍선.
// 삽화는 단계마다 바뀌고, 진행 표시는 막대가 아니라 편지가 점선 길을 따라 우체통까지 날아가는 길이다.
// (양 얼굴 아이콘은 삽화 속 양과 그림체가 충돌해 2026-10-27 편지로 교체)
import type { CSSProperties } from "react";
import { useThemeArt } from "../../../hooks/useThemeArt";
import type { ThemePair } from "../../../utils/themeAssets";
import { STEP_COUNT, type CreateStep } from "./createQuips";

/** 길 위를 날아가는 편지 — 진행 표시의 손잡이. 삽화 속 양이 든 편지와 같은 물건(밀랍 봉인) */
const LetterMark = () => (
  <svg viewBox="0 0 34 30" aria-hidden>
    <path
      d="M3 7.5 17 2l14 5.5v17.5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z"
      fill="#fff8e8"
      stroke="#c9a56a"
      strokeWidth="1.2"
    />
    <path d="M3 8l14 9 14-9" fill="none" stroke="#c9a56a" strokeWidth="1.2" />
    <path d="M3 25l10-8M31 25l-10-8" fill="none" stroke="#e5d6b4" strokeWidth="1" />
    <circle cx="17" cy="16.5" r="4.3" fill="#e9a21f" stroke="#b9780e" strokeWidth="1" />
    <circle cx="17" cy="16.5" r="2.1" fill="none" stroke="#fff0c2" strokeWidth=".9" />
  </svg>
);

/** 단계 사이 점 — 길 위에 찍힌 정거장. 마지막 단계 자리는 우체통이 대신한다 */
const STOPS = Array.from({ length: STEP_COUNT - 1 }, (_, i) => i);

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
            {STOPS.map((i) => (
              <span
                key={i}
                className={`cw-path__stop ${i < step - 1 ? "is-done" : ""}`}
                style={{ "--cw-stop": i / (STEP_COUNT - 1) } as CSSProperties}
              />
            ))}
            <span className="cw-path__letter">
              <LetterMark />
            </span>
            {/* 길 끝의 우체통 — 봉인하면 닿는 곳 */}
            <span className="cw-path__box" aria-hidden>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6H5z" />
                <path d="M12 16v6" />
                <path d="M9 10h5" />
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
