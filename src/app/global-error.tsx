"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root layout itself (rare — the root layout has
 * very little logic). Must render its own <html>/<body>: this replaces
 * the root layout entirely rather than nesting inside it, so none of the
 * normal chrome (fonts, providers) can be assumed to still be there.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Une erreur critique est survenue</h1>
          <p style={{ maxWidth: "20rem", fontSize: "0.875rem", color: "#666" }}>
            L&apos;application n&apos;a pas pu démarrer. Rechargez la page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
