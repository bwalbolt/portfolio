import Image from "next/image";
import Link from "next/link";

import {
  ABOUT_PARAGRAPHS,
  AVAILABILITY,
  CASE_STUDIES,
  CONTACT_COPY,
  CONTACT_SECTION_HREF,
  INSIGHTS,
  NAV_ITEMS,
  PORTRAIT,
  SKILLS,
  SOCIAL_LINKS,
  TESTIMONIAL,
  type AccentTone,
  type CaseStudyCard,
  type InsightCard,
} from "../_content/site-content";
import {
  Container,
  Icon,
  PanelCard,
  SectionHeading,
  VisuallyHidden,
  cx,
} from "./primitives";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import styles from "./homepage.module.css";

const toneClassNames: Record<AccentTone, string> = {
  blue: styles.toneBlue,
  orange: styles.toneOrange,
  pink: styles.tonePink,
  purple: styles.tonePurple,
};

function InsightPanel({ insight }: { insight: InsightCard }) {
  return (
    <PanelCard as="article" className={styles.insightCard}>
      <p className={styles.cardLead}>{insight.date}</p>
      <h3 className={styles.cardTitle}>{insight.title}</h3>
      <p className={styles.cardBody}>{insight.description}</p>
      <Link className={styles.readMore} href={insight.href}>
        <span>Read more</span>
        <Icon name="arrow" />
      </Link>
    </PanelCard>
  );
}

function CaseStudyPanel({ study }: { study: CaseStudyCard }) {
  return (
    <PanelCard
      as="article"
      className={cx(
        styles.caseCard,
        study.layout === "domino" ? styles.caseCardDomino : styles.caseCardPortfolio,
      )}
    >
      <div aria-hidden="true" className={styles.caseArtwork}>
        <div className={styles.caseArtworkPlate} />
        <Image
          alt=""
          className={cx(
            styles.caseArtworkDesktop,
            study.layout === "domino"
              ? styles.caseArtworkDominoDesktop
              : styles.caseArtworkPortfolioDesktop,
          )}
          sizes="(min-width: 48rem) 18rem, 11rem"
          src={study.artworkDesktop}
        />
        <Image
          alt=""
          className={cx(
            styles.caseArtworkMobile,
            study.layout === "domino"
              ? styles.caseArtworkDominoMobile
              : styles.caseArtworkPortfolioMobile,
          )}
          sizes="11rem"
          src={study.artworkMobile}
        />
      </div>

      <div className={styles.caseContent}>
        <h3 className={styles.cardTitle}>{study.title}</h3>
        <p className={styles.cardBody}>{study.description}</p>

        <ul className={styles.tagList}>
          {study.tags.map((tag) => (
            <li
              className={cx(styles.tag, toneClassNames[tag.tone])}
              key={`${study.title}-${tag.label}`}
            >
              {tag.label}
            </li>
          ))}
        </ul>

        <Link className={styles.readMore} href={study.href}>
          <span>Read more</span>
          <Icon name="arrow" />
        </Link>
      </div>
    </PanelCard>
  );
}

