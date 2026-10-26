import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../dist/', import.meta.url);
const html = (path) => readFileSync(new URL(path, root), 'utf8');

test('all public pages are generated as static HTML with local navigation', () => {
  for (const path of ['index.html', 'projects/index.html', 'contact/index.html', 'contact/thanks/index.html']) {
    const page = html(path);
    assert.equal((page.match(/<h1\b/g) ?? []).length, 1, path);
    for (const href of ['/', '/projects/', '/contact/']) {
      assert.ok(page.includes(`href="${href}"`), `${path}: ${href}`);
    }
  }
  assert.equal(existsSync(new URL('server/', root)), false);
  assert.equal(existsSync(new URL('client/', root)), false);
});

test('contact form posts to Stuart through FormSubmit with the correct HTTPS return URL', () => {
  const page = html('contact/index.html');
  assert.match(page, /<form\b[^>]*action="https:\/\/formsubmit\.co\/stuart@1976\.london"[^>]*method="post"/);
  assert.match(page, /name="_next" value="https:\/\/magazineverde\.1976\.london\/contact\/thanks\/"/);
  assert.match(page, /name="_subject" value="New Magazine Verde enquiry"/);
  assert.match(page, /name="_template" value="table"/);
  assert.match(page, /name="_honey"/);
  assert.doesNotMatch(page, /name="_captcha"/);
  for (const name of ['name', 'email', 'message']) {
    assert.match(page, new RegExp(`<(?:input|textarea)\\b[^>]*name="${name}"[^>]*required`));
  }
  assert.match(page, /FormSubmit processes your enquiry/);
  assert.doesNotMatch(page, /temporarily unavailable|Your message has been sent/);
});

test('return page offers a direct email fallback without claiming inbox delivery', () => {
  const page = html('contact/thanks/index.html');
  assert.match(page, /mailto:stuart@1976\.london/);
  assert.match(page, /once it reaches our inbox/);
});

test('theme, gallery, font, and favicon are preserved', () => {
  assert.match(html('index.html'), /verde-theme/);
  assert.match(html('index.html'), /theme-toggle/);
  assert.equal((html('projects/index.html').match(/data-gallery-image/g) ?? []).length >= 4, true);
  assert.ok(existsSync(new URL('fonts/league-spartan-800.ttf', root)));
  assert.ok(existsSync(new URL('favicon.svg', root)));
});
