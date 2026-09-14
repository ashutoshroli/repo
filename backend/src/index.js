async function tableRows(db, table, columnMap, dropColumns, pickColumns) {
  const { results } = await db.prepare(`SELECT * FROM ${table} ORDER BY id ASC`).all();
  const allow = pickColumns ? new Set(pickColumns) : null;
  return results.map(r => {
    const out = {};
    for (const [col, val] of Object.entries(r)) {
      if (col === 'id') { out['__rowIndex'] = val; continue; }
      if (allow) {
        if (!allow.has(col)) continue;
      } else if (dropColumns && dropColumns.includes(col)) {
        continue;
      }
      const header = (columnMap && columnMap[col]) || col;
      out[header] = val === null ? '' : val;
    }
    return out;
  });
}

const REVERSE_MAPS = {
  users: { id_code: 'ID', name: 'Name', village: 'Village', fathers_name: "Father's Name ", mobile: 'Mobile ', designation: 'Designation', created_by: 'Created By', email: 'Email', whatsapp: 'WhatsApp', name_hindi: 'Name (Hindi)', fathers_name_hindi: "Father's Name (Hindi)", designation_hindi: 'Designation (Hindi)', village_hindi: 'Village (Hindi)', photo: 'Photo' },
  committee_members: { year: 'Year', name: 'Name', created_by: 'Created By', view_role: 'View Role', view_role_hindi: 'View Role (Hindi)', whatsapp: 'WhatsApp' },
  collections: { year: 'Year', sl_no: 'Sl. No.', name: 'Name', amount: 'Amount', created_by: 'Created By', payment_mode: 'Payment Mode', date: 'Date', contribution_type: 'Contribution Type', detail: 'Detail', certificate_or_receipt: 'Certificate Or Receipt', utr: 'UTR', is_resell: 'Is Resell', announced: 'Announced', announced_count: 'AnnouncedCount' },
  expenses: { year: 'Year', discription: 'Discription', amount: 'Amount', created_by: 'Created By', category: 'Category', discription_hindi: 'Discription (Hindi)' },
  loans: { year: 'Year', name: 'Name', amount: 'Amount', intrest_rate: 'Intrest Rate', tenure: 'Tenure', created_by: 'Created By', status: 'Status', loan_id: 'Loan ID', loan_status: 'Loan Status', final_repayment_date: 'Final Repayment Date' },
  loan_guarantors: { year: 'Year', loaner: 'Loaner', guarantor: 'Guarantor', created_by: 'Created By', loan_id: 'Loan ID' },
  generated_files: {},
  loan_consents: { loan_id: 'loan_id', role: 'role', status: 'status', person_id: 'person_id', consent_id: 'consent_id' },
};

const LOAN_CONSENTS_PUBLIC_COLS = ['loan_id', 'role', 'status', 'person_id', 'consent_id'];

const COMMITTEE_PUBLIC_COLS   = ['year', 'name', 'view_role', 'view_role_hindi'];
const COLLECTIONS_PUBLIC_COLS = ['year', 'name', 'amount', 'detail', 'contribution_type', 'certificate_or_receipt', 'is_resell'];
const EXPENSES_PUBLIC_COLS    = ['year', 'amount', 'discription', 'discription_hindi'];
const LOANS_PUBLIC_COLS       = ['year', 'name', 'amount', 'intrest_rate', 'tenure', 'loan_id'];
const GENERATED_FILES_PUBLIC_COLS = ['doc_type', 'year', 'record_id', 'public_link'];

const LOAN_GUARANTORS_PUBLIC_COLS = ['year', 'loaner', 'guarantor', 'loan_id'];

async function usersPublicSafe(env) {
  const { results: committeeRows } = await env.DB_CORE
    .prepare('SELECT name FROM committee_members')
    .all()
    .catch(() => ({ results: [] }));
  const committeeIds = new Set(
    (committeeRows || []).map(r => (r.name == null ? '' : r.name.toString().trim())).filter(Boolean)
  );

  const { results } = await env.DB_CORE.prepare('SELECT * FROM users ORDER BY id ASC').all();
  const map = REVERSE_MAPS.users;
  return results.map(r => {
    const isCommittee = committeeIds.has((r.id_code == null ? '' : r.id_code.toString().trim()));
    const out = {};
    for (const [col, val] of Object.entries(r)) {
      if (col === 'id') { out['__rowIndex'] = val; continue; }
      if (col === 'email' || col === 'whatsapp') continue;
      if (col === 'mobile' && !isCommittee) continue;
      const header = map[col] || col;
      out[header] = val === null ? '' : val;
    }
    return out;
  });
}

