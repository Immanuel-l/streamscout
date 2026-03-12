import fs from 'node:fs'
import path from 'node:path'

const hooksDir = path.resolve('.husky', '_')
const hookNames = [
  'applypatch-msg',
  'commit-msg',
  'post-applypatch',
  'post-checkout',
  'post-commit',
  'post-merge',
  'post-rewrite',
  'pre-applypatch',
  'pre-auto-gc',
  'pre-commit',
  'pre-merge-commit',
  'pre-push',
  'pre-rebase',
  'prepare-commit-msg',
]

function resolveNodeShebang() {
  const candidates = [
    'C:/PROGRA~1/nodejs/node.exe',
    'C:/Program Files/nodejs/node.exe',
    '/usr/bin/node',
  ]

  const found = candidates.find((candidate) => fs.existsSync(candidate))
  return `#!${found || '/usr/bin/node'}`
}

const shebang = resolveNodeShebang()

const wrapperContent = `${shebang}
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const hookName = path.basename(__filename)
const projectHookPath = path.resolve(__dirname, '..', hookName)

if (!fs.existsSync(projectHookPath)) {
  process.exit(0)
}

const command = fs.readFileSync(projectHookPath, 'utf8').replace(/\\r/g, '').trim()
if (!command) {
  process.exit(0)
}

const args = process.argv.slice(2)
const env = {
  ...process.env,
  PATH: [path.resolve('node_modules', '.bin'), process.env.PATH || '']
    .filter(Boolean)
    .join(path.delimiter),
}

function resolveNpmCliPath() {
  const candidates = [
    process.env.npm_execpath,
    path.resolve(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js',
    'C:/PROGRA~1/nodejs/node_modules/npm/bin/npm-cli.js',
  ].filter(Boolean)

  return candidates.find((candidate) => fs.existsSync(candidate))
}

let result
const npmMatch = command.match(/^npm\\s+run\\s+([\\w:-]+)$/u)

if (npmMatch) {
  const npmCliPath = resolveNpmCliPath()

  if (npmCliPath) {
    result = spawnSync(process.execPath, [npmCliPath, 'run', npmMatch[1]], {
      stdio: 'inherit',
      env,
    })
  }
}

if (!result) {
  const quote = (value) => {
    if (!value || !/[\\s"]/u.test(value)) return value
    return '"' + value.replace(/"/g, '\\"') + '"'
  }

  const shouldForwardArgs = !npmMatch && args.length > 0
  const commandWithArgs = shouldForwardArgs
    ? command + ' ' + args.map(quote).join(' ')
    : command

  result = spawnSync(commandWithArgs, {
    stdio: 'inherit',
    shell: true,
    env,
  })
}

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  console.error(result.error.message)
}
process.exit(1)
`

if (!fs.existsSync(hooksDir)) {
  process.exit(0)
}

let changedFiles = 0
for (const hookName of hookNames) {
  const hookPath = path.join(hooksDir, hookName)
  const previous = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, 'utf8') : ''

  if (previous !== wrapperContent) {
    fs.writeFileSync(hookPath, wrapperContent, 'utf8')
    changedFiles += 1
  }
}

if (changedFiles > 0) {
  console.log(`Husky-Hook-Fix angewendet (${changedFiles} Dateien).`)
}


