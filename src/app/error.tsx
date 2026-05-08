"use client";

/* Generic error boundary — keeps the app from crashing into Vercel's
   default 500 page when a server component throws. */

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        padding: "32px 20px",
        maxWidth: 460,
        margin: "0 auto",
        color: "var(--text)",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
        {t("common.err_title")}
      </h1>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.55, fontSize: 14 }}>
        {error.message || t("common.err_unknown")}
      </p>
      <button
        onClick={reset}
        className="tap"
        style={{
          marginTop: 20,
          padding: "12px 18px",
          borderRadius: 12,
          border: "none",
          background: "var(--accent)",
          color: "white",
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
