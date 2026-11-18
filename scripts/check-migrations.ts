#!/usr/bin/env bun
/**
 * Fail when src/server/schema.ts has changes that no committed migration covers.
 *
 * Why this exists: `drizzle-kit check` looks like it does this and does not. It
 * validates that the migration history is internally consistent - every snapshot
 * chains to the previous one - and says "Everything's fine" whether or not the
 * schema has drifted. Verified by adding a column to schema.ts and running it:
 * exit 0, no output changed. Only `generate` actually compares schema to history.
 *
 * So the check is: generate into a scratch name, and fail if that produced any
 * file. `generate` is deterministic for a pinned drizzle-kit version, which is
 * why the package is pinned exactly rather than with a caret.
 *
 * Runs from the repository root. Exits 0 when clean, 1 with instructions when
 * not.
 */
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DRIZZLE_DIR = 'drizzle'
const META_DIR = join(DRIZZLE_DIR, 'meta')
const JOURNAL = join(META_DIR, '_journal.json')
const SCRATCH_NAME = 'ci-drift-check'

function snapshotFiles(): Set<string> {
  return new Set(readdirSync(META_DIR).filter((name) => name.endsWith('_snapshot.json')))
}

const snapshotsBefore = snapshotFiles()
const journalBefore = readFileSync(JOURNAL, 'utf8')
const sqlishBefore = new Set(readdirSync(DRIZZLE_DIR).filter((name) => name.endsWith('.sql')))

const generated = Bun.spawnSync({
  cmd: ['bunx', 'drizzle-kit', 'generate', '--name', SCRATCH_NAME],
  stdout: 'pipe',
  stderr: 'pipe',
})

if (generated.exitCode !== 0) {
  // A broken schema is worth reporting as itself, not as "drift". `generate`
  // fails on an invalid schema definition, and swallowing that into a generic
  // drift message would send the author looking for a missing migration.
  console.error('drizzle-kit generate failed, so drift cannot be assessed:')
  console.error(generated.stderr.toString().trim() || generated.stdout.toString().trim())
  process.exit(1)
}

/** Undo everything the probe wrote. Called on both paths. */
function cleanup(): void {
  writeFileSync(JOURNAL, journalBefore)
  for (const name of snapshotFiles()) {
    if (!snapshotsBefore.has(name)) rmSync(join(META_DIR, name), { force: true })
  }
  for (const name of readdirSync(DRIZZLE_DIR)) {
    if (name.endsWith('.sql') && !sqlishBefore.has(name)) rmSync(join(DRIZZLE_DIR, name), { force: true })
  }
}

const addedSql = readdirSync(DRIZZLE_DIR).filter((name) => name.endsWith('.sql') && !sqlishBefore.has(name))
const addedSnapshots = [...snapshotFiles()].filter((name) => !snapshotsBefore.has(name))

cleanup()

if (addedSql.length > 0 || addedSnapshots.length > 0) {
  console.error('')
  console.error('::error::schema.ts changes are not covered by a committed migration.')
  console.error('')
  console.error('A migration would have been generated as:')
  for (const name of addedSql) console.error(`  drizzle/${name}`)
  console.error('')
  console.error('Run `bun run db:generate` and commit the result.')
  console.error('')
  process.exit(1)
}

console.log('No schema drift: every change in schema.ts has a committed migration.')
