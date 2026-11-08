import { createServer } from 'vite'
const server = await createServer({ configFile: '/home/user/Teraaz/sarva/vite.config.ts', root: '/home/user/Teraaz/sarva', server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
const m = await server.ssrLoadModule('/src/renderer/src/components/home/home.module.css')
console.log('کلیدها:', Object.keys(m).slice(0,8))
console.log('styles.hero =', JSON.stringify(m.hero ?? m.default?.hero))
await server.close()
