"use client";

// app/(dashboard)/dashboard/page.tsx
// Dashboard home page with stats overview
export const dynamic = "force-dynamic";

import React from "react";

import { Card, Col, Row, Statistic, Typography } from "antd";
import {
  ShopOutlined,
  MenuOutlined,
  DollarOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function DashboardPage() {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <p style={{ color: "#8c8c8c", marginBottom: 24 }}>
        Welcome to your Restaurant Admin Panel
      </p>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Stores"
              value={0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Menu Items"
              value={0}
              prefix={<MenuOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Revenue"
              value={0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="AI Calls Today"
              value={0}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Welcome Card */}
      <Card style={{ marginTop: 24 }} title="ðŸŽ‰ Welcome to Restaurant Admin">
        <p>Your admin panel is now set up! Here's what you can do:</p>
        <ul>
          <li>&#10004;&#65039; Manage your restaurant stores and locations</li>
          <li>&#10004;&#65039; Create and edit menu items</li>
          <li>&#10004;&#65039; View analytics and reports</li>
          <li>&#10004;&#65039; Send bulk SMS campaigns</li>
          <li>&#10004;&#65039; Access AI conversation recordings</li>
        </ul>
        <p style={{ marginTop: 16, color: "#8c8c8c" }}>
          <strong>Next steps:</strong> Start by adding your first store in the
          Stores section.
        </p>
      </Card>
    </div>
  );
}
