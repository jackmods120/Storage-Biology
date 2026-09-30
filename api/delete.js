// POST /api/delete  (header Authorization: Bearer <Firebase idToken>)  {key}
const { signedUrl } = require('../lib/s3');
const { cors, body } = require('../lib/common');
const { verifyAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Not admin' });
  try {
    const { key } = await body(req);
    if (!key || !/^(video|audio|image|file)\//.test(key)) return res.status(400).json({ error: 'Bad key' });
    const r = await fetch(signedUrl('DELETE', key, {}, 60), { method: 'DELETE' });
    return res.status(r.ok || r.status === 404 ? 200 : 502).json({ ok: r.ok });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
