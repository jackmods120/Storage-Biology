// Admin check: the app sends its Firebase login token. We ask Firebase who it belongs to
// and only accept the admin e-mail(s) (verified).
// Returns {email} on success or {reason} on failure (the reason is shown in the app to help debugging).
async function verifyAdmin(req) {
  const h = String(req.headers['authorization'] || '');
  const tok = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  const key = process.env.FIREBASE_API_KEY;
  const admins = String(process.env.ADMIN_EMAIL || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!tok) return { reason: 'NO_TOKEN' };
  if (!key) return { reason: 'ENV_FIREBASE_API_KEY_MISSING' };
  if (!admins.length) return { reason: 'ENV_ADMIN_EMAIL_MISSING' };
  try {
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: tok }),
    });
    if (!r.ok) return { reason: 'FIREBASE_LOOKUP_' + r.status };
    const j = await r.json();
    const u = j.users && j.users[0];
    if (!u || !u.email) return { reason: 'NO_USER_EMAIL' };
    if (u.emailVerified !== true) return { reason: 'EMAIL_NOT_VERIFIED ' + u.email };
    if (!admins.includes(String(u.email).toLowerCase())) return { reason: 'NOT_ADMIN ' + u.email + ' vs ' + admins[0] };
    return { email: u.email };
  } catch (e) { return { reason: 'AUTH_ERR ' + e.message }; }
}
module.exports = { verifyAdmin };
