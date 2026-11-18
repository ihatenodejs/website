import { Link } from '@tanstack/react-router'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="canvas">
        <p>
          p0ntus is a small profile site run by Aidan Honor. Profile text and
          comments are public and monitored for abuse.
        </p>
        <nav aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/members">Members</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a
            href="https://github.com/ihatenodejs/website"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
