# p0ntus design authority

This file is the direction. The antislop skills are the filter. Read both before changing UI.

Dial: ENERGY 2 / RHYTHM 3 / MOTION 1.

Reading this as: a personal profile and small member directory for Aidan's corner of the web, in a 2007 social-profile visual language adapted to night purple, dial ENERGY 2 / RHYTHM 3 / MOTION 1.

## What this is

A dense, square-cornered profile page from the social-web era, rebuilt with current markup and real content. It is not a modern dashboard, not a card grid, and not a clone of MySpace's brand. The composition comes from the supplied reference: a centered canvas, two chrome tiers, a breadcrumb, a full-width identity band, and bordered panels in a two- or three-column grid depending on width. The surface treatment is night purple.

Every section on a profile exists because a profile has that content: identity, portrait, contact routes, account facts, biography, and public comments. There are no songs, top friends, groups, blogs, activity feeds, hit counters, mood emoji, online dots, or friend requests. None of those exist in this application, so none are drawn.

## Canvas and composition

- Desktop canvas: 1180px centered at 1080px and wider, with 16px side padding outside it, on every route. Below 1080px the canvas is 800px. Header, breadcrumb, content, and footer canvases share that width, so the shell and the left column hold their position as the reader moves between routes.
- Two-tier header: a 26px utility bar in the darkest chrome, then a 58px masthead carrying the wordmark, a compact search field, and account links.
- Breadcrumb: one 24px strip under the masthead, showing where the reader is, with links to every level.
- Profile masthead: full canvas width, 1px border, 14px by 16px padding, with the portrait at the left, the profile name in Georgia, and the handle plus account facts beneath it.
- Body grid: at 1080px and wider, three tracks of 360px, 340px, and the remaining width, with 10px gutters and top alignment. Profile and account share those tracks, so the left column never moves between them. The profile puts portrait, contact, and facts in the first track, biography in the second, and comments in the third. Account is tabbed. The Profile tab keeps the tracks: the profile form first, contact methods and the administrator-only avatar upload second. The Comments and Models tabs use the full canvas. Models is a dense table in the same language as the member directory: icon and model id, tokens, cost, last used, and one quiet Edit per row. Numbers are right-aligned and tabular, and the editor opens in a full-width row directly under the model it changes instead of pushing a form to the top. Model Groups sets its 360px suggestion track beside the groups panel at 1080px and wider. Connections keeps a 760px column at the left, because prose and commands read badly when stretched, and Settings keeps a 560px form at the left. Models and Model Groups appear in the strip only after a usage sync. Admin also replaces the track grid with tabbed pages for Comments, Members, and Settings, one page at a time. Below 1080px the first track is 300px and the second holds the rest; the member directory uses one column at that width.
- Panels: 1px border, square corners, no radius, a 3px to 5px drop shadow that separates the light sheet from the dark page, and a gradient title bar. The title bar is the hierarchy signal, so panel titles are uppercase Verdana at 10px with 0.08em tracking. That tracking is a period detail with a function: it separates a title bar from body text at small sizes.
- Dense tables: 9.5px to 10.5px Verdana, 3px to 4px cell padding, dotted 1px row separators. Tables are used where the content is genuinely tabular: account facts, directory rows, moderation queues.
- Body type: Verdana, Geneva, sans-serif at 11px with 1.5 line height. Verdana was drawn for screen reading at small sizes and is the reference's voice. It is not a default sans choice; it is the period.
- Headings: Georgia, Times New Roman, serif. The profile name is 31px bold with 0.3px tracking. Panel titles stay in Verdana so the masthead remains the one serif focal point.
- Links: underlined in body copy, not underlined in chrome. Hover adds the underline back on chrome. Every link has a real destination.

## Night purple tokens

