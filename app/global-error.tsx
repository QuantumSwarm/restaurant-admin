// app/global-error.tsx
// CRITICAL: This replaces Next.js default error pages completely

"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "48px", margin: "0 0 16px 0" }}>500</h1>
          <h2 style={{ fontSize: "24px", margin: "0 0 24px 0" }}>
            Something went wrong
          </h2>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
