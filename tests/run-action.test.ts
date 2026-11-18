import { describe, expect, it } from 'vitest'
import { runAction } from '../src/lib/run-action'

describe('runAction', () => {
  it('returns a successful action unchanged', async () => {
    await expect(
      runAction(async () => ({ ok: true, message: 'Saved.' }), 'Failed.'),
    ).resolves.toEqual({ ok: true, message: 'Saved.' })
  })

  it('turns a thrown error into a visible failure', async () => {
    await expect(
      runAction(async () => {
        throw new Error('validation exploded')
      }, 'Could not save.'),
    ).resolves.toEqual({ ok: false, message: 'Could not save.' })
  })
})
