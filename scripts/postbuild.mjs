import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')
const distDir = resolve(rootDir, 'dist')
const indexPath = resolve(distDir, 'index.html')
const fallbackPath = resolve(distDir, '404.html')
const nojekyllPath = resolve(distDir, '.nojekyll')
const pathSegmentsToKeep = 1

await mkdir(distDir, { recursive: true })

const indexHtml = await readFile(indexPath, 'utf8')
const fallbackHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="noindex" />
    <title>Redirecting…</title>
    <script>
      (function () {
        var pathSegmentsToKeep = ${pathSegmentsToKeep};
        var location = window.location;
        var preservedPath = location.pathname
          .split('/')
          .slice(1 + pathSegmentsToKeep)
          .join('/');
        var query = location.search ? '&' + location.search.slice(1).replace(/&/g, '~and~') : '';
        var hash = location.hash || '';
        var redirectTarget =
          location.protocol +
          '//' +
          location.hostname +
          (location.port ? ':' + location.port : '') +
          location.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') +
          '/?/' +
          preservedPath.replace(/&/g, '~and~') +
          query +
          hash;

        location.replace(redirectTarget);
      })();
    </script>
  </head>
  <body></body>
</html>
`

await writeFile(fallbackPath, fallbackHtml)
await writeFile(nojekyllPath, '')

if (!indexHtml.includes('window.location.search')) {
  throw new Error('Expected redirect restoration script was not found in dist/index.html')
}
