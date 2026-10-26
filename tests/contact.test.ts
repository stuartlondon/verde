import assert from 'node:assert/strict';
import { test } from 'node:test';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import {
  contactRecipient, handleContact, mailOptions, maxBodyBytes,
  sendContactMessage, takeContactSlot, validateContact,
} from '../src/lib/contact.ts';

const fields = {
  name: 'Test Visitor',
  email: 'visitor@example.com',
  message: 'A small idea for a greener city.',
};
const smtp = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  SMTP_USER: 'test-user',
  SMTP_PASS: 'test-only-password',
  SMTP_FROM: 'website@example.com',
};
let addressNumber = 0;
function address() {
  return `test-${addressNumber++}`;
}
function request(values = fields, options: RequestInit = {}) {
  return new Request('https://verde.example/contact/', {
    method: 'POST',
    headers: {
      origin: 'https://verde.example',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(values),
    ...options,
  });
}

test('validates required fields, bounds, and header injection', () => {
  assert.equal(validateContact(fields), undefined);
  for (const invalid of [
    { ...fields, name: '' },
    { ...fields, name: 'a'.repeat(101) },
    { ...fields, name: 'Name\r\nBcc: other@example.com' },
    { ...fields, email: 'not-an-email' },
    { ...fields, email: 'visitor@example.com\r\nBcc:other@example.com' },
    { ...fields, message: 'short' },
    { ...fields, message: 'a'.repeat(5001) },
    { ...fields, message: 'Message with \u0000 null' },
  ]) assert.ok(validateContact(invalid));
  assert.equal(validateContact({ ...fields, message: 'a'.repeat(5000) }), undefined);
});

test('sends trimmed content and returns a redirect result only after successful delivery', async () => {
  const calls: typeof fields[] = [];
  const result = await handleContact(request({ ...fields, name: '  Test Visitor  ' }), address(), async (value) => {
    calls.push(value);
  });
  assert.equal(result.status, 303);
  assert.equal(result.sent, true);
  assert.deepEqual(calls, [fields]);
  assert.deepEqual(result.fields, { name: '', email: '', message: '' });
});

test('accepts a full-length multilingual message within the body-size budget', async () => {
  const value = { ...fields, message: '界'.repeat(5000) };
  const result = await handleContact(request(value), address(), async () => {});
  assert.equal(result.status, 303);
});

test('rejects invalid content without calling the mail sender and preserves entered fields', async () => {
  let calls = 0;
  const invalid = { ...fields, email: 'invalid' };
  const result = await handleContact(request(invalid), address(), async () => { calls++; });
  assert.equal(result.status, 422);
  assert.deepEqual(result.fields, invalid);
  assert.equal(calls, 0);
});

test('rejects cross-origin, missing-origin, unsupported, oversized, duplicate, and honeypot submissions', async () => {
  const cases = [
    { req: request(fields, { headers: { origin: 'https://other.example' } }), status: 403 },
    { req: request(fields, { headers: {} }), status: 403 },
    { req: request(fields, { headers: { origin: 'https://verde.example', 'content-type': 'application/json' } }), status: 415 },
    { req: request(fields, { body: 'x'.repeat(maxBodyBytes + 1) }), status: 413 },
    { req: request(fields, { body: new URLSearchParams({ ...fields, website: 'spam.example' }) }), status: 400 },
    { req: request(fields, { body: `${new URLSearchParams(fields)}&email=second@example.com` }), status: 400 },
  ];
  for (const { req, status } of cases) {
    const result = await handleContact(req, address(), async () => assert.fail('Must not send invalid submissions'));
    assert.equal(result.status, status);
    assert.equal(result.sent, undefined);
  }
});

test('limits attempts to five per 15 minutes and allows retry after expiry', async () => {
  const client = address();
  for (let i = 0; i < 5; i++) assert.equal(takeContactSlot(client, 1000), true);
  assert.equal(takeContactSlot(client, 1001), false);
  assert.equal(takeContactSlot(client, 901000), true);
  const blocked = address();
  for (let i = 0; i < 5; i++) takeContactSlot(blocked);
  const result = await handleContact(request(), blocked, async () => assert.fail('Rate limited'));
  assert.equal(result.status, 429);
});

test('requires valid SMTP configuration and enforces encrypted transport', () => {
  assert.throws(() => mailOptions({}), /configuration/);
  assert.throws(() => mailOptions({ ...smtp, SMTP_PORT: 'invalid' }), /configuration/);
  assert.throws(() => mailOptions({ ...smtp, SMTP_PORT: '465' }), /configuration/);
  assert.throws(() => mailOptions({ ...smtp, SMTP_FROM: 'bad\r\nsender@example.com' }), /configuration/);
  assert.equal(mailOptions(smtp).requireTLS, true);
  assert.equal(mailOptions({ ...smtp, SMTP_PORT: '465', SMTP_SECURE: 'true' }).secure, true);
});

test('addresses mail to Stuart, uses a trusted sender, and puts visitor details in Reply-To and plain text', async (t) => {
  let message: SendMailOptions | undefined;
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (value: SendMailOptions) => {
      message = value;
      return { accepted: [contactRecipient] };
    },
  }));
  await sendContactMessage(fields, smtp);
  assert.ok(message);
  assert.equal(message.to, 'stuart@1976.london');
  assert.equal(message.from, smtp.SMTP_FROM);
  assert.deepEqual(message.replyTo, { name: fields.name, address: fields.email });
  assert.ok(String(message.text).includes(fields.message));
  assert.equal(message.html, undefined);
  assert.equal(message.disableFileAccess, true);
  assert.equal(message.disableUrlAccess, true);
});

test('SMTP rejection never reports success and preserves form content', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async () => ({ accepted: [] }),
  }));
  const result = await handleContact(request(), address(), (value) => sendContactMessage(value, smtp));
  assert.equal(result.status, 502);
  assert.equal(result.sent, undefined);
  assert.deepEqual(result.fields, fields);
});

test('unconfigured mail returns explicit 503 rather than a false success', async (t) => {
  t.mock.method(console, 'error', () => {});
  const result = await handleContact(request(), address(), (value) => sendContactMessage(value, {}));
  assert.equal(result.status, 503);
  assert.match(result.error ?? '', /temporarily unavailable/);
  assert.equal(result.sent, undefined);
});

test('transport failures return explicit 502 rather than a false success', async (t) => {
  t.mock.method(console, 'error', () => {});
  const result = await handleContact(request(), address(), async () => { throw new Error('Connection failed'); });
  assert.equal(result.status, 502);
  assert.equal(result.sent, undefined);
  assert.deepEqual(result.fields, fields);
});
