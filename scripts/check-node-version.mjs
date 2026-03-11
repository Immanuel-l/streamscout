import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const nvmrcPath = resolve(process.cwd(), '.nvmrc')

let expectedVersionRaw
try {
  expectedVersionRaw = readFileSync(nvmrcPath, 'utf8').trim()
} catch {
  console.error('Node-Versionscheck fehlgeschlagen: .nvmrc konnte nicht gelesen werden.')
  process.exit(1)
}

const expectedMajor = Number(expectedVersionRaw.replace(/^v/i, '').split('.')[0])
if (!Number.isInteger(expectedMajor)) {
  console.error(`Node-Versionscheck fehlgeschlagen: Ungueltiger .nvmrc-Inhalt "${expectedVersionRaw}".`)
  process.exit(1)
}

const actualVersion = process.versions.node
const actualMajor = Number(actualVersion.split('.')[0])

if (actualMajor !== expectedMajor) {
  console.error(
    `Falsche Node-Version: erwartet v${expectedMajor}.x laut .nvmrc, aktiv ist v${actualVersion}. Bitte Version wechseln und erneut pruefen.`
  )
  process.exit(1)
}

console.log(`Node-Version ok: v${actualVersion} (erwartet v${expectedMajor}.x).`)
