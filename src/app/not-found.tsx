import Link from "next/link";

export default function NotFound() {
  return (
    <main className="statusPage" id="main-content">
      <div className="statusCard">
        <p className="statusEyebrow">404</p>
        <h1 className="statusTitle">That route does not exist.</h1>
        <p className="statusDescription">
          The destination might be unpublished, renamed, or still waiting on
          content.
        </p>
        <div className="statusActions">
          <Link className="statusButton" href="/">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
