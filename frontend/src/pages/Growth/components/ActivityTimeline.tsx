import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TimelineDomain, TimelineEvent } from "../../../types/growth";
import { TimelineEventGlyph } from "../../../components/icons/GrowthIcons";
import {
  DOMAIN_META,
  DOMAIN_ORDER,
  dayAnchorId,
  dayLabel,
  ymdLocal,
} from "./timelineMeta";
import { daySentence, foldLabel, isMoment, segmentDays } from "./dayStory";
import { smoothScrollToElement } from "../../../utils/scrollTo";
import "./ActivityTimeline.css";

/** 달력 → 그날 이동 시 상단에 남길 여백(px) — .atl-day 의 scroll-margin-top(8rem)과 같은 값.
    앱 헤더 56px + 화면 헤더 아래에 멈추게 한다 */
const JUMP_OFFSET = 128;

interface ActivityTimelineProps {
  events: TimelineEvent[];
  /** 지금까지 받은 구간(페이지) 수 — 필터 자동 탐색 예산 계산용 */
  pageCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  /** 돌아보기 달력에서 고른 날 — nonce 가 바뀔 때마다 그날로 스크롤한다 */
  jumpTo?: { date: string; nonce: number } | null;
}

/** 하루에 순간 카드가 많으면 처음 몇 개만 펼쳐 두고 나머지는 접는다 — 하루가 화면을 다 덮지 않게.
    한 줄짜리 조용한 기록(읽기·함께 기도 묶음)은 하루 몇 개 안 되니 늘 다 보여 준다 */
const DAY_PREVIEW = 2;

/** 상단 유형 필터 — '전체' 또는 도메인 하나 */
type TimelineFilter = "all" | TimelineDomain;

const FILTER_OPTIONS: { key: TimelineFilter; label: string; color: string }[] =
  [
    { key: "all", label: "전체", color: "var(--brand)" },
    ...DOMAIN_ORDER.map((d) => ({
      key: d,
      label: DOMAIN_META[d].label,
      color: DOMAIN_META[d].color,
    })),
  ];

/** 필터 결과가 비었을 때 이전 구간(60일)을 자동으로 더 당겨오는 최대 횟수.
    기록이 몇 년치여도 무한정 페이지를 긁지 않도록 상한을 두고, 그 뒤엔
    '이전 기록 더 보기' 버튼으로 사용자가 직접 이어간다 */
const AUTO_LOAD_LIMIT = 3;

const monthLabel = (dateStr: string): string => {
  const [y, m] = dateStr.split("-").map(Number);
  return `${y}년 ${m}월`;
};

const monthKey = (dateStr: string) => dateStr.slice(0, 7);

interface DayGroup {
  date: string;
  events: TimelineEvent[];
  /** 이 그룹에서 달이 바뀌는지 — 월 구분선 표시용 */
  showMonth: boolean;
}

const groupByDay = (events: TimelineEvent[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  const index = new Map<string, DayGroup>();
  events.forEach((e) => {
    let group = index.get(e.date);
    if (!group) {
      group = { date: e.date, events: [], showMonth: false };
      index.set(e.date, group);
      groups.push(group);
    }
    group.events.push(e);
  });
  let lastMonth = "";
  groups.forEach((group) => {
    const mKey = monthKey(group.date);
    group.showMonth = mKey !== lastMonth;
    lastMonth = mKey;
  });
  return groups;
};

/** 기록 종류 이름 — 순간 카드 머리에 붙인다 */
const MOMENT_KIND: Partial<Record<TimelineEvent["type"], string>> = {
  prayer: "내가 올린 기도",
  answered: "기도가 응답되었어요",
  meditation: "오늘의 묵상",
  thanks: "감사",
  note: "묵상 노트",
  session: "기도 시간",
  post: "나눔",
};

/** 조용한 기록 — 카드 없이 한 줄. 읽기·함께 기도 묶음·플랜·게임 */
const QuietRow = ({ event }: { event: TimelineEvent }) => {
  const navigate = useNavigate();
  const clickable = !!event.link;
  const color = (DOMAIN_META[event.domain] ?? DOMAIN_META.prayer).color;
  const verses =
    typeof event.meta?.verse_count === "number" ? event.meta.verse_count : null;
  // 읽기 묶음은 제목 끝 '읽기'를 떼고 오른쪽에 절 수만 — 한 줄에 다 들어오게
  const title =
    event.type === "read" ? event.title.replace(/\s*읽기$/, "") : event.title;
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && navigate(event.link as string)}
      className="atl-quiet"
    >
      <span className="atl-quiet-ico" style={{ color }} aria-hidden="true">
        <TimelineEventGlyph event={event} size={15} />
      </span>
      <span className="atl-quiet-title">{title}</span>
      {verses !== null ? (
        <span className="atl-quiet-meta">{verses}절</span>
      ) : event.time ? (
        <span className="atl-quiet-meta">{event.time}</span>
      ) : null}
    </button>
  );
};

