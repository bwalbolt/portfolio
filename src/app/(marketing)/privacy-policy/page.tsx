import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  description: "How Walbolt Digital, LLC handles information submitted through this portfolio.",
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 8, 2026">
      <p>
        Walbolt Digital, LLC (“we,” “our,” or “us”) operates this website. This
        Privacy Policy explains how we collect, use, and protect your information
        when you visit our site.
      </p>

      <section>
        <h2>1. Information We Collect</h2>
        <h3>Information you provide</h3>
        <p>If you contact us through a form or email, we may collect:</p>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Message content</li>
        </ul>
        <h3>Information processed to operate and secure the site</h3>
        <p>
          Our hosting and security providers may process limited request, device,
          and IP-address information to deliver the site, prevent abuse, and apply
          contact-form rate limits. We do not currently use analytics.
        </p>
      </section>

      <section>
        <h2>2. How We Use Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Respond to inquiries and communicate with you</li>
          <li>Provide requested services</li>
          <li>Maintain internal records and administrative functions</li>
          <li>Operate and protect this website</li>
        </ul>
        <p>We do not sell or rent your personal information.</p>
      </section>

      <section>
        <h2>3. Cookies and Tracking</h2>
        <p>
          This website does not use cookies for tracking or personalization, and no
          analytics service is currently enabled. If we add a privacy-friendly,
          cookie-free analytics service in the future, we will update this policy
          before it is enabled.
        </p>
      </section>

      <section>
        <h2>4. Third-Party Services</h2>
        <p>We use third-party services to operate this website and process data:</p>
        <ul>
          <li>Vercel provides website hosting, delivery, and security controls.</li>
          <li>Resend processes contact-form email delivery on our behalf.</li>
        </ul>
        <p>These providers may process limited data as necessary to provide their services.</p>
      </section>

      <section>
        <h2>5. Third-Party Links</h2>
        <p>
          This website may contain links to third-party websites. We are not
          responsible for the privacy practices or content of those sites.
        </p>
      </section>

      <section>
        <h2>6. Data Security</h2>
        <p>
          We take reasonable measures to protect your information, including using
          secure HTTPS connections. However, no method of transmission over the
          internet is completely secure.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>We retain personal information only as long as necessary to:</p>
        <ul>
          <li>Respond to inquiries</li>
          <li>Maintain business records</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>Depending on your location, you may have rights to:</p>
        <ul>
          <li>Request access to your personal data</li>
          <li>Request correction or deletion</li>
          <li>Object to or restrict processing</li>
        </ul>
        <p>To make a request, contact us using the information below.</p>
      </section>

      <section>
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Updates will be
          posted on this page with a revised effective date.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          If you have questions about this Privacy Policy, email{" "}
          <a href="mailto:hello@walbolt.com">hello@walbolt.com</a> or write to
          Walbolt Digital, LLC in Tampa, Florida, United States.
        </p>
      </section>
    </LegalPage>
  );
}