function pubKv(env) {
  return (env && env.KV_PUBLIC) || (env && env.KV_SESSIONS) || null;
}

const PUB_RL_WINDOW_SECONDS = 60;
const PUB_RL_MAX = 60;
const D1_DAILY_BUDGET = 4000000;
const D1_BUILD_ROWS_FLOOR = 200;

const RL_SAMPLE = 5;

async function pubRateLimited(env, ip, action) {
  try {
    const kv = pubKv(env);
    if (!kv || !ip) return false;
    const bucket = Math.floor(Date.now() / (PUB_RL_WINDOW_SECONDS * 1000));
    const key = `pub:rl:${action}:${ip}:${bucket}`;
    const cur = parseInt((await kv.get(key)) || '0', 10) || 0;
    if (cur >= PUB_RL_MAX) return true;
    if (Math.random() < 1 / RL_SAMPLE) {
      await kv.put(key, String(cur + RL_SAMPLE), { expirationTtl: PUB_RL_WINDOW_SECONDS + 5 });
    }
    return false;
  } catch (e) { return false; }
}

async function d1BudgetExceeded(env) {
  try {
    const kv = pubKv(env);
    if (!kv) return false;
    const day = new Date().toISOString().slice(0, 10);
    const used = parseInt((await kv.get(`pub:d1reads:${day}`)) || '0', 10) || 0;
    return used >= D1_DAILY_BUDGET;
  } catch (e) { return false; }
}

async function d1BudgetAdd(env, ctx, rowsRead) {
  try {
    const kv = pubKv(env);
    if (!kv) return;
    const add = Math.max(D1_BUILD_ROWS_FLOOR, parseInt(rowsRead, 10) || 0);
    const day = new Date().toISOString().slice(0, 10);
    const key = `pub:d1reads:${day}`;
    const used = parseInt((await kv.get(key)) || '0', 10) || 0;
    const put = kv.put(key, String(used + add), { expirationTtl: 172800 });
    if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
  } catch (e) {  }
}

function countPayloadRows(data) {
  try {
    let n = 0;
    for (const v of Object.values(data || {})) if (Array.isArray(v)) n += v.length;
    return n;
  } catch (e) { return 0; }
}

const SNAPSHOT_KEY = 'pub:snapshot:portalData';
const SNAPSHOT_META_KEY = 'pub:snapshot:portalData:version';

async function maybeSaveSnapshot(env, ctx, version, dataObj) {
  try {
    const kv = pubKv(env);
    if (!kv) return;
    const lastVer = await kv.get(SNAPSHOT_META_KEY);
    if (lastVer === String(version)) return;
    const SNAPSHOT_TTL = 2592000;

    const body = JSON.stringify(dataObj);
    const SNAPSHOT_MAX_BYTES = 20 * 1024 * 1024;
    if (body.length > SNAPSHOT_MAX_BYTES) {
      await logPublicError(
        env, 'public-backend', 'maybeSaveSnapshot',
        `Snapshot NOT saved: the portalData payload is ${(body.length / 1048576).toFixed(1)} MB, ` +
        `over the ${SNAPSHOT_MAX_BYTES / 1048576} MB guard (KV's hard limit is 25 MB). ` +
        'The last-known-good fallback is therefore UNAVAILABLE — if D1 goes down or hits its ' +
        'daily row limit, the public portal will fail instead of serving a stale copy. ' +
        'Fix by paginating the public payload (audit H-5).',
        '', JSON.stringify({ bytes: body.length, version }), ''
      );
      return;
    }

    const writes = Promise.all([
      kv.put(SNAPSHOT_KEY, body, { expirationTtl: SNAPSHOT_TTL }),
      kv.put(SNAPSHOT_META_KEY, String(version), { expirationTtl: SNAPSHOT_TTL }),
    ]);
    if (ctx && ctx.waitUntil) ctx.waitUntil(writes); else await writes;
  } catch (e) {  }
}