/** 기억할 순간 — 내가 쓴 글이 남는 기록. 응답 기도는 골드로 한 번 더 띄운다 */
const MomentCard = ({ event }: { event: TimelineEvent }) => {
  const navigate = useNavigate();
  const clickable = !!event.link;
  const answered = event.type === "answered";
  const color = answered
    ? "var(--atl-gold)"
    : (DOMAIN_META[event.domain] ?? DOMAIN_META.prayer).color;
  const kind =
    MOMENT_KIND[event.type] ?? DOMAIN_META[event.domain]?.label ?? "";
  // 제목이 기본 문구면 머리 라벨과 겹치니 생략하고 본문만 보여 준다
  const defaultTitle =
    /^(기도를 올렸어요|감사를 적었어요|커뮤니티에 글을 남겼어요|기도가 응답되었어요)$/;
  const title = answered
    ? event.title.replace(/^기도가 응답되었어요:\s*/, "")
    : event.title;
  const showTitle = !!title && !defaultTitle.test(title);
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && navigate(event.link as string)}
      className={"atl-moment" + (answered ? " is-answered" : "")}
      style={{ ["--atl-accent" as string]: color }}
    >
      <span className="atl-moment-kind">
        <TimelineEventGlyph event={event} size={14} />
        {kind}
        {event.time && <span className="atl-moment-time">{event.time}</span>}
      </span>
      {showTitle && <span className="atl-moment-title">{title}</span>}
      {event.snippet && (
        <span className="atl-moment-text">{event.snippet}</span>
      )}
    </button>
  );
};

