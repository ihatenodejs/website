import { Link } from '@tanstack/react-router'

export function Breadcrumbs({
  current,
  parent,
}: {
  current: string
  parent?: { label: string; to: '/members' | '/admin' | '/account' }
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <div className="canvas">
        <Link to="/">p0ntus</Link>
        <span aria-hidden="true"> » </span>
        {parent ? (
          <>
            <Link to={parent.to}>{parent.label}</Link>
            <span aria-hidden="true"> » </span>
          </>
        ) : null}
        <span aria-current="page">{current}</span>
      </div>
    </nav>
  )
}
