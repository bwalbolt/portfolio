"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";

import { CONTACT_COPY } from "../_content/site-content";
import { Button, Icon, cx } from "./primitives";
import styles from "./homepage.module.css";

type SubmissionState = "idle" | "sending" | "success" | "error";

type ContactFormValues = {
  email: string;
  message: string;
  name: string;
};

type FieldName = keyof ContactFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getValidationErrors({ email, message, name }: ContactFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim()) {
    errors.name = "Please enter your name.";
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    errors.name = "Please keep your name under 120 characters.";
  }
  if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (email.trim().length > MAX_EMAIL_LENGTH) {
    errors.email = "Please keep your email address under 254 characters.";
  }
  if (!message.trim()) {
    errors.message = "Please enter a message.";
  }
  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    errors.message = "Please keep your message under 5,000 characters.";
  }

  return errors;
}

export function ContactForm() {
  const messageId = useId();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SubmissionState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const formData = new FormData(form);
    const values = {
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      name: String(formData.get("name") ?? ""),
    };
    const validationErrors = getValidationErrors(values);

    if (Object.keys(validationErrors).length > 0) {
      setState("idle");
      setFieldErrors(validationErrors);
      setStatusMessage("");
      return;
    }

    setState("sending");
    setFieldErrors({});
    setStatusMessage("Sending your message…");

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({
          ...values,
          company: String(formData.get("company") ?? ""),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Contact submission failed");
      }

      form.reset();
      setState("success");
      setStatusMessage("Thanks — your message is on its way. I’ll be in touch soon.");
    } catch {
      setState("error");
      setStatusMessage("Your message could not be sent. Please try again shortly.");
    }
  }

  const isSending = state === "sending";

  return (
    <form className={styles.contactForm} noValidate onSubmit={handleSubmit}>
      <h2 className={styles.contactTitle}>{CONTACT_COPY.heading}</h2>

      <div className={styles.contactFieldGrid}>
        <div
          className={styles.fieldGroup}
          data-field="name"
          data-has-error={Boolean(fieldErrors.name)}
        >
          <label className={styles.fieldLabel} htmlFor="contact-name">
            {CONTACT_COPY.nameLabel}
          </label>
          <input
            autoComplete="name"
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
            aria-invalid={Boolean(fieldErrors.name)}
            className={styles.textField}
            id="contact-name"
            maxLength={MAX_NAME_LENGTH}
            name="name"
            placeholder={CONTACT_COPY.namePlaceholder}
            required
            type="text"
          />
          {fieldErrors.name ? (
            <p className={styles.fieldError} id="contact-name-error" role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div
          className={styles.fieldGroup}
          data-field="email"
          data-has-error={Boolean(fieldErrors.email)}
        >
          <label className={styles.fieldLabel} htmlFor="contact-email">
            {CONTACT_COPY.emailLabel}
          </label>
          <input
            autoComplete="email"
            aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
            aria-invalid={Boolean(fieldErrors.email)}
            className={styles.textField}
            id="contact-email"
            maxLength={MAX_EMAIL_LENGTH}
            name="email"
            placeholder={CONTACT_COPY.emailPlaceholder}
            required
            type="email"
          />
          {fieldErrors.email ? (
            <p className={styles.fieldError} id="contact-email-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cx(styles.fieldGroup, styles.messageFieldGroup)}
        data-field="message"
        data-has-error={Boolean(fieldErrors.message)}
      >
        <label className={styles.fieldLabel} htmlFor="contact-message">
          {CONTACT_COPY.messageLabel}
        </label>
        <textarea
          className={cx(styles.textField, styles.textareaField)}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          aria-invalid={Boolean(fieldErrors.message)}
          id="contact-message"
          maxLength={MAX_MESSAGE_LENGTH}
          name="message"
          placeholder={CONTACT_COPY.messagePlaceholder}
          required
          rows={6}
        />
        {fieldErrors.message ? (
          <p className={styles.fieldError} id="contact-message-error" role="alert">
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      <div aria-hidden="true" className={styles.honeypot}>
        <label htmlFor="contact-company">Company</label>
        <input
          autoComplete="off"
          id="contact-company"
          name="company"
          tabIndex={-1}
          type="text"
        />
      </div>

      <p className={styles.contactPrivacy}>
        By sending a message, you agree that I may use these details to respond. Read
        the{" "}
        <Link
          href="/privacy-policy"
          rel="noopener noreferrer"
          target="_blank"
        >
          Privacy Policy
        </Link>.
      </p>

      <Button
        aria-describedby={messageId}
        className={styles.contactButton}
        disabled={isSending}
        icon={<Icon name="paper-plane" />}
        type="submit"
      >
        {isSending ? "Sending…" : CONTACT_COPY.submitLabel}
      </Button>

      <p
        aria-live="polite"
        className={styles.contactStatus}
        data-status={state}
        id={messageId}
        role={state === "error" ? "alert" : undefined}
      >
        {state === "error" ? (
          <>
            <strong className={styles.statusPrefix}>Error: </strong>
            {statusMessage}
          </>
        ) : state === "success" ? (
          <>
            <strong className={styles.statusPrefix}>Success! </strong>
            {statusMessage}
          </>
        ) : (
          statusMessage
        )}
      </p>
    </form>
  );
}
