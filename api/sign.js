// POST /api/sign  (header Authorization: Bearer <Firebase idToken>)  {name, type, size}
// -> {uploadUrl, key, url}   The client then PUTs the file straight to R2.
const { signedUrl, cfg, enc } = require('../lib/s3');
const { cors, folderOf, body } = require('../lib/common');
const { verifyAdmin } = require('../lib/auth');

const MAX = 5 * 1024 * 1024 * 1024 - 1; // single PUT limit on R2

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Not admin' });
  try {
    const b = await body(req);
    const name = String(b.name || 'file').replace(/[\/\\\u0000-\u001f"'<>?#%]/g, '_').slice(0, 120);
    const size = Number(b.size || 0);
    if (size > MAX) return res.status(413).json({ error: 'File is bigger than 5GB' });
    const folder = folderOf(b.type, name);
    const key = `${folder}/${Date.now()}-${name}`;
    const c = cfg();
    return res.status(200).json({
      ok: true, key, folder,
      uploadUrl: signedUrl('PUT', key, {}, 3600),
      url: c.publicUrl + '/' + key.split('/').map(enc).join('/'),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
