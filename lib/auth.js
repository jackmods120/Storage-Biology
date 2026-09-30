// Admin check: the app sends its Firebase login token. We ask Firebase who it belongs to
// and only accept the admin e-mail(s) (verified). No password / key is ever stored in the app.
async function verifyAdmin(req) {
  const h = String(req.headers['authorization'] || '');
  const tok = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  const key = process.env.FIREBASE_API_KEY;
  const admins = String(process.env.ADMIN_EMAIL || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!tok || !key || !admins.length) return null;
  try {
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: tok }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const u = j.users && j.users[0];
    if (!u || !u.email || u.emailVerified !== true) return null;
    return admins.includes(String(u.email).toLowerCase()) ? u.email : null;
  } catch (e) { return null; }
}
module.exports = { verifyAdmin };
