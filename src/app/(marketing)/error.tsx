"use client";

import Link from "next/link";

export default function MarketingError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="statusPage" id="main-content">
      <div className="statusCard">
        <p className="statusEyebrow">Route Error</p>
        <h1 className="statusTitle">The page didn’t render cleanly.</h1>
        <p className="statusDescription">
          Something in the marketing shell failed while loading this route.
        </p>
        <div className="statusActions">
          <button className="statusButton" onClick={reset} type="button">
            Try Again
          </button>
          <Link className="statusButton statusButtonGhost" href="/">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