const ActivityTimeline = ({
  events,
  pageCount,
  hasMore,
  isLoadingMore,
  onLoadMore,
  jumpTo,
}: ActivityTimelineProps) => {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [flashDate, setFlashDate] = useState<string | null>(null);
  const expand = (date: string) =>
    setExpanded((prev) => (prev.has(date) ? prev : new Set(prev).add(date)));
  const filtered = useMemo(
    () =>
      filter === "all" ? events : events.filter((e) => e.domain === filter),
    [events, filter],
  );
  const dayGroups = useMemo(() => groupByDay(filtered), [filtered]);
  const expandAll = (dates: string[]) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      dates.forEach((d) => next.add(d));
      return next;
    });
  // 순간 없이 이어진 날은 한 줄로 접는다 — 유형 필터를 켠 상태에선 전부 '조용한 날'이 되어
  // 다 접혀 버리므로 '전체'에서만 접는다
  const today = ymdLocal(new Date());
  const segments = useMemo(
    () =>
      filter === "all"
        ? segmentDays(dayGroups, today)
        : dayGroups.map((day) => ({ kind: "day" as const, day })),
    [dayGroups, filter, today],
  );
  const filterLabel = FILTER_OPTIONS.find((f) => f.key === filter)?.label ?? "";

  // 특정 유형만 보는데 지금까지 받은 구간엔 그 유형이 하나도 없으면
  // 이전 구간을 자동으로 몇 번 더 당겨본다. 예산은 "필터를 고른 시점의 페이지 수"
  // 기준으로 세어 effect 안에서 setState 없이 계산한다(필터를 바꾸거나 버튼을
  // 직접 누르면 기준점을 지금으로 옮겨 예산이 되살아난다).
  // inFlight 는 onLoadMore 호출 뒤 isLoadingMore 가 true 로 바뀌기 전
  // 재렌더에서 두 번 부르는 걸 막는 잠금이다
  const [pagesAtSelect, setPagesAtSelect] = useState(pageCount);
  const inFlight = useRef(false);
  const autoLoadExhausted = pageCount - pagesAtSelect >= AUTO_LOAD_LIMIT;
  const selectFilter = (next: TimelineFilter) => {
    setFilter(next);
    setPagesAtSelect(pageCount);
    inFlight.current = false;
  };
  useEffect(() => {
    if (isLoadingMore) {
      inFlight.current = false;
      return;
    }
    if (filter === "all" || filtered.length > 0 || !hasMore) return;
    if (inFlight.current || autoLoadExhausted) return;
    inFlight.current = true;
    onLoadMore();
  }, [
    filter,
    filtered.length,
    hasMore,
    isLoadingMore,
    onLoadMore,
    autoLoadExhausted,
  ]);

  // 달력에서 고른 날로 이동 — 필터가 그날을 가리고 있을 수 있어 '전체'로 되돌리고,
  // 접혀 있던 하루는 펼친다(렌더 중 상태 조정). 스크롤은 그 렌더가 커밋된 뒤 effect 에서.
  // scrollIntoView(smooth) 는 이 앱 구조(실제 스크롤러가 body)에서 모바일 브라우저가
  // 조용히 무시한다 — PC 에서만 되고 폰에서는 안 움직이던 원인. 스크롤러를 직접 찾아
  // 미는 smoothScrollToElement 로 이동하고, 헤더 여백은 JUMP_OFFSET 으로 준다
  const [handledJump, setHandledJump] = useState(0);
  if (jumpTo && jumpTo.nonce !== handledJump) {
    setHandledJump(jumpTo.nonce);
    setFilter("all");
    setExpanded((prev) =>
      prev.has(jumpTo.date) ? prev : new Set(prev).add(jumpTo.date),
    );
    setFlashDate(jumpTo.date);
  }
  useEffect(() => {
    if (!jumpTo) return;
    const raf = requestAnimationFrame(() => {
      smoothScrollToElement(document.getElementById(dayAnchorId(jumpTo.date)), {
        offset: JUMP_OFFSET,
      });
    });
    const t = window.setTimeout(() => setFlashDate(null), 2200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [jumpTo]);

  const renderDay = (group: DayGroup) => {
    const quiet = group.events.filter((e) => !isMoment(e));
    const moments = group.events.filter(isMoment);
    const open = expanded.has(group.date);
    const shown = open ? moments : moments.slice(0, DAY_PREVIEW);
    const sentence = daySentence(group.events);
    const answered = moments.some((e) => e.type === "answered");
    return (
      <Fragment key={group.date}>
        {group.showMonth && (
          <div className="atl-month">{monthLabel(group.date)}</div>
        )}
        {/* 하루 — 레일 위 점 + 큰 날짜 + 그날을 말해 주는 한 문장. 그 아래 조용한 기록은 한 줄씩,
            내가 쓴 글이 남는 순간만 카드로 띄운다 */}
        <div
          id={dayAnchorId(group.date)}
          className={
            "atl-node atl-day" + (flashDate === group.date ? " is-flash" : "")
          }
        >
          <span
            className={
              "atl-dot" +
              (answered
                ? " is-answered"
                : moments.length > 0
                  ? " is-moment"
                  : "")
            }
            aria-hidden="true"
          />
          <div className="atl-day-head">
            <span className="atl-day-num" aria-hidden="true">
              {Number(group.date.slice(8))}
            </span>
            <span className="atl-day-label">{dayLabel(group.date)}</span>
          </div>
          {sentence && <p className="atl-day-say">{sentence}</p>}

          {quiet.length > 0 && (
            <div className="atl-quiet-list">
              {quiet.map((event) => (
                <QuietRow key={event.id} event={event} />
              ))}
            </div>
          )}
          {shown.map((event) => (
            <MomentCard key={event.id} event={event} />
          ))}
          {!open && moments.length > DAY_PREVIEW && (
            <button
              type="button"
              className="atl-day-more"
              onClick={() => expand(group.date)}
            >
              이날 기록 {moments.length - DAY_PREVIEW}개 더 보기
              <span className="material-icons-outlined" aria-hidden="true">
                expand_more
              </span>
            </button>
          )}
        </div>
      </Fragment>
    );
  };

  return (
    // lg+: 한 줄짜리 이벤트 카드라 폭을 다 주면 글이 왼쪽에 몰린다 —
    // 다른 피드형 화면과 같은 읽기 폭으로 묶어 가운데 배치한다
    <div className="px-4 pt-6 pb-10 lg:max-w-[680px] lg:mx-auto">
      <h3 className="text-[14px] font-bold text-ink-strong mb-4 flex items-center gap-2 tracking-[-0.01em]">
        <span className="material-icons-outlined text-xl text-brand">
          history
        </span>
        하루하루의 발자취
      </h3>

      {/* 유형별 필터 탭 — 기록이 길어지면 말씀만·기도만 골라 복기할 수 있게.
          칩 색은 카드 액센트 바·도메인 칩과 같은 --atl-* 를 쓴다 */}
      {events.length > 0 && (
        <div
          className="atl-filter scrollbar-hide -mx-4 px-4 mb-4"
          role="tablist"
          aria-label="활동 유형 필터"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = opt.key === filter;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectFilter(opt.key)}
                className={"atl-filter-chip" + (active ? " is-active" : "")}
                style={{ ["--atl-accent" as string]: opt.color }}
              >
                {opt.key !== "all" && (
                  <span className="atl-filter-dot" aria-hidden="true" />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-gray-500 dark:text-white/50">
          아직 기록된 활동이 없어요.
          <br />
          오늘 한 줄 기도, 한 절 읽기부터 시작해보세요.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-gray-500 dark:text-white/50">
          {isLoadingMore ? (
            <>
              {filterLabel} 기록을 찾는 중…
              <br />
              <span className="text-[12px] text-gray-400 dark:text-white/40">
                이전 구간을 이어서 살펴보고 있어요
              </span>
            </>
          ) : hasMore && autoLoadExhausted ? (
            <>
              최근 기록엔 {filterLabel} 활동이 없어요.
              <br />
              <span className="text-[12px] text-gray-400 dark:text-white/40">
                아래 버튼으로 더 이전 기록을 이어서 볼 수 있어요
              </span>
            </>
          ) : (
            <>아직 {filterLabel} 기록이 없어요.</>
          )}
        </div>
      ) : (
        <div className="atl-feed">
          {segments.map((seg) => {
            if (seg.kind === "fold") {
              const open = seg.days.some((d) => expanded.has(d.date));
              if (!open) {
                return (
                  <Fragment key={`fold-${seg.key}`}>
                    {seg.days[0].showMonth && (
                      <div className="atl-month">
                        {monthLabel(seg.days[0].date)}
                      </div>
                    )}
                    <div className="atl-node atl-fold">
                      <span className="atl-dot is-fold" aria-hidden="true" />
                      <button
                        type="button"
                        className="atl-fold-btn"
                        onClick={() => expandAll(seg.days.map((d) => d.date))}
                      >
                        <span className="min-w-0">{foldLabel(seg.days)}</span>
                        <span
                          className="material-icons-outlined"
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </button>
                    </div>
                  </Fragment>
                );
              }
              return (
                <Fragment key={`fold-${seg.key}`}>
                  {seg.days.map(renderDay)}
                </Fragment>
              );
            }
            return renderDay(seg.day);
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={() => {
              // 직접 누르면 자동 탐색 횟수를 되돌려, 새 구간도 비어있을 때
              // 다시 최대 3구간까지 이어서 찾아보게 한다
              inFlight.current = true;
              setPagesAtSelect(pageCount);
              onLoadMore();
            }}
            disabled={isLoadingMore}
            className="
              px-5 py-2.5 rounded-full text-[13px] font-semibold
              text-brand
              bg-[var(--brand-soft)]
              border border-[var(--brand-soft-strong)]
              disabled:opacity-60 transition-colors
            "
          >
            {isLoadingMore ? "불러오는 중…" : "이전 기록 더 보기"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
