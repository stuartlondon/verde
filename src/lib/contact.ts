import nodemailer from 'nodemailer';

export const contactRecipient = 'stuart@1976.london';
export const maxBodyBytes = 64_000;
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export interface ContactFields {
  name: string;
  email: string;
  message: string;
}

export function validateContact(fields: ContactFields): string | undefined {
  if (fields.name.length < 2 || fields.name.length > 100 || /[\u0000-\u001f\u007f]/.test(fields.name)) {
    return 'Please enter a name between 2 and 100 characters, on one line.';
  }
  if (fields.email.length > 254 || !emailPattern.test(fields.email)) {
    return 'Please enter a valid email address so we can reply.';
  }
  if (fields.message.length < 10 || fields.message.length > 5000 || /\u0000/.test(fields.message)) {
    return 'Please enter a message between 10 and 5,000 characters.';
  }
}

class MailConfigurationError extends Error {
  constructor() {
    super('Contact SMTP configuration is missing or invalid.');
    this.name = 'MailConfigurationError';
  }
}

export function mailOptions(env: NodeJS.ProcessEnv) {
  const port = Number(env.SMTP_PORT);
  if (
    !env.SMTP_HOST?.trim() ||
    !Number.isInteger(port) || port < 1 || port > 65535 ||
    !['true', 'false'].includes(env.SMTP_SECURE ?? '') ||
    !env.SMTP_USER?.trim() || !env.SMTP_PASS ||
    !emailPattern.test(env.SMTP_FROM ?? '') ||
    (port === 465 && env.SMTP_SECURE !== 'true')
  ) {
    throw new MailConfigurationError();
  }
  return {
    host: env.SMTP_HOST.trim(),
    port,
    secure: env.SMTP_SECURE === 'true',
    requireTLS: env.SMTP_SECURE !== 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
}

export async function sendContactMessage(fields: ContactFields, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const transport = nodemailer.createTransport(mailOptions(env));
  const result = await transport.sendMail({
    from: env.SMTP_FROM,
    to: contactRecipient,
    replyTo: { name: fields.name, address: fields.email },
    subject: 'Magazine Verde website enquiry',
    text: `Name: ${fields.name}\nEmail: ${fields.email}\n\n${fields.message}`,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  if (!result.accepted.some((address) => String(address).toLowerCase() === contactRecipient)) {
    throw new Error('The mail server did not accept the contact recipient.');
  }
}

const attempts = new Map<string, { count: number; expires: number }>();
const rateWindow = 15 * 60 * 1000;

export function takeContactSlot(address: string, now = Date.now()): boolean {
  for (const [key, entry] of attempts) {
    if (entry.expires <= now) attempts.delete(key);
  }
  const entry = attempts.get(address);
  if (entry) {
    if (entry.count >= 5) return false;
    entry.count += 1;
    return true;
  }
  if (attempts.size >= 5000) return false;
  attempts.set(address, { count: 1, expires: now + rateWindow });
  return true;
}

interface ContactResult {
  status: number;
  fields: ContactFields;
  error?: string;
  sent?: boolean;
}

export async function handleContact(
  request: Request,
  address: string,
  send: (fields: ContactFields) => Promise<void> = sendContactMessage,
): Promise<ContactResult> {
  const emptyFields: ContactFields = { name: '', email: '', message: '' };
  const fail = (status: number, error: string, fields = emptyFields): ContactResult => ({ status, error, fields });
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return fail(403, 'Please reload this page and submit the form from this website.');
  }
  if (!takeContactSlot(address)) {
    return fail(429, 'Too many attempts. Please wait 15 minutes or email us directly.');
  }
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') {
    return fail(415, 'Please use the contact form on this page to send your message.');
  }
  if (Number(request.headers.get('content-length')) > maxBodyBytes) {
    return fail(413, 'Your message is too large. Please keep it under 5,000 characters.');
  }
  let body: string;
  try {
    body = await request.text();
  } catch (error) {
    console.error('[contact] Could not read request body:', error instanceof Error ? error.name : 'UnknownError');
    return fail(400, 'Your message could not be read. Please reload the page and try again.');
  }
  if (new TextEncoder().encode(body).byteLength > maxBodyBytes) {
    return fail(413, 'Your message is too large. Please keep it under 5,000 characters.');
  }
  const data = new URLSearchParams(body);
  if (['name', 'email', 'message', 'website'].some((key) => data.getAll(key).length > 1)) {
    return fail(400, 'The form contained duplicate fields. Please reload the page and try again.');
  }
  if (data.get('website')) {
    return fail(400, 'Your submission was flagged as spam. Please email us directly if this was a mistake.');
  }
  const fields: ContactFields = {
    name: (data.get('name') ?? '').trim(),
    email: (data.get('email') ?? '').trim(),
    message: (data.get('message') ?? '').trim(),
  };
  const validationError = validateContact(fields);
  if (validationError) return fail(422, validationError, fields);
  try {
    await send(fields);
    return { status: 303, sent: true, fields: emptyFields };
  } catch (error) {
    const unavailable = error instanceof MailConfigurationError;
    console.error('[contact] Mail delivery failed:', error instanceof Error ? error.name : 'UnknownError');
    return fail(
      unavailable ? 503 : 502,
      unavailable
        ? 'The contact form is temporarily unavailable. Please email us directly using the link below.'
        : 'Your message could not be sent. Please try again later or email us directly.',
      fields,
    );
  }
}
