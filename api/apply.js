// TFTClimb – Coaching-Bewerbung aus dem Formular unter /apply per E-Mail an info@tftclimb.com schicken.
// Läuft als Vercel-Funktion unter /api/apply. Die Zugangsdaten des Postfachs kommen aus den Umgebungsvariablen
// SMTP_HOST, SMTP_USER und SMTP_PASS (Vercel → Settings → Environment Variables); versendet wird per SMTP mit SSL.
const tls = require('tls');

const TO = process.env.MAIL_TO || 'info@tftclimb.com';
// [Schlüssel, Bezeichnung in der Mail, Höchstlänge, Pflichtfeld]
const FIELDS = [
  ['name', 'Name / Riot-ID', 80, true],
  ['discord', 'Discord', 60, true],
  ['email', 'E-Mail', 120, false],
  ['rank', 'Aktueller Rang', 40, false],
  ['goal', 'Rang-Ziel', 40, false],
  ['pkg', 'Interessiert an', 80, false],
  ['lang', 'Sprache', 30, false],
  ['time', 'Verfügbare Zeiten', 200, false],
  ['msg', 'Was möchtest du verbessern?', 2000, false],
];
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;

// Bremse gegen Massenanfragen: höchstens 3 Bewerbungen pro IP in 10 Minuten (gilt je laufender Instanz)
const HITS = new Map();
function limited(ip){
  const now = Date.now(), list = (HITS.get(ip) || []).filter(t => now - t < 600000);
  list.push(now);
  if (HITS.size > 500) HITS.clear();
  HITS.set(ip, list);
  return list.length > 3;
}

// Kopfzeilen mit Umlauten als Encoded-Word (RFC 2047), in Stücken von höchstens 45 Byte
function hdr(s){
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const parts = [];
  let cur = '';
  for (const ch of s) { if (Buffer.byteLength(cur + ch) > 45) { parts.push(cur); cur = ''; } cur += ch; }
  if (cur) parts.push(cur);
  return parts.map(p => `=?UTF-8?B?${Buffer.from(p).toString('base64')}?=`).join('\r\n ');
}

// Minimaler SMTP-Versand über SSL: Begrüßung → EHLO → AUTH PLAIN → MAIL FROM → RCPT TO → DATA → QUIT
function smtpSend({host, port, user, pass, from, to, data}){
  return new Promise((resolve, reject) => {
    const steps = [
      [220, 'EHLO tftclimb.com'],
      [250, 'AUTH PLAIN ' + Buffer.from('\0' + user + '\0' + pass).toString('base64')],
      [235, `MAIL FROM:<${from}>`],
      [250, `RCPT TO:<${to}>`],
      [250, 'DATA'],
      [354, data.replace(/\r\n\./g, '\r\n..') + '\r\n.'],
      [250, 'QUIT'],
    ];
    const s = tls.connect({host, port, servername: host});
    let buf = '', i = 0, done = false;
    const fail = e => { if (!done) { done = true; s.destroy(); reject(e); } };
    s.setEncoding('utf8');
    s.setTimeout(8000, () => fail(new Error('SMTP: Zeitüberschreitung')));
    s.on('error', fail);
    s.on('close', () => fail(new Error('SMTP: Verbindung vorzeitig beendet')));
    s.on('data', d => {
      buf += d;
      const m = buf.match(/(?:^|\r\n)(\d{3}) [^\r\n]*\r\n$/);   // mehrzeilige Antwort: auf die letzte Zeile warten
      if (!m || done) return;
      const reply = buf.trim();
      buf = '';
      if (+m[1] !== steps[i][0]) return fail(new Error(`SMTP: ${reply.split('\r\n').pop()} (Schritt ${i + 1})`));
      s.write(steps[i][1] + '\r\n');
      if (++i === steps.length) { done = true; resolve(); s.end(); }   // Mail angenommen, QUIT ist unterwegs
    });
  });
}

module.exports = async (req, res) => {
  const send = (code, obj) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(obj));
  };
  if (req.method !== 'POST') return send(405, {ok: false, error: 'method'});
  // Nur Anfragen von der eigenen Seite annehmen
  const origin = req.headers.origin, self = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin) { try { if (new URL(origin).host !== self) return send(403, {ok: false, error: 'origin'}); } catch (e) { return send(403, {ok: false, error: 'origin'}); } }
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return send(503, {ok: false, error: 'config'});

  let b;
  try { b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch (e) { b = null; }
  if (!b || typeof b !== 'object') return send(400, {ok: false, error: 'invalid'});
  if (b.website) return send(200, {ok: true});   // verstecktes Feld: füllen nur Bots aus – stillschweigend verwerfen

  const v = {};
  for (const [k, , max, required] of FIELDS) {
    const raw = String(b[k] == null ? '' : b[k]);
    const s = k === 'msg' ? raw.replace(/\r\n?/g, '\n').trim() : raw.replace(/\s+/g, ' ').trim();
    if (s.length > max) return send(400, {ok: false, error: 'long', field: k});
    if (required && !s) return send(400, {ok: false, error: 'missing', field: k});
    v[k] = s;
  }
  if (v.email && !EMAIL_RE.test(v.email)) return send(400, {ok: false, error: 'email', field: 'email'});
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unbekannt';
  if (limited(ip)) return send(429, {ok: false, error: 'rate'});

  const from = process.env.MAIL_FROM || (user.includes('@') ? user : TO);
  const when = new Date().toLocaleString('de-DE', {timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short'});
  const body = [
    'Neue Coaching-Bewerbung über tftclimb.com', '',
    ...FIELDS.filter(([k]) => k !== 'msg').map(([k, label]) => `${label}: ${v[k] || '–'}`), '',
    'Was möchtest du verbessern?', (v.msg || '–').replace(/\n/g, '\r\n'), '',
    '—', `Gesendet am ${when} Uhr von der ${b.site === 'en' ? 'englischen' : 'deutschen'} Seite.`,
    v.email ? 'Mit „Antworten“ schreibst du direkt an die angegebene E-Mail-Adresse.' : 'Keine E-Mail angegeben – Kontakt über Discord.',
  ].join('\r\n');
  const subject = `Coaching-Bewerbung: ${v.name}` + (v.rank || v.goal ? ` (${v.rank || '?'} → ${v.goal || '?'})` : '');
  const headers = [
    `From: TFTClimb Bewerbung <${from}>`,
    `To: <${TO}>`,
    ...(v.email ? [`Reply-To: <${v.email}>`] : []),
    `Subject: ${hdr(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}@tftclimb.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  const data = headers.join('\r\n') + '\r\n\r\n' + Buffer.from(body).toString('base64').replace(/.{76}/g, '$&\r\n');

  try {
    await smtpSend({host, port: +process.env.SMTP_PORT || 465, user, pass, from, to: TO, data});
    send(200, {ok: true});
  } catch (e) {
    console.error('Bewerbung konnte nicht versendet werden:', e.message);
    send(502, {ok: false, error: 'send'});
  }
};
