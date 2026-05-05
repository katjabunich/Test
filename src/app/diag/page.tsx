/* Diagnostic page — visible in production. Shows whether env vars are set
   without revealing secret values. Safe because anon keys are public anyway,
   and we only show the first/last few chars. Remove after debugging. */

export const dynamic = "force-dynamic";

export default async function DiagPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  const rows: { name: string; status: "ok" | "missing" | "weird"; detail: string }[] = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      status: !url ? "missing" : url.startsWith("https://") && url.endsWith(".supabase.co") ? "ok" : "weird",
      detail: url
        ? `length ${url.length} · «${url.slice(0, 20)}…${url.slice(-15)}»`
        : "значение не задано",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: !key ? "missing" : key.length > 20 ? "ok" : "weird",
      detail: key
        ? `length ${key.length} · «${key.slice(0, 8)}…${key.slice(-6)}»`
        : "значение не задано",
    },
    {
      name: "NODE_ENV",
      status: "ok",
      detail: nodeEnv ?? "—",
    },
    {
      name: "VERCEL_ENV",
      status: "ok",
      detail: vercelEnv ?? "—",
    },
  ];

  // Try a real Supabase fetch to see what error (if any) actually occurs.
  let probeResult: string;
  try {
    if (!url || !key) {
      probeResult = "skipped (env vars missing)";
    } else {
      const res = await fetch(`${url}/rest/v1/spheres?select=id&limit=1`, {
        headers: {
          apikey: key,
          authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      });
      probeResult = `HTTP ${res.status} ${res.statusText}`;
      if (!res.ok) {
        const text = await res.text();
        probeResult += ` — ${text.slice(0, 200)}`;
      } else {
        const data = await res.json();
        probeResult += ` — got ${Array.isArray(data) ? data.length : "?"} rows`;
      }
    }
  } catch (e) {
    probeResult = `threw: ${e instanceof Error ? e.message : String(e)}`;
  }

  return (
    <div style={{ padding: "20px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 16px" }}>
        Diagnostics
      </h1>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--hairline)" }}>Variable</th>
            <th style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--hairline)" }}>Status</th>
            <th style={{ textAlign: "left", padding: "6px 4px", borderBottom: "1px solid var(--hairline)" }}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td style={{ padding: "6px 4px", verticalAlign: "top", fontFamily: "monospace" }}>{r.name}</td>
              <td style={{ padding: "6px 4px", verticalAlign: "top", color: r.status === "ok" ? "#0A7A55" : r.status === "missing" ? "#C46E5A" : "#D9994E" }}>
                {r.status === "ok" ? "✓ OK" : r.status === "missing" ? "✗ MISSING" : "? WEIRD"}
              </td>
              <td style={{ padding: "6px 4px", verticalAlign: "top", fontFamily: "monospace", wordBreak: "break-all" }}>{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
          Probe (fetch spheres)
        </div>
        <pre
          style={{
            marginTop: 8,
            padding: 12,
            background: "rgba(0,0,0,0.04)",
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {probeResult}
        </pre>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-muted)" }}>
        Эта страница временная — нужна для диагностики деплоя. Уберу когда всё заработает.
      </p>
    </div>
  );
}
