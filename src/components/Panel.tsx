import type { ReactNode } from 'react'

export function Panel({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel${className ? ` ${className}` : ''}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {hint ? <span className="panel-hint">{hint}</span> : null}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}
