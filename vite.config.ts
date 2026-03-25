import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GITHUB_PAGES_BASE = '/i-want-to-perfect/'

function getBasePath() {
  const isGithubPagesBuild =
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITHUB_PAGES === 'true'

  return isGithubPagesBuild ? GITHUB_PAGES_BASE : '/'
}

export default defineConfig({
  base: getBasePath(),
  plugins: [react()],
})
