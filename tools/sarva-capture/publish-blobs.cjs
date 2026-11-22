// Publish only anonymous, public capture files as unreferenced Git objects. No refs or commits are changed.
const fs = require('node:fs/promises');
const path = require('node:path');
const https = require('node:https');
const { gzipSync } = require('node:zlib');
const root = 'sarva-capture-output';
async function publish(file) {
  const bytes = await fs.readFile(file);
  const payload = JSON.stringify({ content: bytes.toString('base64'), encoding: 'base64' });
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/git/blobs`, {
      method: 'POST', headers: { 'User-Agent': 'sarva-public-capture', Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => { let s = ''; res.on('data', x => s += x); res.on('end', () => { if (res.statusCode !== 201) return reject(new Error(`GitHub blob API ${res.statusCode}: ${s.slice(0,300)}`)); resolve(JSON.parse(s).sha); }); });
    req.on('error', reject); req.end(payload);
  });
}
async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
  const files = [];
  for (const name of await fs.readdir(root)) if (name.endsWith('.html') || name.endsWith('.png')) files.push({ file: name });
  for (const [hash, info] of Object.entries(manifest.resources)) {
    if (/javascript|text\/css/i.test(info.type) && info.size <= 2 * 1024 * 1024)
      files.push({ file: `resources/${hash}`, url: info.url, type: info.type });
  }
  for (const item of files) item.gitBlob = await publish(path.join(root, item.file));
  const compressed = gzipSync(Buffer.from(JSON.stringify({ files, manifest }))).toString('base64');
  for (let i = 0; i < compressed.length; i += 5000) console.log(`::notice title=CaptureIndex::${compressed.slice(i,i+5000)}`);
  console.log(`::notice title=CaptureIndexCount::${Math.ceil(compressed.length / 5000)}`);
}
main().catch(err => { console.error(err); process.exitCode = 1; });
