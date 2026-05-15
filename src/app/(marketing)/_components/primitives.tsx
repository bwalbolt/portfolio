import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
  SVGProps,
} from "react";

import styles from "./primitives.module.css";

type WithClassName = {
  className?: string;
};

type ContainerProps<T extends ElementType> = WithClassName & {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

type LinkButtonProps = WithClassName & {
  ariaLabel?: string;
  children: ReactNode;
  external?: boolean;
  href: string;
  icon?: ReactNode;
  kind?: "gradient" | "text";
};

type SectionHeadingProps = WithClassName & {
  actionHref: string;
  actionLabel: string;
  actionLabelMobile?: string;
  title: string;
};

type IconProps = SVGProps<SVGSVGElement> & {
  name: "arrow" | "external" | "menu" | "paper-plane";
};

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...rest
}: ContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cx(styles.container, className)} {...rest}>
      {children}
    </Component>
  );
}

export function SectionHeading({
  actionHref,
  actionLabel,
  actionLabelMobile,
  className,
  title,
}: SectionHeadingProps) {
  return (
    <div className={cx(styles.sectionHeading, className)}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <Link className={styles.sectionAction} href={actionHref}>
        <span className={styles.actionLabelDesktop}>{actionLabel}</span>
        <span className={styles.actionLabelMobile}>
          {actionLabelMobile ?? actionLabel}
        </span>
      </Link>
    </div>
  );
}

export function LinkButton({
  ariaLabel,
  children,
  className,
  external = false,
  href,
  icon,
  kind = "gradient",
}: LinkButtonProps) {
  const sharedProps = external
    ? { rel: "noreferrer", target: "_blank" as const }
    : {};

  return (
    <Link
      aria-label={ariaLabel}
      className={cx(
        styles.linkButton,
        kind === "gradient" ? styles.linkButtonGradient : styles.linkButtonText,
        className,
      )}
      href={href}
      {...sharedProps}
    >
      <span>{children}</span>
      {icon ? <span className={styles.linkButtonIcon}>{icon}</span> : null}
    </Link>
  );
}

export function PanelCard<T extends ElementType = "article">({
  as,
  children,
  className,
  ...rest
}: ContainerProps<T>) {
  const Component = as ?? "article";

  return (
    <Component className={cx(styles.panelCard, className)} {...rest}>
      {children}
    </Component>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}

export function Icon({ className, name, ...rest }: IconProps) {
  switch (name) {
    case "arrow":
      return (
        <svg
          aria-hidden="true"
          className={cx(styles.icon, className)}
          fill="none"
          viewBox="0 0 16 16"
          {...rest}
        >
          <path
            d="M4.667 8h6.666M11.333 8 8.667 5.333M11.333 8l-2.666 2.667"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "external":
      return (
        <svg
          aria-hidden="true"
          className={cx(styles.icon, className)}
          fill="none"
          viewBox="0 0 24 24"
          {...rest}
        >
          <path
            d="M10 5H8.2c-1.12 0-1.68 0-2.108.218a2.5 2.5 0 0 0-.874.874C5 6.52 5 7.08 5 8.2v7.6c0 1.12 0 1.68.218 2.108a2.5 2.5 0 0 0 .874.874C6.52 19 7.08 19 8.2 19h7.6c1.12 0 1.68 0 2.108-.218a2.5 2.5 0 0 0 .874-.874C19 17.48 19 16.92 19 15.8V14M20 9V4m0 0h-5m5 0-7 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "menu":
      return (
        <svg
          aria-hidden="true"
          className={cx(styles.icon, className)}
          fill="none"
          viewBox="0 0 24 24"
          {...rest}
        >
          <path
            d="M3 17h18M3 12h18M3 7h18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "paper-plane":
      return (
        <svg
          aria-hidden="true"
          className={cx(styles.icon, className)}
          fill="none"
          viewBox="0 0 24 24"
          {...rest}
        >
          <path
            d="m10.308 13.692 4.846-4.846m4.957-2.958L16.021 19.183c-.367 1.192-.55 1.788-.867 1.985a1.44 1.44 0 0 1-.912.076c-.344-.143-.624-.701-1.181-1.816l-2.592-5.182a3.92 3.92 0 0 0-.192-.342 1.48 1.48 0 0 0-.181-.182c-.077-.059-.165-.103-.334-.187L4.572 10.94c-1.115-.558-1.673-.837-1.816-1.181a1.44 1.44 0 0 1 .075-.913c.198-.316.794-.5 1.986-.866l13.295-4.09c.936-.288 1.404-.432 1.72-.316.275.101.492.318.593.594.116.316-.028.784-.316 1.72Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
  }
}
