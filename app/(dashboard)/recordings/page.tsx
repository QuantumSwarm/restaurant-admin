// app/(dashboard)/recordings/page.tsx
// FIXED: Removed unused imports

"use client";

import React, { useState } from "react";
import {
  Card,
  Tabs,
  Typography,
  Space,
  Alert,
} from "antd";
import {
  SoundOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { TabPane } = Tabs;

export default function RecordingsPage() {
  const [activeTab, setActiveTab] = useState("audio");

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Recordings & Transcriptions</Title>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Space>
                <SoundOutlined />
                Audio Recordings
              </Space>
            }
            key="audio"
          >
            <Alert
              message="Feature Coming Soon"
              description="Audio recording downloads will be available in a future update. This feature allows you to download conversation recordings for quality assurance and training purposes."
              type="info"
              showIcon
            />
          </TabPane>

          <TabPane
            tab={
              <Space>
                <FileTextOutlined />
                Transcriptions
              </Space>
            }
            key="transcriptions"
          >
            <Alert
              message="Feature Coming Soon"
              description="Transcription downloads will be available in a future update. This feature allows you to download text transcripts of customer conversations for analysis and record-keeping."
              type="info"
              showIcon
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}