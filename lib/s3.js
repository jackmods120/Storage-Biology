// Minimal S3/R2 helper: SigV4 presigned URLs + ListObjectsV2. No dependencies.
const crypto = require('crypto');

const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const sha = d => crypto.createHash('sha256').update(d).digest('hex');

function presign({ method, host, path, query = {}, accessKey, secretKey,
                   region = 'auto', service = 's3', expires = 3600, now = new Date() }) {
  const amz = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amz.slice(0, 8);
  const scope = `${date}/${region}/${service}/aws4_request`;
  const q = Object.assign({}, query, {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKey}/${scope}`,
    'X-Amz-Date': amz,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  });
  const canonQuery = Object.keys(q).sort().map(k => `${enc(k)}=${enc(q[k])}`).join('&');
  const canonPath = path.split('/').map(enc).join('/');
  const canonical = [method, canonPath, canonQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['AWS4-HMAC-SHA256', amz, scope, sha(canonical)].join('\n');
  let k = hmac('AWS4' + secretKey, date);
  k = hmac(k, region); k = hmac(k, service); k = hmac(k, 'aws4_request');
  const sig = crypto.createHmac('sha256', k).update(toSign).digest('hex');
  return `https://${host}${canonPath}?${canonQuery}&X-Amz-Signature=${sig}`;
}

function cfg() {
  const e = process.env;
  const need = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'];
  const miss = need.filter(n => !e[n]);
  if (miss.length) throw new Error('Missing env: ' + miss.join(', '));
  return {
    host: `${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: e.R2_BUCKET,
    accessKey: e.R2_ACCESS_KEY_ID,
    secretKey: e.R2_SECRET_ACCESS_KEY,
    publicUrl: e.R2_PUBLIC_URL.replace(/\/+$/, ''),
  };
}

function signedUrl(method, key, query, expires) {
  const c = cfg();
  return presign({ method, host: c.host, path: `/${c.bucket}${key ? '/' + key : ''}`,
                   query, accessKey: c.accessKey, secretKey: c.secretKey, expires });
}

const unxml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function list(prefix) {
  const out = [];
  let token = '';
  for (let page = 0; page < 10; page++) {
    const query = { 'list-type': '2', prefix, 'max-keys': '1000' };
    if (token) query['continuation-token'] = token;
    const r = await fetch(signedUrl('GET', '', query, 60));
    if (!r.ok) throw new Error('R2 list failed: ' + r.status);
    const xml = await r.text();
    const re = /<Contents>([\s\S]*?)<\/Contents>/g;
    let m;
    while ((m = re.exec(xml))) {
      const g = t => { const x = new RegExp(`<${t}>([\\s\\S]*?)</${t}>`).exec(m[1]); return x ? unxml(x[1]) : ''; };
      out.push({ key: g('Key'), size: parseInt(g('Size'), 10) || 0, time: Date.parse(g('LastModified')) || 0 });
    }
    const nt = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml);
    if (!nt) break;
    token = unxml(nt[1]);
  }
  return out;
}

module.exports = { presign, cfg, signedUrl, list, enc };
