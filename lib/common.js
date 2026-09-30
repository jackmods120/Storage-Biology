function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function folderOf(mime, name) {
  const m = String(mime || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (m.startsWith('video/') || /\.(mp4|mkv|mov|webm|m4v|3gp)$/.test(n)) return 'video';
  if (m.startsWith('audio/') || /\.(mp3|m4a|aac|ogg|opus|wav|flac)$/.test(n)) return 'audio';
  if (m.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/.test(n)) return 'image';
  return 'file';
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

module.exports = { cors, folderOf, body };