| Token | Value | Role |
|---|---|---|
| `--page` | `#160e28` | Deep plum page field behind the canvas |
| `--chrome` | `#26163f` | Header and shared site chrome |
| `--chrome-deep` | `#1b0f2e` | Utility bar, breadcrumb field, footer, pressed chrome |
| `--chrome-hi` | `#352052` | Masthead gradient top and chrome nav hover |
| `--chrome-line` | `#3c2a58` | 1px rules inside chrome |
| `--chrome-edge` | `#7b55a8` | Masthead bottom rule |
| `--chrome-text` | `#e9dcff` | Primary chrome text |
| `--chrome-text-dim` | `#cbb8e6` | Utility bar and footer text, 10.0:1 |
| `--chrome-link` | `#d8c6f2` | Chrome links, 11.5:1 |
| `--title-from` | `#503278` | Gradient title bar top, primary button top |
| `--title-to` | `#322050` | Gradient title bar bottom, 1px bottom border `#1a0f2a` |
| `--panel` | `#fbf8ff` | Pale panel sheet |
| `--panel-alt` | `#f3ecfa` | Portrait well and inset form fields |
| `--ink` | `#211932` | Body text on panels |
| `--muted` | `#4b3b5e` | Secondary text on panels, 9.57:1 |
| `--line` | `#c9b7dd` | Panel border and dotted rule |
| `--control-border` | `#8f7aa8` | Input and secondary button boundary, 3.81:1 on white |
| `--page-text` | `#e9dcff` | Text directly on the plum page field |
| `--page-muted` | `#cbb8e6` | Page introductions on the plum field, 10.0:1 |
| `--accent` | `#c7a5f0` | Lavender accent on dark chrome, 7.93:1 on `--chrome` |
| `--accent-ink` | `#4a2578` | Accent for pale surfaces, 10.93:1 on `--panel` |
| `--focus` | `#f0d9ff` | Focus ring on dark chrome |
| `--focus-ink` | `#4a2578` | Focus ring on pale panels |
| `--error` | `#8a1c3f` | Error text on panels, 8.61:1 |
| `--success` | `#1c5c42` | Success text on panels, 7.51:1 |

Contrast was computed, not eyeballed. Ink on panel is 15.98:1. Muted on panel is 9.57:1. White on the title gradient's lightest stop is 10.15:1. Lavender on chrome is 7.93:1. Page text on the plum field is 12.29:1 and page introductions are 10.0:1. The secondary control border is 3.81:1 on white and above 3:1 on each themed inset field. The focus ring is 3:1 or better against both chrome and panel. The one deliberate accent appears on the profile masthead rule, the primary button, and the focus ring. It is not used for every border, label, and icon.

Gradients appear in exactly two places: the shared masthead and panel title bars. Their job is to separate chrome from content and title from body. No page-wide glow, no radial orb, no mesh, no glass, no shadow on body text.

Borders are 1px solid, square, and always darker than the surface they enclose. The reference's double edge is reproduced as a 1px outer border plus a 1px inset highlight on the masthead only. Panels keep a single border.

## Profile themes

Theme presets affect the profile masthead, profile panels, and the page field behind the profile canvas. They never change the shared site header, utility bar, footer, or global form controls. The administrator's site color theme below controls those; the two settings are independent. Visitors see the profile's palette, never a printed name for it: the public profile does not label or list the theme preset.

| Preset | Page | Masthead and title bars | Panel | Ink | Line | Accent on dark | Link on panel |
|---|---|---|---|---|---|---|---|
| `night` | `#160e28` | `#503278` to `#322050` | `#fbf8ff` | `#211932` | `#c9b7dd` | `#c7a5f0` | `#4a2578` |
| `blue` | `#06182e` | `#1b3a8f` to `#12306b` | `#fbfcff` | `#152445` | `#b9c8e8` | `#7fe7ff` | `#1b3a8f` |
| `pink` | `#240b18` | `#7a2b50` to `#521a37` | `#fceef6` | `#2a1420` | `#e2b9cf` | `#ffb3e6` | `#8a1c4f` |