function SocialLinks() {
  return (
    <div className={styles.socialGroup}>
      <p className={styles.socialEyebrow}>Social Links</p>
      <ul className={styles.socialList}>
        {SOCIAL_LINKS.map((link) => (
          <li key={link.label}>
            <Link
              className={styles.socialLink}
              href={link.href}
              rel={link.external ? "noreferrer" : undefined}
              target={link.external ? "_blank" : undefined}
            >
              <span>{link.label}</span>
              <Icon name="external" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Homepage() {
  return (
    <div className={styles.page}>
      <SiteHeader contactHref={CONTACT_SECTION_HREF} items={NAV_ITEMS} overlay />

      <main id="main-content">
        <section className={styles.hero}>
          <div aria-hidden="true" className={styles.heroBackground} />
          <Container className={styles.heroInner}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroLine}>
                <span>Building </span>
                <span className={styles.heroHighlightBlue}>hand-crafted</span>
                <span> experiences,</span>
              </span>
              <span className={styles.heroLine}>
                <span>using </span>
                <span className={styles.heroHighlightPurple}>AI-accelerated</span>
                <span> workflows</span>
              </span>
            </h1>
            <p className={styles.heroScroll}>Scroll</p>
          </Container>
          <div aria-hidden="true" className={styles.heroCutaway} />
        </section>

        <div className={styles.sectionStack}>
          <section className={styles.section} id="insights">
            <Container>
              <SectionHeading
                actionHref="/blog"
                actionLabel="View All"
                title="Latest Insights"
              />

              <ul className={styles.insightGrid}>
                {INSIGHTS.map((insight) => (
                  <li
                    className={cx(
                      styles.insightGridItem,
                      !insight.visibleOnMobile && styles.desktopOnly,
                    )}
                    key={insight.slug}
                  >
                    <InsightPanel insight={insight} />
                  </li>
                ))}
              </ul>

              <Link className={styles.mobileViewAll} href="/blog">
                <span>View All Insights</span>
                <Icon name="arrow" />
              </Link>
            </Container>
          </section>

          <section className={styles.section} id="case-studies">
            <Container>
              <SectionHeading
                actionHref="/case-studies"
                actionLabel="View All"
                title="Case Studies"
              />

              <ul className={styles.caseGrid}>
                {CASE_STUDIES.map((study) => (
                  <li key={study.href}>
                    <CaseStudyPanel study={study} />
                  </li>
                ))}
              </ul>

              <Link className={styles.mobileViewAll} href="/case-studies">
                <span>View More Work</span>
                <Icon name="arrow" />
              </Link>
            </Container>
          </section>

          <section className={styles.aboutSection} id="about">
            <Container className={styles.aboutContainer}>
              <div className={styles.aboutIntro}>
                <div className={styles.portraitFrame}>
                  <Image
                    alt={PORTRAIT.alt}
                    className={styles.portraitImage}
                    sizes="(min-width: 48rem) 17rem, 14rem"
                    src={PORTRAIT.image}
                  />
                </div>

                <div className={styles.aboutCopy}>
                  <h2 className={styles.aboutTitle}>About Me</h2>
                  <div className={styles.aboutTextGroup}>
                    {ABOUT_PARAGRAPHS.map((paragraph) => (
                      <p className={styles.aboutText} key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <ul className={styles.skillGrid}>
                {SKILLS.map((skill) => (
                  <li key={skill.title}>
                    <PanelCard
                      as="article"
                      className={cx(styles.skillCard, toneClassNames[skill.tone])}
                    >
                      <h3 className={styles.skillTitle}>{skill.title}</h3>
                      <p className={styles.skillBody}>{skill.description}</p>
                    </PanelCard>
                  </li>
                ))}
              </ul>

              <figure className={styles.quoteBlock}>
                <blockquote className={styles.quoteText}>
                  “{TESTIMONIAL.quote}”
                </blockquote>
                <figcaption className={styles.quoteMeta}>
                  <Image
                    alt={`Portrait of ${TESTIMONIAL.attribution}`}
                    className={styles.quoteAvatar}
                    sizes="3rem"
                    src={TESTIMONIAL.image}
                  />
                  <div className={styles.quoteAttribution}>
                    <p className={styles.quoteName}>{TESTIMONIAL.attribution}</p>
                    <Link className={styles.quoteSource} href={TESTIMONIAL.href}>
                      <span>{TESTIMONIAL.source}</span>
                      <Icon name="external" />
                    </Link>
                  </div>
                </figcaption>
              </figure>
            </Container>
          </section>

          <section className={styles.contactSection} id="contact">
            <Container className={styles.contactLayout}>
              <form className={styles.contactForm}>
                <h2 className={styles.contactTitle}>{CONTACT_COPY.heading}</h2>

                <div className={styles.contactFieldGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="contact-name">
                      {CONTACT_COPY.nameLabel}
                    </label>
                    <input
                      className={styles.textField}
                      id="contact-name"
                      name="name"
                      placeholder={CONTACT_COPY.namePlaceholder}
                      type="text"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="contact-email">
                      {CONTACT_COPY.emailLabel}
                    </label>
                    <input
                      className={styles.textField}
                      id="contact-email"
                      name="email"
                      placeholder={CONTACT_COPY.emailPlaceholder}
                      type="email"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="contact-message">
                    {CONTACT_COPY.messageLabel}
                  </label>
                  <textarea
                    className={cx(styles.textField, styles.textareaField)}
                    id="contact-message"
                    name="message"
                    placeholder={CONTACT_COPY.messagePlaceholder}
                    rows={6}
                  />
                </div>

                <button
                  aria-describedby="contact-static-note"
                  className={styles.contactButton}
                  type="button"
                >
                  <span>{CONTACT_COPY.submitLabel}</span>
                  <Icon name="paper-plane" />
                </button>

                <VisuallyHidden>
                  <span id="contact-static-note">{CONTACT_COPY.staticNote}</span>
                </VisuallyHidden>
              </form>

              <aside className={styles.contactAside}>
                <SocialLinks />

                <PanelCard as="section" className={styles.availabilityCard}>
                  <div className={styles.availabilityHeader}>
                    <span className={styles.availabilityDot} />
                    <p className={styles.availabilityEyebrow}>
                      {AVAILABILITY.eyebrow}
                    </p>
                  </div>
                  <p className={styles.availabilityBody}>{AVAILABILITY.message}</p>
                </PanelCard>
              </aside>
            </Container>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
