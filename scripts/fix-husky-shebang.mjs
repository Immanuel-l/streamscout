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

const wrapperContent = `#!/usr/bin/node
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
const quote = (value) => {
  if (!value || !/[\\s"]/u.test(value)) return value
  return '"' + value.replace(/"/g, '\\"') + '"'
}

const commandWithArgs = args.length > 0
  ? command + ' ' + args.map(quote).join(' ')
  : command

const result = spawnSync(commandWithArgs, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PATH: [path.resolve('node_modules', '.bin'), process.env.PATH || '']
      .filter(Boolean)
      .join(path.delimiter),
  },
})

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
