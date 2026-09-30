// POST /api/sign  (header Authorization: Bearer <Firebase idToken>)  {name, type, size}
// -> {uploadUrl, token, key, url, folder}   The app then PUTs the file straight to Vercel Blob.
const { info } = require('../lib/blob');
const { cors, folderOf, body } = require('../lib/common');
const { verifyAdmin } = require('../lib/auth');

const MAX = 500 * 1024 * 1024; // 500 MB per file

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const who = await verifyAdmin(req);
  if (!who.email) return res.status(400).json({ error: who.reason });
  try {
    const b = await body(req);
    const name = String(b.name || 'file').replace(/[^A-Za-z0-9._-]/g, '_').slice(-100);
    const size = Number(b.size || 0);
    if (size > MAX) return res.status(413).json({ error: 'File is bigger than 500MB' });
    const folder = folderOf(b.type, name);
    const key = `${folder}/${Date.now()}-${name}`;
    const c = info();
    const { generateClientTokenFromReadWriteToken } = await import('@vercel/blob/client');
    const token = await generateClientTokenFromReadWriteToken({
      token: c.token,
      pathname: key,
      maximumSizeInBytes: MAX,
      addRandomSuffix: false,
      allowOverwrite: false,
      validUntil: Date.now() + 60 * 60 * 1000,
    });
    return res.status(200).json({
      ok: true, key, folder, token,
      uploadUrl: 'https://vercel.com/api/blob/?pathname=' + encodeURIComponent(key),
      url: c.base + '/' + key,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
