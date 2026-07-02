const { existsSync, readdirSync } = require('node:fs')
const { join, extname } = require('node:path')
const { spawnSync } = require('node:child_process')

const srcDir = join(__dirname, '..', 'src')
const distEntry = join(__dirname, '..', 'dist', 'index.js')

function hasTypeScriptFiles(dir) {
  if (!existsSync(dir)) return false

  return readdirSync(dir, { withFileTypes: true }).some((entry) => {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      return hasTypeScriptFiles(fullPath)
    }

    return ['.ts', '.tsx'].includes(extname(entry.name))
  })
}

if (!hasTypeScriptFiles(srcDir)) {
  if (!existsSync(distEntry)) {
    console.error('No TypeScript source files found and dist/index.js is missing.')
    process.exit(1)
  }

  console.log('No TypeScript source files found; using existing dist build.')
  process.exit(0)
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsc', '-p', 'tsconfig.json'],
  { cwd: join(__dirname, '..'), stdio: 'inherit' }
)

process.exit(result.status || 0)
