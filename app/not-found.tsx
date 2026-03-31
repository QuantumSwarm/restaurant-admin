// app/not-found.tsx
// 404 Not Found page for App Router

"use client";

import React from "react";
import { Result, Button } from "antd";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
        }
      />
    </div>
  );
}
