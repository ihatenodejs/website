export type ActionOutcome = { ok: boolean; message?: string }

export async function runAction<T extends ActionOutcome>(
  operation: () => Promise<T>,
  fallback: string,
): Promise<T | { ok: false; message: string }> {
  try {
    return await operation()
  } catch {
    return { ok: false, message: fallback }
  }
}
