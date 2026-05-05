"use client";

/* Global error boundary for the App Router. Triggers when a server
   component throws (most commonly: missing Supabase env vars during
   the v1 → first-deploy debugging window). */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isMissingEnv = /Missing env vars|Invalid URL|NEXT_PUBLIC_SUPABASE/i.test(
    error.message ?? "",
  );

  return (
    <div
      style={{
        padding: "32px 20px",
        fontFamily: "-apple-system, system-ui, sans-serif",
        color: "#1A1F1E",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: "0 0 12px" }}>
        Не получилось загрузить страницу
      </h1>

      {isMissingEnv ? (
        <>
          <p style={{ color: "#6B7570", lineHeight: 1.5 }}>
            Не подхватились переменные окружения для подключения к базе.
          </p>
          <p style={{ color: "#6B7570", lineHeight: 1.5, marginTop: 12 }}>
            Открой <a href="/diag" style={{ color: "#0ABAB5", fontWeight: 500 }}>/diag</a> — там видно,
            каких именно переменных не хватает в Vercel.
          </p>
        </>
      ) : (
        <p style={{ color: "#6B7570", lineHeight: 1.5 }}>
          {error.message || "Неизвестная ошибка"}
        </p>
      )}

      <pre
        style={{
          marginTop: 24,
          padding: 12,
          background: "rgba(0,0,0,0.04)",
          borderRadius: 10,
          fontSize: 11,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: "#6B7570",
        }}
      >
        {error.message}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>

      <button
        onClick={reset}
        style={{
          marginTop: 20,
          padding: "12px 18px",
          borderRadius: 12,
          border: "none",
          background: "#0ABAB5",
          color: "white",
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Повторить
      </button>
    </div>
  );
}
