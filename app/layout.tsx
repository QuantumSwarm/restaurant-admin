// app/layout.tsx
// Root layout with Ant Design registry
// FIXED: Force dynamic rendering to prevent pre-render errors

import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import "./globals.css";

// CRITICAL: Force all pages to be dynamic (no static pre-rendering)
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const metadata = {
  title: "Restaurant Admin Panel",
  description: "Manage your restaurant operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#1890ff",
                borderRadius: 6,
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