async function serveSnapshot(env, cors) {
  try {
    const kv = pubKv(env);
    if (!kv) return null;
    const raw = await kv.get(SNAPSHOT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return new Response(JSON.stringify({ ...data, stale: true, staleReason: 'Live data source is temporarily unavailable; showing the most recent saved copy.' }), {
      headers: { ...cors, 'Cache-Control': 'no-store' },
    });
  } catch (e) { return null; }
}

async function getAllPortalData(env) {
  return {
    users: await usersPublicSafe(env),
    committee: await tableRows(env.DB_CORE, 'committee_members', REVERSE_MAPS.committee_members, null, COMMITTEE_PUBLIC_COLS),
    collections: await tableRows(env.DB_COLLECTIONS, 'collections', REVERSE_MAPS.collections, null, COLLECTIONS_PUBLIC_COLS),
    expenses: await tableRows(env.DB_LOANS_EXPENSES, 'expenses', REVERSE_MAPS.expenses, null, EXPENSES_PUBLIC_COLS),
    loans: await tableRows(env.DB_LOANS_EXPENSES, 'loans', REVERSE_MAPS.loans, null, LOANS_PUBLIC_COLS),
    guarantors: await tableRows(env.DB_LOANS_EXPENSES, 'loan_guarantors', REVERSE_MAPS.loan_guarantors, null, LOAN_GUARANTORS_PUBLIC_COLS),
    generatedFiles: await tableRows(env.DB_FILE_INDEX, 'generated_files', REVERSE_MAPS.generated_files, null, GENERATED_FILES_PUBLIC_COLS),
    loanConsents: await tableRows(env.DB_LOANS_EXPENSES, 'loan_consents', REVERSE_MAPS.loan_consents, null, LOAN_CONSENTS_PUBLIC_COLS),
    journeyEntries: await getJourneyEntries(env),
    journeyTagline: await getJourneyTagline(env),
    journeyPageText: await getJourneyPageText(env),
    donation: await getDonationSettings(env),
  };
}

async function getDonationSettings(env) {
  const out = {
    upiId: '',
    qrUrl: '',
    bankAccountName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    whatsapp: ''
  };
  if (!env || !env.DB_CORE) return out;
  const KEYS = {
    donation_upi_id: 'upiId',
    donation_qr_url: 'qrUrl',
    donation_bank_account_name: 'bankAccountName',
    donation_bank_name: 'bankName',
    donation_account_number: 'accountNumber',
    donation_ifsc: 'ifsc',
    donation_whatsapp: 'whatsapp'
  };
  try {
    const keys = Object.keys(KEYS);
    const placeholders = keys.map(() => '?').join(', ');
    const { results } = await env.DB_CORE
      .prepare(`SELECT "key", value FROM portal_settings WHERE "key" IN (${placeholders})`)
      .bind(...keys)
      .all();
    for (const r of results || []) {
      const field = KEYS[r.key];
      if (field) out[field] = r.value || '';
    }
  } catch (e) {
    const msg = (e && e.message ? e.message : String(e)).toLowerCase();
    if (!msg.includes('no such table') && !msg.includes('no such column')) throw e;
  }
  return out;
}

async function getJourneyPageText(env) {
  const out = { en: {}, hi: {} };
  if (!env || !env.DB_CORE) return out;
  try {
    const { results } = await env.DB_CORE
      .prepare('SELECT "key", value FROM portal_settings WHERE "key" IN (?, ?)')
      .bind('journey_page_text_en', 'journey_page_text_hi')
      .all();
    for (const r of results || []) {
      const lang = r.key === 'journey_page_text_hi' ? 'hi' : 'en';
      try {
        const obj = JSON.parse((r.value || '{}').toString());
        if (obj && typeof obj === 'object') out[lang] = obj;
      } catch (e) {  }
    }
  } catch (e) {
    const msg = (e && e.message ? e.message : String(e)).toLowerCase();
    if (!msg.includes('no such table') && !msg.includes('no such column')) throw e;
  }
  return out;
}

async function getJourneyEntries(env) {
  if (!env || !env.DB_CORE) return [];
  try {
    const { results } = await env.DB_CORE
      .prepare('SELECT year, title_en, title_hi, content_en, content_hi, position FROM journey_entries ORDER BY position ASC, year ASC')
      .all();
    return (results || []).map(r => ({
      year: r.year == null ? '' : Number(r.year),
      title_en: r.title_en || '',
      title_hi: r.title_hi || '',
      content_en: r.content_en || '',
      content_hi: r.content_hi || '',
    }));
  } catch (e) {
    const msg = (e && e.message ? e.message : String(e)).toLowerCase();
    if (msg.includes('no such table') || msg.includes('no such column')) return [];
    throw e;
  }
}

async function getJourneyTagline(env) {
  const out = { en: '', hi: '' };
  if (!env || !env.DB_CORE) return out;
  try {
    const { results } = await env.DB_CORE
      .prepare('SELECT "key", value FROM portal_settings WHERE "key" IN (?, ?)')
      .bind('journey_tagline_en', 'journey_tagline_hi')
      .all();
    for (const r of results || []) {
      if (r.key === 'journey_tagline_en') out.en = r.value || '';
      if (r.key === 'journey_tagline_hi') out.hi = r.value || '';
    }
  } catch (e) {
    const msg = (e && e.message ? e.message : String(e)).toLowerCase();
    if (!msg.includes('no such table') && !msg.includes('no such column')) throw e;
  }
  return out;
}

async function getPortalSummary(env) {
  const safeAgg = async (db, sql) => {
    if (!db) return [];
    try {
      const { results } = await db.prepare(sql).all();
      return results || [];
    } catch (e) {
      const msg = (e && e.message ? e.message : String(e)).toLowerCase();
      if (msg.includes('no such table') || msg.includes('no such column')) return [];
      throw e;
    }
  };

  const [coll, exp, loan] = await Promise.all([
    safeAgg(env.DB_COLLECTIONS, 'SELECT year, COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM collections GROUP BY year'),
    safeAgg(env.DB_LOANS_EXPENSES, 'SELECT year, COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM expenses GROUP BY year'),
    safeAgg(env.DB_LOANS_EXPENSES, 'SELECT year, COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM loans GROUP BY year'),
  ]);

  const byYear = new Map();
  const yr = (v) => (v === null || v === undefined ? '' : String(parseInt(v, 10) || v));
  const bump = (rows, tKey, cKey) => {
    for (const r of rows) {
      const y = yr(r.year);
      const cur = byYear.get(y) || { year: y, collectionTotal: 0, collectionCount: 0, expenseTotal: 0, expenseCount: 0, loanTotal: 0, loanCount: 0 };
      cur[tKey] = Number(r.total) || 0;
      cur[cKey] = Number(r.n) || 0;
      byYear.set(y, cur);
    }
  };
  bump(coll, 'collectionTotal', 'collectionCount');
  bump(exp, 'expenseTotal', 'expenseCount');
  bump(loan, 'loanTotal', 'loanCount');

  const years = [...byYear.values()].sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0));
  return { years };
}

