"use client";

// app/(dashboard)/layout.tsx
// Protected dashboard layout with role-based access control

import React, { useEffect, useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Spin } from "antd";
import {
  DashboardOutlined,
  ShopOutlined,
  MenuOutlined,
  UserOutlined,
  BarChartOutlined,
  MessageOutlined,
  AudioOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { MenuProps } from "antd";
import { getStoredUser, isSuperAdmin } from "@/lib/auth/permissions";
import { FileTextOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = getStoredUser();

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  // Check if current route requires Super Admin
  useEffect(() => {
    if (!user || loading) return;

    const superAdminOnlyRoutes = ["/admins"];
    const requiresSuperAdmin = superAdminOnlyRoutes.some((route) =>
      pathname.startsWith(route),
    );

    if (requiresSuperAdmin && !isSuperAdmin(user)) {
      router.push("/unauthorized");
    }
  }, [user, pathname, loading, router]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Also clear the cookie by calling logout API
    fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // User dropdown menu
  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => router.push("/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
      danger: true,
    },
    {
      key: "recordings",
      icon: <FileTextOutlined />,
      label: <Link href="/recordings">Recordings</Link>,
    },
  ];

  // Sidebar menu items - filtered by role
  const getMenuItems = (): MenuProps["items"] => {
    const baseItems: MenuProps["items"] = [
      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => router.push("/dashboard"),
      },
      {
        key: "/stores",
        icon: <ShopOutlined />,
        label: "Stores",
        onClick: () => router.push("/stores"),
      },
      {
        key: "/menus",
        icon: <MenuOutlined />,
        label: "Menus",
        onClick: () => router.push("/menus"),
      },
    ];

    // Add Super Admin only items
    if (isSuperAdmin(user)) {
      baseItems.push({
        key: "/admins",
        icon: <UserOutlined />,
        label: "Admins",
        onClick: () => router.push("/admins"),
      });
    }

    // Add remaining items available to all roles
    baseItems.push(
      {
        key: "/analytics",
        icon: <BarChartOutlined />,
        label: "Analytics",
        onClick: () => router.push("/analytics"),
      },
      {
        key: "/marketing",
        icon: <MessageOutlined />,
        label: "Marketing",
        onClick: () => router.push("/marketing"),
      },
      {
        key: "/recordings",
        icon: <AudioOutlined />,
        label: "Recordings",
        onClick: () => router.push("/recordings"),
      },
    );

    return baseItems;
  };

  // Show loading spinner while checking auth
  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: collapsed ? 24 : 20,
            color: "white",
            fontWeight: "bold",
          }}
        >
          {collapsed ? "🍽️" : "🍽️ Restaurant"}
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={getMenuItems()}
        />

        {/* Role Badge at Bottom */}
        {!collapsed && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              padding: 8,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              {isSuperAdmin(user) ? "👑 Super Admin" : "👤 Admin"}
            </Text>
          </div>
        )}
      </Sider>

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Text strong style={{ fontSize: 18 }}>
            Welcome back, {user?.email?.split("@")[0]}!
          </Text>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar
                style={{
                  backgroundColor: isSuperAdmin(user) ? "#722ed1" : "#1890ff",
                }}
                icon={<UserOutlined />}
              />
              <div>
                <Text>{user?.email}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isSuperAdmin(user) ? "Super Admin" : "Admin"}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
