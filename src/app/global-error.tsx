"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="statusPage" id="main-content">
          <div className="statusCard">
            <p className="statusEyebrow">Global Error</p>
            <h1 className="statusTitle">The application hit a fatal error.</h1>
            <p className="statusDescription">
              Refresh and try again. If the issue persists, the route tree needs
              inspection before continuing.
            </p>
            <div className="statusActions">
              <button className="statusButton" onClick={reset} type="button">
                Retry
              </button>
              <Link className="statusButton statusButtonGhost" href="/">
                Return Home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