The blue preset is the reference palette, recolored only enough to keep its own contrast. The pink preset uses dark burgundy chrome rather than a pink page, because pale panels need a dark field to read as sheets. Each preset's ink on panel is above 14:1. Each preset's accent on chrome is above 7:1.

## Site color theme

The administrator chooses one color theme for the whole site on the Settings tab in `/admin`. It sets the utility bar, masthead, breadcrumb, page field, panels, form controls, and footer for every visitor, signed in or not. It is stored once in `site_settings`, not on an account, and it has no public label.

A signed-in account can override that theme for itself in the Color theme panel on `/account`. The choice is stored in `profiles.preferred_theme` as one of the three presets, or `NULL` to follow the administrator's theme. When set, it replaces the site theme on every route for that account only, including the header and footer. It never affects other visitors, and it does not change the account's public profile theme. Switching back to Site default clears the column.

A profile keeps its own theme inside the profile field, so the header and footer follow the viewer's effective site theme while the profile being read keeps the palette its owner chose. The site default and the account override use the same three presets; the site theme adds chrome tokens on top of the panel palette.

| Preset | Page | Chrome deep | Chrome | Masthead top | Masthead rule | Panel | Ink | Link on panel | Accent on chrome |
|---|---|---|---|---|---|---|---|---|---|
| `night` | `#160e28` | `#1b0f2e` | `#26163f` | `#352052` | `#7b55a8` | `#fbf8ff` | `#211932` | `#4a2578` | `#c7a5f0` |
| `blue` | `#06182e` | `#081c36` | `#102a4c` | `#153a67` | `#2f6ec2` | `#fbfcff` | `#152445` | `#1b3a8f` | `#7fe7ff` |
| `pink` | `#240b18` | `#2a0f1c` | `#3a1526` | `#4a1c31` | `#a04b74` | `#fceef6` | `#2a1420` | `#8a1c4f` | `#ffb3e6` |

Contrast for the new chrome was computed, not eyeballed. Chrome text is 12.62:1 on blue chrome and 13.71:1 on pink chrome. Dim chrome text is 11.53:1 and 9.77:1 on the deep chrome. Accents are 10.14:1 and 9.77:1 on chrome. Muted panel text is 8.02:1 and 9.26:1. Panel links are 9.99:1 and 7.92:1. Control borders stay at or above 3.24:1 on an inset field. Panel titles stay white on their gradient: 10.25:1 and 9.17:1 at the lightest stop.

## Component states

- Links: `--accent-ink` on panels, `--accent` on chrome. Hover underlines and darkens or lightens one step. Visited keeps the same hue, because a social profile is not a reading list.
- Buttons: 1px dark border, a two-stop vertical gradient from `--title-from` to `--title-to`, white 10px bold Verdana, 4px 10px padding, 2px radius. Radius is 2px only on buttons and inputs; panels and mastheads stay square. Hover raises the gradient one step. Active moves 1px down. Disabled uses a flat `#d8cfe6` field, `--muted` text, and `cursor: not-allowed`.
- Inputs: 1px `#8f7aa8` border, white field, 2px radius, 20px to 32px height depending on the control, 10px Verdana. Focus uses a 2px `--focus-ink` outline with a 1px offset. Invalid fields get a 1px `--error` border plus visible error text, never color alone.
- Panels: no hover state. They are paper, not cards.
- Comment rows and directory rows: hover tints the row to `#f3ecfa` and underlines the member link. Pending comments carry a text label, not a colored stripe.
- Focus: `:focus-visible` gets a 2px outline in `--focus` on dark chrome and `--focus-ink` on panels, offset 2px. The outline is never removed.

## Profile hierarchy

1. The profile name and portrait are the focal point of the profile route.
2. The identity band's account facts (handle, member since) are secondary.
3. Panel title bars sit above their content and below the identity band.
4. Comment text and biography are the reading layer.
5. Directory and admin routes replace the profile focal point with the search field, the pending queue, or the page tab strip. They do not reuse the profile masthead.

