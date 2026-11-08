#!/usr/bin/env node
/**
 * دارایی‌های سروا را روی دستگاه می‌گذارد.
 *
 * تصویرها (۱,۱۴۱ عکسِ واژه‌یاب، ۱۴۴ مگابایت عکسِ شعر، دارایی‌های بازی‌ها)
 * باینری و حجیم‌اند، پس در گیت نمی‌مانند — درست همان تصمیمی که برای
 * وابستگی‌های npm گرفته می‌شود. این اسکریپت آن‌ها را می‌گیرد و هم‌زمان یک
 * فهرست (vocab-manifest.json) می‌سازد که بازیِ واژه‌یاب از روی آن کار می‌کند.
 *
 * دو راه دارد:
 *
 *   ۱) یک کلونِ محلی از مخزن سروا:
 *        SARVA_SRC=/path/to/Sarva node scripts/fetch-assets.mjs
 *
 *   ۲) بارگیری از گیت‌هاب (نیاز به اینترنت):
 *        node scripts/fetch-assets.mjs
 *
 * خروجی در `public/` می‌نشیند و `npm run dev` همان را سرو می‌کند.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync, statSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { createWriteStream, createReadStream } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { createGunzip } from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
const REPO = 'matin031/Sarva'
const BRANCH = 'sarvav2'

const ASSET_DIRS = [
  'public/vocab-images',
  'public/audio',
  'public/games',
  'public/literary-timeline',
  'public/poempic'
]

const local = process.env.SARVA_SRC

async function main() {
  mkdirSync(PUBLIC, { recursive: true })

  let source = local && existsSync(local) ? local : null

  if (!source) {
    source = await download()
    if (!source) {
      console.error(
        '\nنتوانستم دارایی‌ها را بگیرم.\n' +
          'اگر کلونِ محلی از مخزن سروا داری، این‌طور صدا بزن:\n\n' +
          '  SARVA_SRC=/path/to/Sarva node scripts/fetch-assets.mjs\n'
      )
      process.exit(1)
    }
  }

  for (const dir of ASSET_DIRS) {
    copyDir(join(source, dir), join(PUBLIC, dir.replace(/^public\//, '')))
  }

  buildVocabManifest()
  console.log('\n✓ دارایی‌ها آماده‌اند. حالا `npm run dev` را اجرا کن.')
}

function copyDir(from, to) {
  if (!existsSync(from)) return
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from)) {
    const src = join(from, entry)
    const dest = join(to, entry)
    if (statSync(src).isDirectory()) copyDir(src, dest)
    else if (!existsSync(dest) || statSync(src).size !== statSync(dest).size) {
      copyFile(src, dest)
    }
  }
  console.log(`  ↳ ${to.replace(ROOT + '/', '')}`)
}

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  execFileSync('cp', [src, dest])
}

/** فهرستِ واژه‌ها از روی ساختارِ پوشه‌ی تصویرها. */
function buildVocabManifest() {
  const root = join(PUBLIC, 'vocab-images')
  if (!existsSync(root)) {
    console.log('  ↳ vocab-manifest.json (خالی — تصویری نیست)')
    writeFileSync(join(PUBLIC, 'vocab-manifest.json'), '[]')
    return
  }

  const entries = []
  for (const gradeDir of readdirSync(root)) {
    const gradePath = join(root, gradeDir)
    if (!statSync(gradePath).isDirectory()) continue
    const grade = gradeDir.replace(/^grade-/, '')

    for (const lessonDir of readdirSync(gradePath)) {
      const lessonPath = join(gradePath, lessonDir)
      if (!statSync(lessonPath).isDirectory()) continue
      const lesson = Number(lessonDir)
      if (!Number.isInteger(lesson)) continue

      for (const file of readdirSync(lessonPath)) {
        const word = file.replace(/\.(webp|png|jpg|jpeg|gif|avif)$/i, '')
        if (!word) continue
        entries.push({
          grade,
          lesson,
          word,
          path: `vocab-images/${gradeDir}/${lessonDir}/${encodeURIComponent(file)}`
        })
      }
    }
  }

  writeFileSync(join(PUBLIC, 'vocab-manifest.json'), JSON.stringify(entries))
  console.log(`  ↳ vocab-manifest.json (${entries.length} واژه)`)
}

async function download() {
  const target = join(tmpdir(), 'sarva-assets')
  if (existsSync(target)) rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })

  const url = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}`
  const archive = join(tmpdir(), 'sarva-assets.tar.gz')

  try {
    console.log('در حال بارگیری از گیت‌هاب…')
    const res = await fetch(url)
    if (!res.ok || !res.body) return null
    await pipeline(Readable.fromWeb(res.body), createWriteStream(archive))

    mkdirSync(target, { recursive: true })
    // `tar` روی هر لینوکس/macOS/WSL هست؛ `node:tar` در Node 22 هنوز builtin نیست.
    execFileSync('tar', ['-xzf', archive, '-C', target, '--strip-components=1'])
  } catch (error) {
    console.error('بارگیری ناموفق بود:', error?.message ?? error)
    return null
  }

  return target
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
