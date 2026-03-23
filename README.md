# website

The latest version of my personal website.

## Setup Instructions

1. Clone the repository: `git clone https://github.com/ihatenodejs/website`
2. Copy example files: `cp examples/** .`
3. Edit `.env`: `vim .env`
4. Run `docker compose up -d --build`

## Environment Variables

| Variable                         | Required | Scope  | Description                                                                     |
| -------------------------------- | -------- | ------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes      | Client | Cloudflare Turnstile site key used to render the widget                         |
| `TURNSTILE_SECRET_KEY`           | Yes      | Server | Cloudflare Turnstile secret key used to verify tokens                           |
| `CONTACT_EMAIL`                  | Yes      | Server | Email returned by `/api/contact/reveal` after successful Turnstile verification |
| `VALKEY_URL`                     | No       | Server | Valkey/Redis connection URL (defaults to `redis://localhost:6379`)              |
| `GITHUB_PAT`                     | No       | Server | GitHub Personal Access Token for GitHub stats widget API calls                  |
| `WIKIPEDIA_USERNAME`             | No       | Server | Wikipedia username used for edit count widget (defaults to `OnlyNano`)          |
| `LISTENBRAINZ_USERNAME`          | No       | Server | ListenBrainz username used for listen count widget (defaults to `p0ntus`)       |

## Version Lineage

`website` was certainly not the first! In order:

1. `aidxnFUNretro`
2. `aidxnFUN`
3. `aidxnCC` -> `aidanSO`
4. `website`
