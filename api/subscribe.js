// TFTClimb – Anmeldung zum Freebie „Climb-Plan“ (Exit-Popup) → Brevo mit Double-Opt-In.
// Läuft als Vercel-Funktion unter /api/subscribe:
//   POST {firstName, email, website}   → Brevo schickt die Bestätigungs-Mail; nach dem Klick landet die Person auf /climb-plan/danke
// Einstellungen nur als Umgebungsvariablen in Vercel (nie im Code oder im Chat):
//   BREVO_API_KEY           API-Schlüssel (Brevo → SMTP & API → API-Schlüssel)
//   BREVO_LIST_ID           Nummer der Liste, in die bestätigte Kontakte kommen
//   BREVO_DOI_TEMPLATE_ID   Nummer der Bestätigungs-Vorlage (Typ „Double Opt-in“)
// Gespeichert wird bei Brevo nur Vorname und E-Mail. website ist ein unsichtbares Lockfeld gegen Bots (gefüllt = Bot, still ignorieren).
const SITE = 'https://www.tftclimb.com';
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error: 'Nur POST'});
  let b = req.body || {}; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  if (b.website) return res.status(200).json({ok: true});   // Bot
  const email = String(b.email || '').trim().toLowerCase(), first = String(b.firstName || '').trim().slice(0, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return res.status(400).json({error: 'Bitte gib eine gültige E-Mail-Adresse ein.'});
  if (!first) return res.status(400).json({error: 'Bitte gib deinen Vornamen ein.'});
  const key = process.env.BREVO_API_KEY, list = +process.env.BREVO_LIST_ID, tpl = +process.env.BREVO_DOI_TEMPLATE_ID;
  if (!key || !list || !tpl) return res.status(503).json({error: 'Die Anmeldung ist gerade noch nicht freigeschaltet.'});
  try {
    const r = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {method: 'POST',
      headers: {'api-key': key, 'Content-Type': 'application/json', accept: 'application/json'},
      body: JSON.stringify({email, attributes: {FIRSTNAME: first}, includeListIds: [list], templateId: tpl, redirectionUrl: SITE + '/climb-plan/danke'})});
    if (r.ok) return res.status(200).json({ok: true});
    const j = await r.json().catch(() => ({}));
    // schon bestätigt → trotzdem freundlich bestätigen (keine Auskunft, ob eine Adresse bekannt ist)
    if (r.status === 400 && /exist/i.test(j.message || '')) return res.status(200).json({ok: true});
    return res.status(502).json({error: 'Das hat gerade nicht geklappt – versuch es bitte gleich noch mal.'});
  } catch (e) { return res.status(502).json({error: 'Keine Verbindung – versuch es bitte gleich noch mal.'}); }
};
