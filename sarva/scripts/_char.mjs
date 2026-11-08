import { createServer } from 'vite'
const server = await createServer({ configFile: '/home/user/Teraaz/sarva/vite.config.ts', root: '/home/user/Teraaz/sarva', server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
const m = await server.ssrLoadModule('/src/renderer/src/lib/vazn-yab/prosody.ts')
for (const feet of ["فعولن فعولن فعولن فعل", "فاعلاتن فاعلاتن فاعلن", "مفاعلن فعلاتن مفاعلن فعلن"]) {
  const ch = m.characterOf(feet)
  console.log(feet, '→', ch, JSON.stringify(m.CHARACTER[ch]), 'voicing:', JSON.stringify(m.voicingOf(feet, 1)))
}
await server.close()
