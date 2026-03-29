// components/admins/AdminModal.tsx
// FIXED: Removed unused restaurantEnabled state

"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  message,
  Divider,
  Space,
  Alert,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

interface AdminModalProps {
  visible: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSuccess: () => void;
  admin: any | null;
}

const AdminModal: React.FC<AdminModalProps> = ({
  visible,
  mode,
  onClose,
  onSuccess,
  admin,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  // FIXED: Removed unused restaurantEnabled state
  // const [restaurantEnabled, setRestaurantEnabled] = useState(false);

  useEffect(() => {
    if (visible && admin) {
      // Edit mode - populate form
      const role = admin.role || "admin";
      setSelectedRole(role);

      form.setFieldsValue({
        email: admin.email,
        role: role,
        companyName: admin.companyName,
        companyPhone: admin.companyPhone || "",
        companyAddress: admin.companyAddress || "",
        companyFax: admin.companyFax || "",
        companyUrl: admin.companyUrl || "",
        monthlyCost: admin.subscription?.plan?.monthlyCost || undefined,
        creditsLimit: admin.subscription?.plan?.creditsLimit || undefined,
        overageCost: admin.subscription?.plan?.overageCost || undefined,
        billingCycleDay: admin.subscription?.billingCycleDay || undefined,
        enableRestaurant: admin.subscription?.enableRestaurant || false,
        enableReports: admin.subscription?.enableReports || false,
        enableDownloadAudio: admin.subscription?.enableDownloadAudio || false,
        enableDownloadTranscription:
          admin.subscription?.enableDownloadTranscription || false,
        enableBulkSms: admin.subscription?.enableBulkSms || false,
        enableSmsConfirmation:
          admin.subscription?.enableSmsConfirmation || false,
      });
    } else if (visible) {
      // Create mode - reset form
      setSelectedRole("admin");
      form.resetFields();
      form.setFieldsValue({ role: "admin" });
    }
  }, [visible, admin, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = mode === "edit" ? `/api/admins/${admin.adminId}` : "/api/admins";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(
          mode === "edit" ? "Admin updated successfully" : "Admin created successfully"
        );
        onSuccess();
      } else {
        message.error(data.error || "Failed to save admin");
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error("Please check all required fields");
      } else {
        message.error("Failed to save admin");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  return (
    <Modal
      title={mode === "edit" ? "Edit Admin" : "Create New Admin"}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText={mode === "edit" ? "Update" : "Create"}
    >
      <Form form={form} layout="vertical">
        {/* Role Selection */}
        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select size="large" onChange={handleRoleChange}>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="super_admin">Super Admin</Select.Option>
          </Select>
        </Form.Item>

        {/* Email */}
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter valid email" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="admin@example.com"
            size="large"
            disabled={mode === "edit"}
          />
        </Form.Item>

        {/* Company Information */}
        <Divider orientation="left">
          <Space>
            <UserOutlined />
            Company Information
          </Space>
        </Divider>

        <Form.Item
          label="Company Name"
          name="companyName"
          rules={[{ required: true, message: "Please enter company name" }]}
        >
          <Input placeholder="Restaurant Name" size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Company Phone"
              name="companyPhone"
              rules={
                selectedRole === "admin"
                  ? [{ required: true, message: "Please enter company phone" }]
                  : []
              }
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+1 234 567 8900"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Company Fax" name="companyFax">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+1 234 567 8901"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Company Address"
          name="companyAddress"
          rules={
            selectedRole === "admin"
              ? [{ required: true, message: "Please enter company address" }]
              : []
          }
        >
          <Input
            prefix={<HomeOutlined />}
            placeholder="123 Main St, City, State, ZIP"
            size="large"
          />
        </Form.Item>

        <Form.Item label="Company Website" name="companyUrl">
          <Input
            prefix={<GlobalOutlined />}
            placeholder="https://example.com"
            size="large"
          />
        </Form.Item>

        {/* Subscription Settings - Only for Admin role */}
        {selectedRole === "admin" && (
          <>
            <Divider orientation="left">
              <Space>
                Subscription Settings
              </Space>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Monthly Cost"
                  name="monthlyCost"
                  rules={[
                    {
                      required: selectedRole === "admin",
                      message: "Please enter monthly cost",
                    },
                  ]}
                  tooltip="Amount charged monthly for this subscription"
                >
                  <InputNumber
                    placeholder="49.99"
                    prefix="$"
                    style={{ width: "100%" }}
                    size="large"
                    precision={2}
                    min={0}
                    step={1}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Credits Limit"
                  name="creditsLimit"
                  rules={[
                    {
                      required: selectedRole === "admin",
                      message: "Please enter credits limit",
                    },
                  ]}
                  tooltip="Number of credits included per billing cycle"
                >
                  <InputNumber
                    placeholder="1000"
                    style={{ width: "100%" }}
                    size="large"
                    min={0}
                    step={100}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Overage Cost (per 100 credits)"
                  name="overageCost"
                  rules={[
                    {
                      required: selectedRole === "admin",
                      message: "Please enter overage cost",
                    },
                  ]}
                  tooltip="Additional charge per 100 credits over the limit"
                >
                  <InputNumber
                    placeholder="5.00"
                    prefix="$"
                    style={{ width: "100%" }}
                    size="large"
                    precision={2}
                    min={0}
                    step={0.5}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Billing Cycle Day"
                  name="billingCycleDay"
                  rules={[
                    {
                      required: selectedRole === "admin",
                      message: "Please select billing day",
                    },
                  ]}
                  tooltip="Day of month when billing occurs (1-28)"
                >
                  <Select placeholder="Select day" size="large">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <Select.Option key={day} value={day}>
                        {day}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Feature Access</Divider>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  label="Restaurant Management"
                  name="enableRestaurant"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Reports" name="enableReports" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Download Audio"
                  name="enableDownloadAudio"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Download Transcription"
                  name="enableDownloadTranscription"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Bulk SMS"
                  name="enableBulkSms"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="SMS Confirmation"
                  name="enableSmsConfirmation"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* Super Admin Info Box */}
        {selectedRole === "super_admin" && (
          <>
            <Divider />
            <Alert
              message="Super Admin Account"
              description="Super Admins have full system access with no subscription required. Company phone and address are optional."
              type="info"
              showIcon
            />
          </>
        )}
      </Form>
    </Modal>
  );
};

export default AdminModal;