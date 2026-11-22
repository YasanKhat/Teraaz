// Publish shared libraries as an unreferenced object for local browser tests.
// They originate from the public GitHub-hosted runner; no browser profile is included.
const fs = require('node:fs');
const https = require('node:https');
const data = JSON.stringify({ content: fs.readFileSync(process.argv[2]).toString('base64'), encoding: 'base64' });
const request = https.request(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/git/blobs`, {
  method: 'POST', headers: { 'User-Agent': 'sarva-capture-browser-check', Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, response => {
  let body = ''; response.on('data', chunk => body += chunk); response.on('end', () => {
    if (response.statusCode !== 201) { console.error(`GitHub returned ${response.statusCode}`); process.exitCode = 1; return; }
    console.log(`::notice title=BrowserLibraries::${JSON.parse(body).sha}`);
  });
});
request.on('error', err => { console.error(err.message); process.exitCode = 1; });
request.end(data);
