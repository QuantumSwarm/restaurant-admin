// components/admins/AdminModal.tsx
// Admin Create/Edit Modal with Subscription Management

"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Typography,
  Divider,
  Alert,
  Row,
  Col,
  Tooltip,
  message,
} from "antd";
import {
  InfoCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface AdminModalProps {
  visible: boolean;
  mode: "create" | "edit";
  admin?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminModal({
  visible,
  mode,
  admin,
  onClose,
  onSuccess,
}: AdminModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [restaurantEnabled, setRestaurantEnabled] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  // Populate form when editing
  useEffect(() => {
    if (visible && mode === "edit" && admin) {
      setSelectedRole(admin.role);
      form.setFieldsValue({
        email: admin.email,
        role: admin.role,
        companyName: admin.companyName,
        companyAddress: admin.companyAddress,
        companyPhone: admin.companyPhone,
        companyFax: admin.companyFax,
        companyUrl: admin.companyUrl,
        // Subscription fields - only for regular admins
        monthlyCost: admin.subscription?.monthlyCost,
        creditsLimit: admin.subscription?.creditsLimit,
        overageCost: admin.subscription?.overageCostPer100,
        billingCycleDay: admin.subscription?.billingCycleDay,
        // Feature toggles - using camelCase field names from Prisma
        featureRestaurant: admin.subscription?.featureRestaurant,
        featureReports: admin.subscription?.featureReports,
        featureAudioDownload: admin.subscription?.featureDownloadAudio,
        featureTranscriptDownload: admin.subscription?.featureDownloadTranscription,
        featureBulkSms: admin.subscription?.featureBulkSms,
        featureSmsConfirmation: admin.subscription?.featureSmsConfirmation,
      });
      setRestaurantEnabled(admin.subscription?.featureRestaurant || false);
    } else if (visible && mode === "create") {
      setSelectedRole("admin");
      form.resetFields();
      // Set defaults for create mode
      form.setFieldsValue({
        role: "admin",
        billingCycleDay: 1,
        creditsLimit: 1000,
        overageCost: 5.0,
        // All features enabled by default
        featureRestaurant: true,
        featureReports: true,
        featureAudioDownload: true,
        featureTranscriptDownload: true,
        featureBulkSms: true,
        featureSmsConfirmation: true,
      });
      setRestaurantEnabled(true);
    }
  }, [visible, mode, admin, form]);

  // Handle "Restaurant" toggle change
  const handleRestaurantToggle = (checked: boolean) => {
    setRestaurantEnabled(checked);
  };

  // Handle role change
  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/admins" : `/api/admins/${admin?.adminId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        ...values,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success(
          mode === "create"
            ? "Admin created successfully. Welcome email sent!"
            : "Admin updated successfully. Notification email sent!"
        );
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(data.error || `Failed to ${mode} admin`);
      }
    } catch (error) {
      console.error(`${mode} admin error:`, error);
      message.error(`An error occurred while ${mode === "create" ? "creating" : "updating"} admin`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          {mode === "create" ? "Add New Admin" : "Edit Admin"}
        </Space>
      }
      open={visible}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={mode === "create" ? "Create Admin" : "Update Admin"}
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Alert
          message={
            mode === "create"
              ? "A temporary password will be auto-generated and sent via email"
              : "Subscription changes will be synced with Stripe"
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Divider orientation="left">
          <Space>
            <UserOutlined />
            Admin Details
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            {/* Email */}
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                placeholder="admin@restaurant.com"
                size="large"
                disabled={mode === "edit"}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Role */}
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: "Please select role" }]}
            >
              <Select 
                size="large" 
                placeholder="Select role"
                onChange={handleRoleChange}
              >
                <Select.Option value="admin">Admin</Select.Option>
                <Select.Option value="super_admin">Super Admin</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <Space>
            <BankOutlined />
            Company Information
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            {/* Company Name */}
            <Form.Item
              label="Company Name"
              name="companyName"
              rules={[
                { required: true, message: "Please enter company name" },
                { max: 200, message: "Company name must be 200 characters or less" },
              ]}
            >
              <Input placeholder="e.g., Caravan Restaurant Group" size="large" />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Company Phone */}
            <Form.Item
              label="Company Phone"
              name="companyPhone"
              rules={[
                { max: 20, message: "Phone must be 20 characters or less" },
              ]}
            >
              <Input placeholder="(555) 123-4567" size="large" />
            </Form.Item>
          </Col>
        </Row>

        {/* Company Address */}
        <Form.Item
          label="Company Address"
          name="companyAddress"
          rules={[
            { max: 500, message: "Address must be 500 characters or less" },
          ]}
        >
          <Input.TextArea
            placeholder="123 Main St, City, State, ZIP"
            rows={2}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            {/* Company Fax */}
            <Form.Item
              label="Company Fax (Optional)"
              name="companyFax"
              rules={[
                { max: 20, message: "Fax must be 20 characters or less" },
              ]}
            >
              <Input placeholder="(555) 123-4568" size="large" />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Company URL */}
            <Form.Item
              label="Company Website (Optional)"
              name="companyUrl"
              rules={[
                { type: "url", message: "Please enter a valid URL" },
                { max: 255, message: "URL must be 255 characters or less" },
              ]}
            >
              <Input placeholder="https://restaurant.com" size="large" />
            </Form.Item>
          </Col>
        </Row>

        {/* Subscription Settings - Only for Admin role */}
        {selectedRole === "admin" && (
          <>
            <Divider orientation="left">
              <Space>
                <DollarOutlined />
                Subscription Settings
              </Space>
            </Divider>

            <Row gutter={16}>
          <Col span={12}>
            {/* Monthly Cost */}
            <Form.Item
              label="Monthly Cost"
              name="monthlyCost"
              rules={[
                { required: true, message: "Please enter monthly cost" },
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
            {/* Credits Limit */}
            <Form.Item
              label="Credits Limit"
              name="creditsLimit"
              rules={[
                { required: true, message: "Please enter credits limit" },
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
            {/* Overage Cost */}
            <Form.Item
              label="Overage Cost (per 100 credits)"
              name="overageCost"
              rules={[
                { required: true, message: "Please enter overage cost" },
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
            {/* Billing Cycle Day */}
            <Form.Item
              label="Billing Cycle Day"
              name="billingCycleDay"
              rules={[
                { required: true, message: "Please select billing day" },
              ]}
              tooltip="Day of the month when billing occurs (1-28)"
            >
              <InputNumber
                placeholder="1"
                style={{ width: "100%" }}
                size="large"
                min={1}
                max={28}
                step={1}
              />
            </Form.Item>
          </Col>
        </Row>
          </>
        )}

        {/* Info message for Super Admin */}
        {selectedRole === "super_admin" && (
          <Alert
            message="Super Admins have full system access with no subscription required"
            description="All features are automatically enabled for Super Admin accounts."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}

        {/* Feature Access - Only for Admin role */}
        {selectedRole === "admin" && (
          <>
            <Divider orientation="left">
              <Space>
                <SettingOutlined />
                Feature Access
              </Space>
            </Divider>

        <Alert
          message="Enable or disable specific features for this admin"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            {/* Restaurant Feature */}
            <Form.Item
              label="Restaurant Management"
              name="featureRestaurant"
              valuePropName="checked"
              tooltip="Enables restaurant and store management (includes menu CRUD)"
            >
              <Switch
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
                onChange={handleRestaurantToggle}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Reports Feature */}
            <Form.Item
              label="Reports & Analytics"
              name="featureReports"
              valuePropName="checked"
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Audio Download Feature */}
            <Form.Item
              label="Download Audio Recordings"
              name="featureAudioDownload"
              valuePropName="checked"
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Transcript Download Feature */}
            <Form.Item
              label="Download Transcriptions"
              name="featureTranscriptDownload"
              valuePropName="checked"
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Bulk SMS Feature */}
            <Form.Item
              label="Bulk SMS Campaigns"
              name="featureBulkSms"
              valuePropName="checked"
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* SMS Confirmation Feature */}
            <Form.Item
              label="SMS Order Confirmation"
              name="featureSmsConfirmation"
              valuePropName="checked"
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>
        </Row>
          </>
        )}

        {mode === "create" && selectedRole === "admin" && (
          <Alert
            message={
              <Space direction="vertical" size={0}>
                <Text strong>What happens next:</Text>
                <Text>• Admin account will be created with auto-generated password</Text>
                <Text>• Stripe subscription will be set up</Text>
                <Text>• Welcome email with login credentials will be sent</Text>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {mode === "create" && selectedRole === "super_admin" && (
          <Alert
            message={
              <Space direction="vertical" size={0}>
                <Text strong>What happens next:</Text>
                <Text>• Super Admin account will be created with auto-generated password</Text>
                <Text>• Full system access will be granted automatically</Text>
                <Text>• Welcome email with login credentials will be sent</Text>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
}
