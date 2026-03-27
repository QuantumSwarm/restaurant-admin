// app/layout.tsx
// Root layout with Ant Design registry

import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { Providers } from "./providers";
import "./globals.css";

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
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
