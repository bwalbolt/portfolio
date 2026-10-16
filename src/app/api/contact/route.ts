import { Resend } from "resend";

const MAX_REQUEST_BYTES = 7_000;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  company?: unknown;
  email?: unknown;
  message?: unknown;
  name?: unknown;
};

type ContactSubmission = {
  email: string;
  message: string;
  name: string;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseSubmission(payload: ContactPayload): ContactSubmission | null {
  if (!isString(payload.name) || !isString(payload.email) || !isString(payload.message)) {
    return null;
  }

  const name = payload.name.trim();
  const email = payload.email.trim();
  const message = payload.message.trim();

  if (
    !name ||
    name.length > MAX_NAME_LENGTH ||
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email) ||
    !message ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return null;
  }

  return { email, message, name };
}

function response(status: number, message: string) {
  return Response.json({ message }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host || new URL(origin).host !== host) {
    return response(403, "Please submit the contact form from this site.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return response(400, "Please submit the contact form again.");
  }

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return response(400, "Please keep your message shorter and try again.");
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return response(400, "Please submit the contact form again.");
  }

  if (isString(payload.company) && payload.company.trim()) {
    return Response.json({ ok: true });
  }

  const submission = parseSubmission(payload);

  if (!submission) {
    return response(400, "Please check your details and try again.");
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    return response(502, "The contact form is temporarily unavailable. Please try again later.");
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      replyTo: submission.email,
      subject: `Portfolio contact from ${submission.name}`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\n\nMessage:\n${submission.message}`,
      to,
    });

    if (error) {
      return response(502, "Your message could not be sent. Please try again shortly.");
    }
  } catch {
    return response(502, "Your message could not be sent. Please try again shortly.");
  }

  return Response.json({ ok: true });
}
