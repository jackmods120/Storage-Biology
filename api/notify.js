// POST /api/notify  (header Authorization: Bearer <Firebase idToken>)  {title, url}
// Optional: posts a message to your Telegram channel. The bot token lives ONLY here (Vercel env).
const { cors, body } = require('../lib/common');
const { verifyAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const who = await verifyAdmin(req);
  if (!who.email) return res.status(400).json({ error: who.reason });
  const T = process.env.TELEGRAM_BOT_TOKEN, C = process.env.TELEGRAM_CHANNEL_ID;
  if (!T || !C) return res.status(200).json({ ok: false, skipped: true });
  try {
    const { title, url } = await body(req);
    const r = await fetch(`https://api.telegram.org/bot${T}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: C, text: `🆕 ${title || ''}\n${url || ''}`.trim() }),
    });
    return res.status(200).json({ ok: r.ok });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
