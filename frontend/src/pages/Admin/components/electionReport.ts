// 선거 결과서 — 공동의회 회의록에 붙이는 인쇄용 한 장(또는 몇 장).
//
// 현황판 응답(ElectionAdminDetail) + 운영 기록으로 새 창에 그려 바로 인쇄 창을 띄운다
// (QR 안내문과 같은 방식 — 뒤에 깔린 현황판까지 같이 찍히지 않게).
// 담는 것: 선거 개요, 회차별 재적·투표수(앱/종이)·유효/기권/무효·성원·기준·후보별 득표·판정,
// 당선자 총괄, 운영 기록, 서명란. 연습 회차는 넣지 않는다.
import type { ElectionAdminDetail, ElectionAuditLog, ElectionRound } from '../../../types/election'
import { escapeHtml as esc } from '../../../utils/escapeHtml'
import { quorumText, thresholdText } from '../../Election/electionShared'

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

const roundSection = (election: ElectionAdminDetail, round: ElectionRound): string => {
  const r = round.result
  if (!r) return ''
  const names = new Map(election.candidates.map((c) => [c.id, c]))
  const rows = r.tallies
    .map((t) => {
      const c = names.get(t.candidate_id)
      const pct = r.base ? ((t.votes * 100) / r.base).toFixed(1) : '—'
      const verdict = !r.is_final ? '(진행 중)' : t.elected ? '당선' : t.tied ? '동률 (다음 회차)' : ''
      return `<tr><td class="n">${c?.number ?? ''}</td><td>${esc(c?.name ?? String(t.candidate_id))}</td>
        <td class="n">${t.votes}</td><td class="n">${pct}%</td><td class="v">${verdict}</td></tr>`
    })
    .join('')
  const breakdown =
    r.app_ballots != null
      ? `<tr><th>투표 내역</th><td>앱 ${r.app_ballots}표 · 종이 ${r.paper_ballots}표 / 유효 ${r.valid_ballots} · 기권 ${r.abstain_ballots} · 무효 ${r.invalid_ballots}</td></tr>`
      : ''
  const quorum = r.quorum_required
    ? `<tr><th>성원</th><td>${esc(quorumText(round.rules) ?? '')} — ${r.quorum_required}명 필요, ${
        r.quorum_met ? '<b>충족</b>' : '<b class="warn">미달</b>'
      }</td></tr>`
    : ''
  return `<section>
  <h2>${round.round_no}차 투표</h2>
  <table class="meta">
    <tr><th>투표 시간</th><td>${fmt(round.opened_at)} ~ ${fmt(round.closed_at)}</td></tr>
    <tr><th>선출</th><td>${round.seats_open}명 · 한 표에 ${round.max_select}명까지</td></tr>
    <tr><th>재적 · 투표</th><td>재적 ${r.voters_total}명 · 투표 ${r.ballots}명 (${
      r.voters_total ? Math.round((r.ballots * 100) / r.voters_total) : 0
    }%)</td></tr>
    ${breakdown}
    ${quorum}
    <tr><th>당선 기준</th><td>${esc(thresholdText(round.rules))} — ${r.base}의 기준 ${r.required}표</td></tr>
  </table>
  <table class="tally">
    <thead><tr><th>기호</th><th>후보</th><th>득표</th><th>득표율</th><th>판정</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`
}

export const printElectionReport = (election: ElectionAdminDetail, logs: ElectionAuditLog[]): boolean => {
  const w = window.open('', '_blank', 'width=820,height=1000')
  if (!w) return false
  const rounds = election.rounds.filter((r) => !r.is_practice && r.status === 'closed')
  const elected = election.candidates
    .filter((c) => c.elected_round_no != null)
    .sort((a, b) => (a.elected_round_no! - b.elected_round_no!) || a.number - b.number)
  const logRows = logs
    .slice()
    .reverse()
    .map(
      (l) =>
        `<tr><td class="t">${esc(fmt(l.created_at))}</td><td>${esc(l.actor_name)}</td><td>${esc(l.summary)}</td></tr>`
    )
    .join('')
  const managers = (election.managers ?? []).map((m) => esc(m.name)).join(', ')

  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(election.title)} 결과서</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { margin: 0; font-family: system-ui, -apple-system, 'Malgun Gothic', sans-serif; color: #111; font-size: 13px; line-height: 1.55; }
  h1 { font-size: 24px; margin: 0 0 4px; letter-spacing: -0.02em; text-align: center; }
  .sub { text-align: center; color: #555; margin: 0 0 18px; }
  h2 { font-size: 16px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #111; }
  table { width: 100%; border-collapse: collapse; }
  .meta th { width: 92px; text-align: left; color: #555; font-weight: 600; padding: 3px 0; vertical-align: top; }
  .meta td { padding: 3px 0; }
  .tally { margin-top: 10px; }
  .tally th, .tally td { border: 1px solid #bbb; padding: 6px 8px; }
  .tally th { background: #f2f2f2; font-weight: 700; }
  .n { text-align: right; font-variant-numeric: tabular-nums; width: 56px; }
  .v { text-align: center; font-weight: 700; width: 120px; }
  .warn { color: #c00; }
  .elected { font-size: 15px; }
  .log td { border-bottom: 1px solid #e3e3e3; padding: 4px 6px; vertical-align: top; font-size: 11.5px; }
  .log .t { white-space: nowrap; color: #555; width: 150px; }
  .sign { margin-top: 36px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .sign div { border-top: 1px solid #111; padding-top: 6px; text-align: center; color: #333; }
  .foot { margin-top: 18px; color: #777; font-size: 11px; text-align: center; }
  section { break-inside: avoid; }
</style></head><body>
<h1>${esc(election.title)} 결과서</h1>
<p class="sub">${election.seats}명 선출 · 당선 기준 ${esc(thresholdText(election.rules))}${
    quorumText(election.rules) ? ` · 성원 ${esc(quorumText(election.rules)!)}` : ''
  }</p>
<table class="meta">
  <tr><th>선거인</th><td>앱 명부 ${election.voter_count}명 + 앱 미사용 ${election.offline_voter_count}명</td></tr>
  <tr><th>후보</th><td>${election.candidates.map((c) => `${c.number}. ${esc(c.name)}`).join(', ')}</td></tr>
  ${managers ? `<tr><th>선거관리위원</th><td>${managers}</td></tr>` : ''}
  <tr><th>무기명</th><td>누가 투표했는지와 어떤 표인지는 서로 연결 없이 따로 저장되었습니다.</td></tr>
</table>
${rounds.map((r) => roundSection(election, r)).join('') || '<p>마감된 회차가 없습니다.</p>'}
<h2>당선자</h2>
<p class="elected">${
    elected.length
      ? elected.map((c) => `${c.number}. ${esc(c.name)} (${c.elected_round_no}차)`).join(' · ')
      : '당선자 없음'
  } — 당선 ${elected.length} / ${election.seats}명</p>
${logRows ? `<h2>운영 기록</h2><table class="log"><tbody>${logRows}</tbody></table>` : ''}
<div class="sign"><div>선거관리위원장</div><div>선거관리위원</div><div>당회장</div></div>
<p class="foot">출력 ${esc(fmt(new Date().toISOString()))}</p>
<script>window.onload = function () { window.print(); };</script>
</body></html>`)
  w.document.close()
  return true
}
