// Cloudtype Keep-Alive — Cloudflare Worker 판. keep-alive의 본진이다.
//
// GitHub Actions(.github/workflows/cloudtype-keep-alive.yml)에 같은 로직이 있지만
// 그쪽은 예약 실행 지연/유실이 심해 보조로만 둔다(자세한 사정은 wrangler.toml 참고).
// 실제로 제때 감지하고 살리는 건 이 Worker다.
// 양쪽 모두 "이미 실행/기동 중이면 건드리지 않는" 로직이라 동시에 돌아도 충돌 없다.
//
// 클라우드타입 프리티어는 매일 1회 강제 중지되므로(슬립이 아님) HTTP 핑으로는 못 깨운다.
// 대시보드 ▶ 버튼이 호출하는 API를 그대로 불러서 꺼진 서비스만 다시 기동한다.
//
// 시크릿: CLOUDTYPE_TOKEN (wrangler secret put CLOUDTYPE_TOKEN)

const API = 'https://api.cloudtype.io';
const SCOPE = 'chambit.mission';
const PROJECT = 'chambit';
const STAGE = 'main';
// 기동 순서대로 나열한다. DB가 먼저 떠야 앱이 정상 기동한다.
const SERVICES = ['mariadb', 'chambit'];

// 이미 올라오는 중인 서비스에 start를 또 보내면 처음부터 다시 시작되어
// 오히려 다운타임이 길어진다. 기동 중인 상태는 건드리지 않고 기다린다.
const IN_PROGRESS = new Set([
  'starting', 'pending', 'deploying', 'building',
  'provisioning', 'initializing', 'creating',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchStat(token) {
  const res = await fetch(`${API}/scope/${SCOPE}/resource/stat`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`stat 조회 실패: HTTP ${res.status}`);
  return res.json();
}

function statusOf(statJson, name) {
  const hit = (statJson.stats ?? []).find(
    (s) => s.name === name && s.stage === STAGE,
  );
  return hit ? hit.status : 'absent';
}

async function wake(env) {
  const token = env.CLOUDTYPE_TOKEN;
  const logs = [];
  const log = (msg) => {
    console.log(msg);
    logs.push(msg);
  };

  if (!token) {
    log('ERROR: CLOUDTYPE_TOKEN 시크릿이 설정되지 않았습니다.');
    return logs;
  }

  let statJson;
  try {
    statJson = await fetchStat(token);
  } catch (e) {
    log(`WARN: 상태 조회 실패(${e.message}). 이번 회차는 건너뛴다. 다음 정시에 재시도.`);
    return logs;
  }

  // 응답이 비었으면 토큰 만료나 API 변경일 수 있다.
  // 이 상태에서 무작정 start를 때리면 멀쩡한 서비스를 재시작시킬 위험이 있으므로 중단한다.
  if (!Array.isArray(statJson.stats) || statJson.stats.length === 0) {
    log('ERROR: 상태 응답에 서비스가 없습니다. 토큰 만료 또는 API 형식 변경 가능성.');
    return logs;
  }

  const started = [];
  const booting = [];
  for (const svc of SERVICES) {
    const st = statusOf(statJson, svc);
    log(`[${svc}] status=${st}`);

    if (st === 'running') continue;
    if (IN_PROGRESS.has(st)) {
      // 5분 간격이라 직전 회차가 띄운 서비스를 기동 중에 다시 만나는 일이 잦다.
      log(`[${svc}] 기동 중 → 그대로 둔다`);
      booting.push(svc);
      continue;
    }

    log(`[${svc}] 중지 상태 → 기동 요청`);
    const res = await fetch(
      `${API}/project/${SCOPE}/${PROJECT}/stage/${STAGE}/deployment/${svc}/start`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Length': '0' },
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (res.ok) {
      log(`[${svc}] 기동 요청 성공 (HTTP ${res.status})`);
      started.push(svc);
      // DB가 먼저 자리를 잡아야 앱이 붙는다.
      if (svc === 'mariadb') await sleep(20_000);
    } else {
      const body = (await res.text()).slice(0, 500);
      log(`ERROR: [${svc}] 기동 요청 실패 (HTTP ${res.status}) ${body}`);
      return logs;
    }
  }

  if (started.length === 0) {
    log(
      booting.length === 0
        ? '모든 서비스가 정상 실행 중. 할 일 없음.'
        : `기동 중이라 대기: ${booting.join(' ')} (다음 회차에 재확인)`,
    );
    return logs;
  }

  // 기동을 요청했으면 실제로 떴는지 확인한다. 최대 3분.
  log(`기동 확인 중: ${started.join(' ')}`);
  for (let i = 1; i <= 18; i++) {
    await sleep(10_000);
    try {
      statJson = await fetchStat(token);
    } catch {
      continue;
    }
    const pending = started.filter((svc) => statusOf(statJson, svc) !== 'running');
    if (pending.length === 0) {
      log(`기동 완료: ${started.join(' ')}`);
      return logs;
    }
    log(`  (${i}/18) 대기 중: ${pending.join(' ')}`);
  }

  log('WARN: 3분 내에 running 상태가 되지 않았습니다. 빌드가 오래 걸리는 중일 수 있습니다. 다음 회차에 다시 확인.');
  return logs;
}

export default {
  // Cron Trigger가 부르는 진입점
  async scheduled(event, env, ctx) {
    ctx.waitUntil(wake(env));
  },

  // 수동 테스트용: Cloudtype 토큰을 아는 사람만 호출 가능.
  //   curl -X POST -H "Authorization: Bearer <CLOUDTYPE_TOKEN>" https://<worker-url>/wake
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/wake' || request.method !== 'POST') {
      return new Response('cloudtype-keepalive: cron worker (POST /wake to trigger manually)', { status: 200 });
    }
    const auth = request.headers.get('authorization') ?? '';
    if (!env.CLOUDTYPE_TOKEN || auth !== `Bearer ${env.CLOUDTYPE_TOKEN}`) {
      return new Response('unauthorized', { status: 401 });
    }
    const logs = await wake(env);
    return new Response(logs.join('\n') + '\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
