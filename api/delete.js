// POST /api/delete  (header Authorization: Bearer <Firebase idToken>)  {key}
const { info } = require('../lib/blob');
const { cors, body } = require('../lib/common');
const { verifyAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const who = await verifyAdmin(req);
  if (!who.email) return res.status(400).json({ error: who.reason });
  try {
    const { key } = await body(req);
    if (!key || !/^(video|audio|image|file)\//.test(key)) return res.status(400).json({ error: 'Bad key' });
    const c = info();
    const { del } = await import('@vercel/blob');
    await del(c.base + '/' + key, { token: c.token });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
