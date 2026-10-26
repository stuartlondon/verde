# Magazine Verde

A three-page static Astro recreation of the Magazine Verde WordPress site,
with a small contact thank-you page. Stuart maintains the content directly;
there is no CMS or client framework.

Public URL: **https://magazineverde.1976.london/**

## Editing

- `src/pages/index.astro`: welcoming home page.
- `src/pages/projects.astro`: gallery with accessible image enlargement.
- `src/data/projects.ts`: images, captions, and alternative text.
- `src/pages/contact.astro`: static contact form posting to FormSubmit.
- `src/pages/contact/thanks.astro`: static return page after submission.
- `src/layouts/BaseLayout.astro`: navigation, footer, persisted green/yellow theme.
- `src/styles/global.css`: responsive panels and shared styles.
- `src/assets/`: images copied from the existing Magazine Verde theme at
  `https://verd.1976.london/wp-content/themes/magazineverde-template/images-work/`.
  Confirm publication rights and final captions before launch; the visibly
  watermarked stock photo was excluded.
- `public/fonts/`: self-hosted League Spartan with the accompanying SIL Open
  Font License.

The gallery is an initial visual selection, not a claim that these are completed
client projects. Replace or expand it as real content becomes available.

## Development

Requires Node.js 22.23.4 or newer compatible with Astro 7, and npm on the
development machine only. Project: `/home/stuart/sites/astro/verde-astro`.

```sh
npm ci
npm run dev
```

Development uses port 4387. For MacBook/LAN access when needed:

```sh
npm run dev -- --host 0.0.0.0
```

Browse `http://192.168.1.251:4387/` if that is still the Beelink's LAN address.
Do not expose the development server to the public internet.

## Contact form

The form uses the same hosted FormSubmit approach as the live 1976 London site.
It posts directly to `https://formsubmit.co/stuart@1976.london` and returns to
`https://magazineverde.1976.london/contact/thanks/`.

- No cPanel Node.js application, SMTP credentials, `.env`, or PHP handler is needed.
- The `email` field allows Reply-To; the subject identifies Magazine Verde.
- FormSubmit's default CAPTCHA remains enabled, with a `_honey` spam field.
- Submission works without JavaScript. FormSubmit handles server-side delivery,
  CAPTCHA, and submission errors on its own site; local SMTP validation,
  in-process rate limiting, and local error preservation have been removed.
- The privacy note identifies FormSubmit as the processor. Its documentation
  says submissions are retained for 30 days; review the provider's current
  privacy terms before collecting real enquiries.
- The return page acknowledges submission, not confirmed inbox delivery.
- Direct email remains available if the service cannot be used.

On the published HTTPS site, submit a test, check for any FormSubmit activation
email, follow its instructions, then submit again if needed. Confirm the message
arrives in **stuart@1976.london** (including spam folders) and the return link works.
Activation and inbox delivery have not yet been verified for this subdomain.
No real enquiry was sent during automated checks.

## Validate and preview

```sh
npm run check
npm test
npm run preview -- --host 0.0.0.0
```

`npm test` builds the site and checks the generated HTML, static routes, form
destination, return URL, and retained theme/gallery assets. Preview uses port
4388. All pages are generated into `dist/`, with no Node server build.
The public HTTPS URL is set in `astro.config.mjs`; no runtime hostname allowlist
is needed for a static site posting directly to FormSubmit.

## Upload through cPanel

1. Run `npm run check` and `npm test` from the project root.
2. Zip the **contents of `dist/`**, not the enclosing project or `dist` folder.
   The archive root should contain `index.html`, `projects/`, `contact/`,
   `_astro/`, `fonts/`, and `favicon.svg`.
3. In cPanel, confirm the exact document root assigned to
   `magazineverde.1976.london`. Do not assume it is the main site's `public_html`.
4. Back up existing files there, if any. Upload the zip and extract it directly
   into that subdomain's document root.
5. Ensure HTTPS is enabled. Test Home, Projects, Contact, both themes, gallery
   enlargement, and the complete real email flow.
6. Remove the uploaded zip from the public document root after extraction.

Do not upload source code, `node_modules/`, `.git/`, `.env` files, or server
credentials. Standard cPanel static hosting is sufficient.

## Status

Switched from the initial SMTP/Node implementation to static hosting with
FormSubmit at Stuart's request. Git is local; no remote is assumed.
No cPanel, Apache, DNS, firewall, WordPress, or mail-account configuration has
been changed. Supplied project-process and Beelink guidance remain unmodified.

Next: upload the static build, activate the form if requested, and confirm a
real test message reaches Stuart's inbox before sharing the form as verified.
