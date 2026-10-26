# Magazine Verde

A lean, three-page Astro recreation of the Magazine Verde WordPress site.
Stuart maintains the content directly; there is no CMS or client framework.

## Pages and editing

- `src/pages/index.astro`: welcoming home page.
- `src/pages/projects.astro`: gallery, with keyboard-accessible image enlargement.
- `src/data/projects.ts`: gallery images, captions, and alternative text.
- `src/pages/contact.astro`: server-rendered contact form, also works without JavaScript.
- `src/layouts/BaseLayout.astro`: shared navigation, footer, and persisted green/yellow theme.
- `src/styles/global.css`: shared responsive panels and styles.
- `src/assets/`: images copied from the existing `https://verd.1976.london/` theme's
  `wp-content/themes/magazineverde-template/images-work/` directory.
  Confirm publication rights and final captions before launch. The visibly
  watermarked stock photo was excluded.
- `public/fonts/`: self-hosted League Spartan from Google Fonts, licensed under
  the accompanying SIL Open Font License.

The gallery is an initial visual selection, not a claim that these are completed
client projects. Replace or expand it as real project content becomes available.
The public domain is not yet agreed; no canonical domain is assumed.

## Local development

Requires Node.js 22.23.4 or newer compatible with Astro 7, and npm.
Project: `/home/stuart/sites/astro/verde-astro` on the Beelink.

```sh
npm ci
npm run dev
```

For MacBook/LAN access when needed:

```sh
npm run dev -- --host 0.0.0.0 --port 4387
```

Browse `http://192.168.1.251:4387/` if that is still the server's LAN address.
Do not expose the development server to the public internet.

## Contact email

Test recipient is fixed to **stuart@1976.london** in `src/lib/contact.ts`.
The form uses SMTP via Nodemailer, not a mailto-only substitute.

1. Copy `.env.example` to `.env` locally on the server.
2. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
   and `SMTP_FROM` using the mail provider's settings. Do not share credentials
   in chat or commit them. `SMTP_FROM` must be a plain, provider-authorised
   email address. The visitor's address is used only for Reply-To.
3. Normally use port 587 with `SMTP_SECURE=false` (STARTTLS required), or
   port 465 with `SMTP_SECURE=true` (TLS from connection start).
   Certificate validation is never disabled.
4. Restart the server after changing `.env`.
5. Send a test and confirm receipt in Stuart's inbox before calling email
   delivery verified. SMTP acceptance is not proof of inbox delivery.

Missing configuration returns an explicit unavailable message (HTTP 503).
SMTP failures return an error (HTTP 502) and preserve the entered content.
No success is shown unless the SMTP server accepts the recipient.
The form validates on the server, checks Origin, bounds submission sizes, and
uses a honeypot plus a five-attempt/15-minute in-memory limit per address
reported by the Node adapter. The limit resets on restart and is not shared
across processes. The adapter can use forwarded client addresses for allowed
hosts: at deployment the proxy must replace incoming forwarding headers, and
the Node server must not be publicly reachable. Add proxy-level rate limiting
before public launch; the in-process limiter alone is not robust spam protection.

## Validation and production

```sh
npm run check
npm test
npm run build
npm run preview -- --host 0.0.0.0 --port 4388
```

Only Contact is rendered on demand. Home and Projects are generated at build
time. The Node adapter serves both the static pages and the form.
Preview checks the build; use the standalone entry point for deployment:

```sh
HOST=127.0.0.1 PORT=4388 npm start
```

`npm start` and `npm run dev` load `.env` if present; externally supplied
environment variables take precedence. Build output is `dist/`, not tracked.

## Beelink deployment boundary

The supplied Beelink document describes a development platform with Apache for
WordPress and Node/npm for Astro. It is an unreviewed overview, not confirmation
of a production hosting or email setup. No Apache, DNS, firewall, WordPress,
or system-service settings have been changed for this project.

For an eventual Apache deployment, run the built Node server under an agreed
service manager, bind it to loopback, and reverse proxy the agreed hostname
over HTTPS. Add the final hostname, HTTPS protocol, and port to
`security.allowedDomains` in `astro.config.mjs`, then rebuild. The initial
allowlist covers only localhost, loopback, and the observed Beelink LAN address
on ports 4387/4388. Update it if the LAN address or preview port changes.
Preserve the Host header and provide the correct forwarded scheme so same-origin
form submissions work. Keep Astro's origin checks enabled. Test actual HTTPS
form submissions after proxy configuration. Do not merely point Apache at `dist/client`: that would
omit the email handler. SMTP credentials, final hostname, proxy protections,
and service management remain deployment decisions.

## Status and next action

Initial three-page implementation. Git is local; no GitHub remote is assumed.
Review the visual preview, configure SMTP privately, verify a real inbox
delivery, agree the final images/content and domain, then arrange deployment.
The supplied process and Beelink guidance remain unmodified.

Verified on 26 October 2026:

- Astro type check: zero errors or warnings.
- All 11 contact tests pass, including sender/recipient handling, simulated
  acceptance/rejection, validation, rate limits, and full-length Unicode input.
- Production build, preview, and standalone server start successfully.
- All three production routes return 200 with correct active navigation.
- Desktop and 375px mobile layouts checked; no horizontal overflow in either theme.
- Gallery enlargement, Escape/Close, and focus restoration checked in browser.
- Theme preference persists between pages.
- A real browser POST without SMTP settings returns 503, preserves entered
  content, and does not display success.

**Not yet verified:** actual SMTP authentication or delivery to Stuart's inbox.
Those require the mail provider's configuration and private credentials.
