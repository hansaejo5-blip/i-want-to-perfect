import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')
const distDir = resolve(rootDir, 'dist')
const indexPath = resolve(distDir, 'index.html')
const fallbackPath = resolve(distDir, '404.html')
const nojekyllPath = resolve(distDir, '.nojekyll')

await mkdir(distDir, { recursive: true })
await copyFile(indexPath, fallbackPath)

const fallbackHtml = await readFile(fallbackPath, 'utf8')
if (!fallbackHtml.includes('<meta name="robots" content="noindex" />')) {
  await writeFile(
    fallbackPath,
    fallbackHtml.replace(
      '<meta charset="UTF-8" />',
      '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />',
    ),
  )
}

await writeFile(nojekyllPath, '')