function isTruthyFlag(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === null || v === undefined) return false;
  const s = v.toString().trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function parseStoredDate(v) {
  if (!v) return null;
  const raw = v.toString().trim();
  if (!raw) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  let d = new Date(raw.replace(' ', 'T') + (hasZone ? '' : 'Z'));
  if (!isNaN(d.getTime())) return d;
  d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeSlideDurationMs(v) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) return 5000;
  if (n < 1000) return 1000;
  if (n > 60000) return 60000;
  return n;
}

async function getActivePublicPopups(env) {
  if (!env.DB_MISC) return [];
  const now = new Date();
  const { results: allPopups } = await env.DB_MISC.prepare(
    'SELECT popup_id, title, roles, active, start_at, end_at FROM popups'
  ).all();
  const popups = allPopups.filter(p => {
    if (!isTruthyFlag(p.active)) return false;
    const rolesList = (p.roles || '').split(',').map(r => r.trim()).filter(Boolean);
    if (!rolesList.includes('Public')) return false;
    const start = parseStoredDate(p.start_at);
    const end = parseStoredDate(p.end_at);
    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  });
  if (!popups.length) return [];
  const { results: allSlides } = await env.DB_MISC.prepare(
    'SELECT slide_id, popup_id, slide_order, image_url, text, link_url, link_text, duration_ms FROM popup_slides ORDER BY slide_order ASC'
  ).all();
  return popups
    .map(p => ({
      popup_id: p.popup_id,
      title: p.title,
      slides: allSlides
        .filter(s => s.popup_id === p.popup_id)
        .map(s => ({
          slide_id: s.slide_id,
          slide_order: parseInt(s.slide_order) || 0,
          image_url: s.image_url || '',
          text: s.text || '',
          link_url: s.link_url || '',
          link_text: s.link_text || '',
          duration_ms: normalizeSlideDurationMs(s.duration_ms),
        })),
    }))
    .filter(p => p.slides.length > 0);
}

const LOG_DEDUP_WINDOW_MS = 5 * 60 * 1000;

function randomHexId(bytes = 8) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < buf.length; i++) out += buf[i].toString(16).padStart(2, '0');
  return out;
}

const PUSH_ENDPOINT_MAX = 500;
const PUSH_KEY_MAX = 200;
const PUSH_UA_MAX = 200;