The tagline sits directly under the handle in the identity band, before the account facts. The contact panel renders only configured methods, in a fixed order: Discord, X, email, Telegram, GitHub, Instagram. Each method pairs its brand mark to the left of the label with the stored value beneath it. Contact values are 9px bold, one step below the fact table, so a typical email address fits on one line inside the half-width card. Discord has no public profile URL by username, so its card is informational rather than a link. With no configured methods, the panel is absent.

The first track is for facts and routes. The middle track is for prose, and the last track is for public conversation. Below 1080px, prose and conversation stack in the second track. That split keeps the page scannable at 11px.

The model usage card sits directly below About me in the middle track, and only when its owner has enabled it. It ranks five models with horizontal bars in the panel title gradient against a `--panel-alt` track, and switches between tokens and cost. The agent-exporter export carries no request counts, so there is no requests metric to offer. The card never moves into the comments track or the facts track: it is the owner's prose-layer claim about their own work, not a directory stat.

Model names and icons come only from synced agent-exporter data plus the owner's overrides on the Models tab. A model group on the Model Groups tab replaces its members on the card with one alias and one summed value, so a family that the exporter recorded under several ids reads as one model. The card never invents a model, a value, or a total, and it shows nothing when no usage has been synced.

## Reflow

- At 1080px and wider: every canvas is 1180px. Profile and account Profile run the same three tracks: 360px, 340px, then the remaining width. On the profile, biography sits above comments in the second and third tracks. On the account Profile tab, the form takes the first 360px track and contact methods plus avatar upload the second 340px track, with no third track, because a two-column form reads faster than one stretched column. Account Comments and Models use the full canvas, Connections keeps a 760px column at the left, and Settings keeps a 560px form at the left. Model Groups puts its suggestion list in a 360px track beside the groups panel, so the working surface is never one card per row on a wide screen. Admin shows one tab at a time: Comments and Members use the full canvas, and Settings keeps a 560px form at the left. The member directory uses the full canvas, and legal, login, signup, and setup keep a 560px reading column centered inside the shell.
- At 720px to 1079px: the 800px canvas and two tracks of 300px plus the remaining width, with a 10px gutter. Profile biography sits above comments. Account Profile keeps the 300px plus remaining two-track grid; Comments, Connections, Models, and Settings are one column. Admin and the member directory use one column.
- At 600px to 719px: the canvas is fluid with 32px gutters and every route is one column. Panels are full width. The header masthead drops the search field into its own row.
- Below 600px: 24px gutters, one column, every account tab is one column, and the Profile tab's cards stack. The portrait panel becomes a horizontal identity block with a 120px portrait. The utility bar wraps to two rows. Navigation links keep 44px minimum touch height and wrap rather than shrink. Tables become stacked definition rows with their labels visible. No horizontal scrolling.
- At 200% zoom on a 375px viewport, the layout is the single-column state. Text grows, nothing clips, and the focused input scrolls above the on-screen keyboard.

## Motion, focus, and touch

- MOTION 1: transitions on color, border, and focus only, 120ms. No entrance animations, no looping pulses, no marquee, no parallax, no auto-advancing content.
- `prefers-reduced-motion: reduce` removes transitions and any smooth scrolling.
- Every interactive target is at least 44x44px on touch widths. Desktop chrome links may be visually smaller but keep a 24px hit area inside a 44px row.
- Keyboard order follows visual order: skip link, utility bar, masthead, breadcrumb, profile content, footer. The skip link targets `#main`.
- Dialogs (comment deletion, account deletion) use a native `<dialog>` or an inline confirmation region, close on Escape, restore focus, and state the consequence in text.

## Content rules

Use only verified content: the profile owner's display name, tagline, biography, and the contact methods they configure on `/account`. Never render a contact method the owner left blank. A profile with no contact methods shows no contact panel, and a profile with no tagline or bio shows honest empty space, not filler. No invented friends, counts, moods, songs, testimonials, or legal entities. Empty states say what is missing and what to do next. Error states say what failed and how to retry.
