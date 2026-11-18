export type FormResult = { ok: boolean; message?: string } | null

export function FormMessage({ result }: { result: FormResult }) {
  if (!result) return null
  return (
    <p
      className={result.ok ? 'form-ok' : 'form-error'}
      role={result.ok ? 'status' : 'alert'}
    >
      {result.ok ? (result.message ?? 'Saved.') : result.message}
    </p>
  )
}