async function savePushSubscription(env, body, userAgent) {
  try {
    if (!env.DB_CORE) return { success: false, message: 'Not available' };
    const clamp = (v, n) => (v === undefined || v === null ? '' : v.toString().trim()).slice(0, n);

    const sub = body && typeof body.subscription === 'object' && body.subscription ? body.subscription : body || {};
    const keys = (sub && typeof sub.keys === 'object' && sub.keys) || {};
    const endpoint = clamp(sub.endpoint, PUSH_ENDPOINT_MAX);
    const p256dh = clamp(keys.p256dh ?? sub.p256dh, PUSH_KEY_MAX);
    const auth = clamp(keys.auth ?? sub.auth, PUSH_KEY_MAX);

    if (!endpoint || !/^https:\/\//i.test(endpoint) || !p256dh || !auth) {
      return { success: false, message: 'Invalid subscription' };
    }

    const now = new Date().toISOString();
    const ua = clamp(userAgent, PUSH_UA_MAX);
    await env.DB_CORE.prepare(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent, active, last_error, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NULL, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         user_agent = excluded.user_agent,
         active = 1,
         last_error = NULL,
         updated_at = excluded.updated_at`
    )
      .bind(endpoint, p256dh, auth, ua, now, now)
      .run();
    return { success: true };
  } catch (e) {
    console.error('[public savePushSubscription] failed:', e && e.message);
    return { success: false, message: 'Could not save the subscription' };
  }
}

const PUBLIC_LOG_WINDOW_MS = 60 * 1000;
const PUBLIC_LOG_MAX_PER_IP = 20;

async function logPublicError(env, source, page, message, stack, context, clientIp) {
  try {
    if (!env.DB_LOGS) return { success: false };
    const clamp = (v, n) => (v === undefined || v === null ? '' : v.toString()).slice(0, n);
    const src = clamp(source || 'public', 100);
    const pg = clamp(page, 200);
    const msg = clamp(message, 1000);
    const ip = (clientIp || '').toString().trim();

    let ctxObj = {};
    if (context) {
      try { ctxObj = typeof context === 'string' ? JSON.parse(context) : context; }
      catch (e) { ctxObj = { note: context.toString().slice(0, 200) }; }
    }
    if (ip) ctxObj.edgeIp = ip;
    const ctx = clamp(JSON.stringify(ctxObj), 500);

    if (ip) {
      const windowStart = new Date(Date.now() - PUBLIC_LOG_WINDOW_MS).toISOString();
      let cnt = await env.DB_LOGS.prepare(
        'SELECT COUNT(*) AS n FROM error_log WHERE client_ip = ? AND created_at >= ?'
      ).bind(ip, windowStart).first().catch(() => undefined);
      if (cnt === undefined) {
        cnt = await env.DB_LOGS.prepare(
          "SELECT COUNT(*) AS n FROM error_log WHERE created_at >= ? AND context LIKE ?"
        ).bind(windowStart, `%"edgeIp":"${ip}"%`).first().catch(() => null);
      }
      if (cnt && (parseInt(cnt.n) || 0) >= PUBLIC_LOG_MAX_PER_IP) {
        return { success: false, rateLimited: true };
      }
    }

    const since = new Date(Date.now() - LOG_DEDUP_WINDOW_MS).toISOString();
    const dupe = await env.DB_LOGS.prepare(
      'SELECT error_id FROM error_log WHERE source = ? AND page = ? AND message = ? AND created_at >= ? LIMIT 1'
    ).bind(src, pg, msg, since).first().catch(() => null);
    if (dupe && dupe.error_id) return { success: true, errorId: dupe.error_id, deduped: true };

    const id = 'ERR' + randomHexId(8);
    await env.DB_LOGS.prepare(
      'INSERT INTO error_log (error_id, source, page, message, stack, context, created_at, reported, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
    ).bind(id, src, pg, msg, clamp(stack, 2000), ctx, new Date().toISOString(), ip || '').run()
      .catch(async (err) => {
        if (!/client_ip/i.test((err && err.message) || '')) throw err;
        return env.DB_LOGS.prepare(
          'INSERT INTO error_log (error_id, source, page, message, stack, context, created_at, reported) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
        ).bind(id, src, pg, msg, clamp(stack, 2000), ctx, new Date().toISOString()).run();
      });
    return { success: true, errorId: id };
  } catch (e) {
    console.error('[public logPublicError] failed:', e && e.message);
    return { success: false };
  }
}

const DATA_VERSION_KEY = 'public_data_version';

async function getDataVersion(env) {
  try {
    if (!env || !env.DB_CORE) return '0';
    const row = await env.DB_CORE.prepare('SELECT value FROM portal_settings WHERE "key" = ?')
      .bind(DATA_VERSION_KEY).first();
    return (row && row.value != null ? row.value.toString() : '0') || '0';
  } catch (e) {
    return '0';
  }
}

const PUBLIC_SEO_KEYS = {
  title: 'seo_public_title',
  description: 'seo_public_description',
  keywords: 'seo_public_keywords',
  image: 'seo_public_image',
};

async function getPublicSeoSettings(env) {
  const out = { title: '', description: '', keywords: '', image: '' };
  try {
    if (!env || !env.DB_CORE) return out;
    const keys = Object.values(PUBLIC_SEO_KEYS);
    const placeholders = keys.map(() => '?').join(', ');
    const { results } = await env.DB_CORE
      .prepare(`SELECT "key", value FROM portal_settings WHERE "key" IN (${placeholders})`)
      .bind(...keys)
      .all();
    const byKey = {};
    for (const r of results || []) byKey[r.key] = r.value;
    for (const [field, key] of Object.entries(PUBLIC_SEO_KEYS)) {
      out[field] = byKey[key] != null ? byKey[key].toString() : '';
    }
    return out;
  } catch (e) {
    return out;
  }
}

function etagFor(action, version) {
  return `W/"${action}-v${version}"`;
}

async function edgeCached(request, ctx, build) {
  let cache;
  try { cache = caches.default; } catch (e) { cache = null; }
  if (!cache) return build();

  const hit = await cache.match(request).catch(() => null);
  if (hit) return hit;

  const res = await build();
  try {
    const cc = res.headers.get('Cache-Control') || '';
    if (res.status === 200 && /max-age=\d/.test(cc)) {
      const toStore = res.clone();
      if (ctx && ctx.waitUntil) ctx.waitUntil(cache.put(request, toStore));
      else await cache.put(request, toStore);
    }
  } catch (e) {  }
  return res;
}

async function versionCached(ctx, cacheName, version, build) {
  let cache;
  try { cache = caches.default; } catch (e) { cache = null; }
  if (!cache) return build();
  const key = new Request(`https://public-cache.internal/${cacheName}?v=${encodeURIComponent(version)}`);
  const hit = await cache.match(key).catch(() => null);
  if (hit) return hit;
  const res = await build();
  try {
    if (res.status === 200) {
      const toStore = res.clone();
      if (ctx && ctx.waitUntil) ctx.waitUntil(cache.put(key, toStore));
      else await cache.put(key, toStore);
    }
  } catch (e) {  }
  return res;
}

async function serveVersionCacheOnly(request, ctx, cacheName, version, cors, etag) {
  try {
    let cache;
    try { cache = caches.default; } catch (e) { cache = null; }
    if (!cache) return null;
    const candidates = [
      request,
      new Request(`https://public-cache.internal/${cacheName}?v=${encodeURIComponent(version)}`),
    ];
    for (const key of candidates) {
      const hit = await cache.match(key).catch(() => null);
      if (hit) {
        const body = await hit.text();
        return new Response(body, { headers: { ...cors, ETag: etag, 'Cache-Control': 'public, max-age=30, stale-while-revalidate=86400' } });
      }
    }
    return null;
  } catch (e) { return null; }
}

function clientHasCurrent(request, etag) {
  const inm = request.headers.get('If-None-Match');
  if (!inm) return false;
  return inm.split(',').some(t => t.trim() === etag);
}

function corsOriginFor(request, env) {
  const configured = (env && env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.toString() : '').trim();
  if (!configured) return '*';
  const list = configured.split(',').map(s => s.trim()).filter(Boolean);
  if (list.includes('*')) return '*';
  const origin = (request.headers.get('Origin') || '').trim();
  return origin && list.includes(origin) ? origin : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const corsOrigin = corsOriginFor(request, env);
    const cors = { 'Content-Type': 'application/json' };
    if (corsOrigin) {
      cors['Access-Control-Allow-Origin'] = corsOrigin;
      if (corsOrigin !== '*') cors['Vary'] = 'Origin';
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      });
    }

    if (request.method === 'GET' && url.searchParams.get('health') === '1') {
      const checks = {};

      for (const binding of ['DB_CORE', 'DB_COLLECTIONS', 'DB_LOANS_EXPENSES', 'DB_FILE_INDEX']) {
        if (!env[binding]) { checks[binding] = 'missing-binding'; continue; }
        try {
          await env[binding].prepare('SELECT 1 AS ok').first();
          checks[binding] = 'ok';
        } catch (e) {
          checks[binding] = 'error: ' + ((e && e.message) || 'unknown').toString().slice(0, 120);
        }
      }

      for (const [binding, consequence] of [
        ['DB_MISC', 'popups will not appear'],
        ['DB_LOGS', 'public errors are not recorded'],
      ]) {
        if (!env[binding]) { checks[binding] = `degraded: missing-binding — ${consequence}`; continue; }
        try {
          await env[binding].prepare('SELECT 1 AS ok').first();
          checks[binding] = 'ok';
        } catch (e) {
          checks[binding] = 'error: ' + ((e && e.message) || 'unknown').toString().slice(0, 120);
        }
      }

      const kv = pubKv(env);
      if (!kv) {
        checks.KV_PUBLIC = 'degraded: missing-binding — rate limiting and the D1 budget guard are DISABLED (both fail open)';
      } else {
        try {
          await kv.get('pub:healthcheck:probe');
          checks.KV_PUBLIC = env.KV_PUBLIC ? 'ok' : 'ok (via the legacy KV_SESSIONS fallback — see wrangler.toml)';
        } catch (e) {
          checks.KV_PUBLIC = 'error: ' + ((e && e.message) || 'unknown').toString().slice(0, 120);
        }
      }

      const REQUIRED = ['DB_CORE', 'DB_COLLECTIONS', 'DB_LOANS_EXPENSES', 'DB_FILE_INDEX'];
      const healthy = REQUIRED.every(b => checks[b] === 'ok');
      const degraded = Object.values(checks).some(v => v.startsWith('degraded'));

      return new Response(
        JSON.stringify({ status: healthy, healthy, degraded, checks, worker: 'chhath-public-api' }),
        { status: healthy ? 200 : 503, headers: { ...cors, 'Cache-Control': 'no-store' } }
      );
    }

    const edgeIp = request.headers.get('CF-Connecting-IP') || '';
    if (edgeIp && await pubRateLimited(env, edgeIp, action || 'root')) {
      return new Response(
        JSON.stringify({ status: false, message: 'Too many requests. Please try again in a little while.' }),
        { status: 429, headers: { ...cors, 'Cache-Control': 'no-store' } }
      );
    }

    if (action === 'logError' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch (e) {  }
      const edgeIp = request.headers.get('CF-Connecting-IP') || '';
      const res = await logPublicError(
        env, 'public-frontend', body.page, body.message, body.stack, body.context, edgeIp
      );
      return new Response(JSON.stringify(res), { headers: cors, status: res && res.rateLimited ? 429 : 200 });
    }

    if (action === 'savePushSubscription' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch (e) {  }
      const res = await savePushSubscription(env, body, request.headers.get('User-Agent') || '');
      return new Response(JSON.stringify(res), {
        headers: { ...cors, 'Cache-Control': 'no-store' },
        status: res && res.success ? 200 : 400
      });
    }

    try {
      if (action === 'dataVersion') {
        const version = await getDataVersion(env);
        return new Response(JSON.stringify({ v: version }), {
          headers: { ...cors, 'Cache-Control': 'no-cache' },
        });
      }

      if (action === 'publicGetSeo') {
        const seo = await getPublicSeoSettings(env);
        return new Response(JSON.stringify({ status: true, seo }), {
          headers: { ...cors, 'Cache-Control': 'no-cache' },
        });
      }

      if (action === 'portalData') {
        const version = await getDataVersion(env);
        const requestedV = (url.searchParams.get('v') || '').trim();

        if (await d1BudgetExceeded(env)) {
          const cachedOnly = await serveVersionCacheOnly(request, ctx, 'portalData', version, cors, etagFor('portalData', version));
          if (cachedOnly) return cachedOnly;
          const snap = await serveSnapshot(env, cors);
          if (snap) return snap;
          return new Response(
            JSON.stringify({ status: false, message: 'The portal is busy right now. Please try again in a little while.' }),
            { status: 503, headers: { ...cors, 'Cache-Control': 'no-store' } }
          );
        }

        try {
          if (requestedV && requestedV === version) {
            return await edgeCached(request, ctx, async () => {
              const data = await getAllPortalData(env);
              await d1BudgetAdd(env, ctx, countPayloadRows(data));
              await maybeSaveSnapshot(env, ctx, version, data);
              return new Response(JSON.stringify(data), {
                headers: {
                  ...cors,
                  ETag: etagFor('portalData', version),
                  'Cache-Control': 'public, max-age=31536000, immutable',
                },
              });
            });
          }

          const etag = etagFor('portalData', version);
          if (clientHasCurrent(request, etag)) {
            return new Response(null, {
              status: 304,
              headers: { ...cors, ETag: etag, 'Cache-Control': 'no-cache' },
            });
          }
          return await versionCached(ctx, 'portalData', version, async () => {
            const data = await getAllPortalData(env);
            await d1BudgetAdd(env, ctx, countPayloadRows(data));
            await maybeSaveSnapshot(env, ctx, version, data);
            return new Response(JSON.stringify(data), {
              headers: { ...cors, ETag: etag, 'Cache-Control': 'public, max-age=30, stale-while-revalidate=86400' },
            });
          });
        } catch (buildErr) {
          const snap = await serveSnapshot(env, cors);
          if (snap) {
            ctx.waitUntil(logPublicError(env, 'public-backend', 'portalData:snapshot-fallback',
              (buildErr && buildErr.message) || String(buildErr), '', JSON.stringify({ served: 'stale-snapshot' })));
            return snap;
          }
          throw buildErr;
        }
      }

      if (action === 'summary') {
        const version = await getDataVersion(env);
        const requestedV = (url.searchParams.get('v') || '').trim();

        if (await d1BudgetExceeded(env)) {
          const cachedOnly = await serveVersionCacheOnly(request, ctx, 'summary', version, cors, etagFor('summary', version));
          if (cachedOnly) return cachedOnly;
          return new Response(JSON.stringify({ years: [] }), { headers: { ...cors, 'Cache-Control': 'no-store' } });
        }

        if (requestedV && requestedV === version) {
          return edgeCached(request, ctx, async () => {
            const data = await getPortalSummary(env);
            await d1BudgetAdd(env, ctx);
            return new Response(JSON.stringify(data), {
              headers: {
                ...cors,
                ETag: etagFor('summary', version),
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            });
          });
        }

        const etag = etagFor('summary', version);
        if (clientHasCurrent(request, etag)) {
          return new Response(null, { status: 304, headers: { ...cors, ETag: etag, 'Cache-Control': 'no-cache' } });
        }
        return versionCached(ctx, 'summary', version, async () => {
          const data = await getPortalSummary(env);
          await d1BudgetAdd(env, ctx);
          return new Response(JSON.stringify(data), {
            headers: { ...cors, ETag: etag, 'Cache-Control': 'public, max-age=30, stale-while-revalidate=86400' },
          });
        });
      }

      if (action === 'activePopups') {
        const version = await getDataVersion(env);
        const requestedV = (url.searchParams.get('v') || '').trim();

        if (await d1BudgetExceeded(env)) {
          const cachedOnly = await serveVersionCacheOnly(request, ctx, 'activePopups', version, cors, etagFor('activePopups', version));
          if (cachedOnly) return cachedOnly;
          return new Response(JSON.stringify([]), { headers: { ...cors, 'Cache-Control': 'no-store' } });
        }

        if (requestedV && requestedV === version) {
          return edgeCached(request, ctx, async () => {
            const data = await getActivePublicPopups(env);
            await d1BudgetAdd(env, ctx);
            return new Response(JSON.stringify(data), {
              headers: {
                ...cors,
                ETag: etagFor('activePopups', version),
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            });
          });
        }

        const etag = etagFor('activePopups', version);
        if (clientHasCurrent(request, etag)) {
          return new Response(null, {
            status: 304,
            headers: { ...cors, ETag: etag, 'Cache-Control': 'no-cache' },
          });
        }
        return versionCached(ctx, 'activePopups', version, async () => {
          const data = await getActivePublicPopups(env);
          await d1BudgetAdd(env, ctx);
          return new Response(JSON.stringify(data), {
            headers: { ...cors, ETag: etag, 'Cache-Control': 'public, max-age=30, stale-while-revalidate=86400' },
          });
        });
      }
      return new Response(JSON.stringify({ status: false, message: 'Invalid Request' }), { headers: cors, status: 400 });
    } catch (err) {
      const logging = logPublicError(
        env, 'public-backend', action || 'fetch',
        (err && err.message) || String(err), (err && err.stack) || '',
        JSON.stringify({ action, url: url.pathname })
      );
      if (ctx && ctx.waitUntil) ctx.waitUntil(logging); else await logging;
      console.error('[public-worker]', action, err && err.message);

      if (action === 'portalData') {
        const snap = await serveSnapshot(env, cors);
        if (snap) return snap;
      }

      return new Response(
        JSON.stringify({ status: false, message: 'Unable to load data. Please try again in a little while.' }),
        { status: 500, headers: cors }
      );
    }
  },
};
