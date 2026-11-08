import { createServer } from 'vite'
const server = await createServer({ configFile: '/home/user/Teraaz/sarva/vite.config.ts', root: '/home/user/Teraaz/sarva', server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
const m = await server.ssrLoadModule('/src/renderer/src/lib/vazn-yab/prosody.ts')
const { bareHemi, scanFeet, splitFeet, patternOf, marksText } = m
for (const feet of ["فعولن فعولن فعولن فعل", "مفاعلن فعلاتن مفاعلن فعلن", "فاعلاتن فاعلاتن فاعلن"]) {
  console.log("=== ", feet)
  console.log(" split:", JSON.stringify(splitFeet(feet)))
  console.log(" pattern:", patternOf(feet))
  const b = bareHemi(feet)
  console.log(" bare:", b.map(x => (x.long?'-':'U')+'/'+x.foot).join(' '))
  const s = scanFeet(feet)
  console.log(" scan:", JSON.stringify(s?.map(f=>f.foot+':'+f.marks)))
}
await server.close()
