# website

The latest version of my personal website.

## Setup Instructions

1. Clone the repository: `git clone https://github.com/ihatenodejs/website`
2. Copy example files: `cp examples/** .`
3. Edit `.env`: `vim .env`
4. Run `docker compose up -d --build`

## Environment Variables

| Variable                         | Required | Scope  | Description                                             |
| -------------------------------- | -------- | ------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes      | Client | Cloudflare Turnstile site key used to render the widget |
| `TURNSTILE_SECRET_KEY`           | Yes      | Server | Cloudflare Turnstile secret key used for token verify   |
| `CONTACT_EMAIL`                  | Yes      | Server | Email returned after successful verification            |

## Version Lineage

`website` was certainly not the first! In order:

1. `aidxnFUNretro`
2. `aidxnFUN`
3. `aidxnCC` -> `aidanSO`
4. `website`
