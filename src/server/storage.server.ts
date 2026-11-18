import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import sharp, { type Metadata } from 'sharp'
import { env } from './env.server'

const AVATAR_PREFIX = '/api/avatar/'
const AVATAR_FILENAME = /^[a-f0-9]{32}\.webp$/
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export class AvatarError extends Error {
  constructor(
    readonly reason:
      'too-large' | 'unsupported' | 'invalid' | 'too-many-pixels',
  ) {
    super(reason)
    this.name = 'AvatarError'
  }
}

function detectedFormat(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  ) {
    return 'png'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

export async function processAvatar(buffer: Buffer) {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new AvatarError('too-large')
  }

  const format = detectedFormat(buffer)
  if (!format) throw new AvatarError('unsupported')

  let metadata: Metadata
  try {
    metadata = await sharp(buffer, {
      failOn: 'error',
      limitInputPixels: 40_000_000,
    }).metadata()
  } catch {
    throw new AvatarError('invalid')
  }

  if (
    !metadata.format ||
    !['jpeg', 'png', 'webp'].includes(metadata.format) ||
    !metadata.width ||
    !metadata.height
  ) {
    throw new AvatarError('unsupported')
  }

  let encoded: Buffer
  try {
    encoded = await sharp(buffer, {
      failOn: 'error',
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw new AvatarError('invalid')
  }

  await mkdir(env.UPLOAD_DIR, { recursive: true })
  const filename = `${randomBytes(16).toString('hex')}.webp`
  const target = join(env.UPLOAD_DIR, filename)
  const temporary = `${target}.tmp`
  await writeFile(temporary, encoded, { mode: 0o600 })
  await rename(temporary, target)

  return {
    filename,
    url: `${AVATAR_PREFIX}${filename}`,
  }
}

export async function deleteUploadedAvatar(avatarUrl: string | null) {
  if (!avatarUrl || !avatarUrl.startsWith(AVATAR_PREFIX)) return
  const filename = avatarUrl.slice(AVATAR_PREFIX.length)
  if (!AVATAR_FILENAME.test(filename)) return

  try {
    await unlink(join(env.UPLOAD_DIR, filename))
  } catch {
    // The row is already updated; a missing file is not worth failing the request.
  }
}

export async function readAvatar(filename: string) {
  if (!AVATAR_FILENAME.test(filename)) return null
  try {
    return await readFile(join(env.UPLOAD_DIR, filename))
  } catch {
    return null
  }
}
