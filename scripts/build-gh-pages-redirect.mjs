import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const distDir = resolve(process.cwd(), 'dist')
const siteOrigin = 'https://i-want-to-perfect.vercel.app'
const repoBase = '/i-want-to-perfect'
const routePaths = ['play', 'guide', 'updates', 'support', 'privacy']

const redirectHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${siteOrigin}" />
    <meta name="robots" content="noindex" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting to Perfect Drop</title>
    <script>
      (function () {
        var siteOrigin = ${JSON.stringify(siteOrigin)};
        var repoBase = ${JSON.stringify(repoBase)};
        var pathname = window.location.pathname;
        var normalizedPath = pathname.indexOf(repoBase) === 0 ? pathname.slice(repoBase.length) || '/' : pathname;
        var target = siteOrigin + normalizedPath + window.location.search + window.location.hash;
        window.location.replace(target);
      })();
    </script>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
        background: #f6f2db;
        color: #1f2a1f;
      }
      a {
        color: inherit;
      }
    </style>
  </head>
  <body>
    <p>Redirecting to <a href="${siteOrigin}">Perfect Drop</a>...</p>
  </body>
</html>
`

await mkdir(distDir, { recursive: true })
await writeFile(resolve(distDir, 'index.html'), redirectHtml)
await writeFile(resolve(distDir, '404.html'), redirectHtml)
await writeFile(resolve(distDir, '.nojekyll'), '')

for (const routePath of routePaths) {
  const routeDir = resolve(distDir, routePath)
  await mkdir(routeDir, { recursive: true })
  await writeFile(resolve(routeDir, 'index.html'), redirectHtml)
}

await copyFile(resolve(process.cwd(), 'public', 'ads.txt'), resolve(distDir, 'ads.txt'))
