// Vercel Blob helper. BLOB_READ_WRITE_TOKEN is added automatically by Vercel
// when you create a Blob store (Storage tab) and connect it to this project.
function info() {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error('Missing BLOB_READ_WRITE_TOKEN - Vercel > Storage > create Blob store and connect it');
  const storeId = String(t).split('_')[3] || '';
  if (!storeId) throw new Error('Bad BLOB_READ_WRITE_TOKEN');
  return { token: t, base: `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com` };
}
module.exports = { info };
