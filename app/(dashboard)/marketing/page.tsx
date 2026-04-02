// app/(dashboard)/marketing/page.tsx
"use client";

import { Card, Typography, Alert, Tabs } from "antd";
import {
  InfoCircleOutlined,
  MessageOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function MarketingPage() {
  const items = [
    {
      key: "sms-campaigns",
      label: (
        <span>
          <MessageOutlined /> SMS Campaigns
        </span>
      ),
      children: (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="Feature Coming Soon"
          description={
            <div style={{ lineHeight: "1.8" }}>
              <p style={{ marginBottom: "12px" }}>
                SMS marketing campaigns will be available in a future update.
                This feature will allow you to:
              </p>
              <ul style={{ paddingLeft: "20px", margin: "12px 0" }}>
                <li>Create and schedule promotional SMS messages</li>
                <li>Send targeted campaigns to customer segments</li>
                <li>Track delivery rates and engagement metrics</li>
                <li>Manage opt-ins and opt-outs automatically</li>
                <li>Design message templates for common promotions</li>
              </ul>
              <p style={{ marginBottom: 0, color: "#666" }}>
                Stay tuned for powerful SMS marketing tools to help you engage
                with your customers!
              </p>
            </div>
          }
          style={{ maxWidth: "800px" }}
        />
      ),
    },
    {
      key: "scheduled-messages",
      label: (
        <span>
          <ScheduleOutlined /> Scheduled Messages
        </span>
      ),
      children: (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="Feature Coming Soon"
          description={
            <div style={{ lineHeight: "1.8" }}>
              <p style={{ marginBottom: "12px" }}>
                Advanced scheduling capabilities will be available soon. You
                will be able to:
              </p>
              <ul style={{ paddingLeft: "20px", margin: "12px 0" }}>
                <li>Schedule messages for optimal send times</li>
                <li>Set up recurring promotional campaigns</li>
                <li>Plan messages around special events and holidays</li>
                <li>Automate birthday and anniversary messages</li>
                <li>Preview and test messages before sending</li>
              </ul>
              <p style={{ marginBottom: 0, color: "#666" }}>
                Powerful automation tools to streamline your marketing efforts!
              </p>
            </div>
          }
          style={{ maxWidth: "800px" }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Marketing & SMS Campaigns
        </Title>
        <Typography.Text
          type="secondary"
          style={{ fontSize: "16px", marginTop: "8px", display: "block" }}
        >
          Promotional messaging and customer engagement tools
        </Typography.Text>
      </div>

      {/* Main Content Card */}
      <Card>
        <Tabs defaultActiveKey="sms-campaigns" items={items} type="card" />
      </Card>
    </div>
  );
}
