"use client";

export const dynamic = "force-dynamic";
// app/(dashboard)/profile/page.tsx
// User profile page with password change form

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Alert,
} from "antd";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth/permissions";

const { Title, Text } = Typography;

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = getStoredUser();
    setUser(userData);
  }, []);

  const onFinish = async (values: PasswordFormValues) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success("Password changed successfully! Please login again.");

        // Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        message.error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error("Please enter your new password"));
    }
    if (value.length < 8) {
      return Promise.reject(
        new Error("Password must be at least 8 characters"),
      );
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject(
        new Error("Password must contain at least one uppercase letter"),
      );
    }
    if (!/[a-z]/.test(value)) {
      return Promise.reject(
        new Error("Password must contain at least one lowercase letter"),
      );
    }
    if (!/[0-9]/.test(value)) {
      return Promise.reject(
        new Error("Password must contain at least one number"),
      );
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error("Please confirm your new password"));
    }
    if (value !== form.getFieldValue("newPassword")) {
      return Promise.reject(new Error("Passwords do not match"));
    }
    return Promise.resolve();
  };

  return (
    <div>
      <Title level={2}>Profile & Settings</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Manage your account settings and password
      </Text>

      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", maxWidth: 800 }}
      >
        {/* Account Information Card */}
        <Card title="Account Information" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>
                <MailOutlined /> Email:
              </Text>
              <br />
              <Text>{user?.email || "Loading..."}</Text>
            </div>
            <div>
              <Text strong>
                <UserOutlined /> Role:
              </Text>
              <br />
              <Text>
                {user?.role === "super_admin"
                  ? "ðŸ‘‘ Super Admin"
                  : "ðŸ‘¤ Admin"}
              </Text>
            </div>
          </Space>
        </Card>

        {/* Change Password Card */}
        <Card title="Change Password" bordered={false}>
          <Alert
            message="Password Requirements"
            description={
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                <li>At least 8 characters long</li>
                <li>Contains uppercase letter (A-Z)</li>
                <li>Contains lowercase letter (a-z)</li>
                <li>Contains number (0-9)</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form
            form={form}
            name="changePassword"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: "Please enter your current password",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter current password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[{ validator: validatePassword }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[{ validator: validateConfirmPassword }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<LockOutlined />}
                >
                  Change Password
                </Button>
                <Button
                  size="large"
                  onClick={() => form.resetFields()}
                  disabled={loading}
                >
                  Reset Form
                </Button>
              </Space>
            </Form.Item>
          </Form>

          <Alert
            message="Security Notice"
            description="You will be logged out automatically after changing your password and will need to login again with your new password."
            type="warning"
            showIcon
          />
        </Card>
      </Space>
    </div>
  );
}
