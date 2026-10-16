import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  description: "Terms of Service for the Walbolt Digital, LLC portfolio website.",
  title: "Terms of Service",
};

export default function TermsOfUsePage() {
  return (
    <LegalPage title="Terms of Service" updated="October 8, 2026">
      <p>
        Welcome to this website, operated by Walbolt Digital, LLC (“we,” “our,”
        or “us”). By accessing or using this site, you agree to these Terms of
        Service.
      </p>

      <section>
        <h2>1. Use of This Website</h2>
        <p>
          This website is provided for informational and professional purposes,
          including showcasing work, sharing insights, and enabling communication.
        </p>
        <p>You agree to use this website only for lawful purposes and not to:</p>
        <ul>
          <li>Interfere with the operation of the site</li>
          <li>Attempt unauthorized access to systems or data</li>
          <li>Use the site in a way that could harm or disrupt its functionality</li>
        </ul>
      </section>

      <section>
        <h2>2. Intellectual Property</h2>
        <p>
          All content on this website, including text, graphics, code, and design,
          is owned by or licensed to Walbolt Digital, LLC unless otherwise noted.
        </p>
        <p>You may view and read content for personal or professional use.</p>
        <p>You may not copy, reproduce, or redistribute content without permission or use it for commercial purposes without consent.</p>
      </section>

      <section>
        <h2>3. Portfolio and Case Studies</h2>
        <p>
          Work displayed on this site may include projects completed for clients.
          Such work is presented for demonstration purposes only and may be subject
          to client ownership or licensing rights.
        </p>
      </section>

      <section>
        <h2>4. No Professional Advice</h2>
        <p>
          Content on this website is provided for informational purposes only and
          does not constitute professional, legal, or financial advice. You should
          not rely on this content as a substitute for professional guidance specific
          to your situation.
        </p>
      </section>

      <section>
        <h2>5. Third-Party Links</h2>
        <p>
          This website may include links to third-party websites or services. We are
          not responsible for their content, privacy practices, or terms of use.
          Accessing third-party sites is at your own risk.
        </p>
      </section>

      <section>
        <h2>6. Disclaimer of Warranties</h2>
        <p>
          This website is provided on an “as is” and “as available” basis. We make no
          warranties, express or implied, regarding the accuracy or completeness of
          content, the availability or reliability of the website, or the suitability
          of information for any purpose.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Walbolt Digital, LLC shall not be
          liable for any indirect, incidental, or consequential damages arising from
          your use of this website.
        </p>
      </section>

      <section>
        <h2>8. User Communications</h2>
        <p>
          If you contact us through this website, you agree not to submit unlawful,
          harmful, or abusive content. We may retain communications as necessary to
          respond and maintain records.
        </p>
      </section>

      <section>
        <h2>9. Changes to These Terms</h2>
        <p>
          We may update these Terms of Service from time to time. Updates will be
          posted on this page with a revised effective date. Your continued use of
          the site after changes are posted constitutes acceptance of the updated
          terms.
        </p>
      </section>

      <section>
        <h2>10. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Florida, United States,
          without regard to conflict of law principles.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          If you have questions about these Terms, email{" "}
          <a href="mailto:hello@walbolt.com">hello@walbolt.com</a> or write to
          Walbolt Digital, LLC in Tampa, Florida, United States.
        </p>
      </section>
    </LegalPage>
  );
}
