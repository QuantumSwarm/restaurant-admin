"use client";

// app/(dashboard)/admins/page.tsx
// Admin management interface for Super Admins
// List all admins with subscription details, search, and filters

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Typography,
  message,
  Tooltip,
  Progress,
  Modal,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { confirm } = Modal;
import type { ColumnsType } from "antd/es/table";
import AdminModal from "@/components/admins/AdminModal";

const { Title, Text } = Typography;
const { Option } = Select;

interface Subscription {
  subscriptionId: number;
  stripeSubscriptionId: string;
  status: string;
  monthlyCost: number;
  creditsLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  overageCostPer100: number;
  billingCycleDay: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  features: {
    restaurant: boolean;
    reports: boolean;
    downloadAudio: boolean;
    downloadTranscription: boolean;
    bulkSms: boolean;
    smsConfirmation: boolean;
  };
  createdAt: string;
  canceledAt: string | null;
}

interface Admin {
  adminId: number;
  email: string;
  role: string;
  companyName: string;
  companyPhone: string;
  companyUrl: string;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
  subscription: Subscription | null;
}

export default function AdminsPage() {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  // Fetch admins from API
  const fetchAdmins = async (
    search?: string,
    status?: string,
    role?: string,
  ) => {
    setLoading(true);
    try {
      let url = "/api/admins?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (status) url += `status=${status}&`;
      if (role) url += `role=${role}&`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        setAdmins(data.admins || []);
      } else {
        messageApi.error(data.error || "Failed to fetch admins");
      }
    } catch (error) {
      console.error("Fetch admins error:", error);
      messageApi.error("An error occurred while fetching admins");
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchAdmins(value, statusFilter, roleFilter);
  };

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    fetchAdmins(searchText, value, roleFilter);
  };

  // Handle role filter
  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    fetchAdmins(searchText, statusFilter, value);
  };

  // Handle add admin
  const handleAddAdmin = () => {
    setModalMode("create");
    setSelectedAdmin(null);
    setModalVisible(true);
  };

  // Handle edit admin
  const handleEditAdmin = (admin: Admin) => {
    setModalMode("edit");
    setSelectedAdmin(admin);
    setModalVisible(true);
  };

  // Handle delete admin
  const handleDeleteAdmin = (admin: Admin) => {
    confirm({
      title: "Delete Admin Account?",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Are you sure you want to delete <strong>{admin.email}</strong>?
          </p>
          <p>This will:</p>
          <ul>
            <li>Deactivate the admin account (soft delete)</li>
            {admin.subscription && <li>Cancel their Stripe subscription</li>}
            <li>Send them a notification email</li>
          </ul>
          <p style={{ color: "#ff4d4f", marginTop: 16 }}>
            <strong>This action cannot be undone.</strong>
          </p>
        </div>
      ),
      okText: "Yes, Delete Admin",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          const response = await fetch(`/api/admins/${admin.adminId}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (response.ok && data.success) {
            messageApi.success("Admin deleted successfully");
            fetchAdmins(searchText, statusFilter, roleFilter);
          } else {
            messageApi.error(data.error || "Failed to delete admin");
          }
        } catch (error) {
          console.error("Delete admin error:", error);
          messageApi.error("An error occurred while deleting admin");
        }
      },
    });
  };

  // Render subscription status tag
  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      active: { color: "success", text: "Active" },
      trialing: { color: "processing", text: "Trial" },
      past_due: { color: "warning", text: "Past Due" },
      canceled: { color: "default", text: "Canceled" },
      incomplete: { color: "error", text: "Incomplete" },
    };

    const config = statusConfig[status] || { color: "default", text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Render role tag
  const renderRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string }> = {
      super_admin: { color: "red" },
      admin: { color: "blue" },
      nr_admin: { color: "purple" },
    };

    const config = roleConfig[role] || { color: "default" };
    const label = role.replace("_", " ").toUpperCase();
    return <Tag color={config.color}>{label}</Tag>;
  };

  // Render credit usage
  const renderCreditUsage = (subscription: Subscription | null) => {
    if (!subscription) {
      return <Text type="secondary">No subscription</Text>;
    }

    const percentage =
      (subscription.creditsUsed / subscription.creditsLimit) * 100;
    const isOverage = subscription.creditsUsed > subscription.creditsLimit;

    return (
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text strong>
            {subscription.creditsUsed.toLocaleString()} /{" "}
            {subscription.creditsLimit.toLocaleString()}
          </Text>
          {isOverage && <Tag color="warning">Overage</Tag>}
        </div>
        <Progress
          percent={Math.min(percentage, 100)}
          strokeColor={
            isOverage ? "#ff4d4f" : percentage > 80 ? "#faad14" : "#52c41a"
          }
          size="small"
          showInfo={false}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {subscription.creditsRemaining < 0
            ? `${Math.abs(
                subscription.creditsRemaining,
              ).toLocaleString()} over limit`
            : `${subscription.creditsRemaining.toLocaleString()} remaining`}
        </Text>
      </Space>
    );
  };

  // Render enabled features
  const renderFeatures = (subscription: any) => {
    if (!subscription) {
      return <Text type="secondary">—</Text>;
    }

    // Build features object from individual fields
    const features = {
      restaurant: subscription.featureRestaurant,
      reports: subscription.featureReports,
      audio: subscription.featureDownloadAudio,
      transcripts: subscription.featureDownloadTranscription,
      bulkSms: subscription.featureBulkSms,
      smsConfirmation: subscription.featureSmsConfirmation,
    };

    const enabledFeatures = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => {
        const labels: Record<string, string> = {
          restaurant: "Restaurant",
          reports: "Reports",
          audio: "Audio",
          transcripts: "Transcripts",
          bulkSms: "Bulk SMS",
          smsConfirmation: "SMS Confirmation",
        };
        return labels[feature] || feature;
      });

    if (enabledFeatures.length === 0) {
      return <Text type="secondary">None</Text>;
    }

    return (
      <Space size={[4, 4]} wrap>
        {enabledFeatures.map((feature) => (
          <Tag key={feature} color="green" icon={<CheckCircleOutlined />}>
            {feature}
          </Tag>
        ))}
      </Space>
    );
  };

  // Table columns
  const columns: ColumnsType<Admin> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      fixed: "left",
      render: (email: string, record: Admin) => (
        <Space direction="vertical" size="small">
          <Text strong>{email}</Text>
          {renderRoleTag(record.role)}
        </Space>
      ),
    },
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      width: 200,
      render: (companyName: string, record: Admin) => (
        <Space direction="vertical" size="small">
          <Text>{companyName || "N/A"}</Text>
          {record.companyPhone && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.companyPhone}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Subscription Status",
      key: "subscriptionStatus",
      width: 150,
      render: (_, record: Admin) => {
        if (!record.subscription) {
          return <Tag>No Subscription</Tag>;
        }
        return renderStatusTag(record.subscription.status);
      },
    },
    {
      title: "Monthly Cost",
      dataIndex: ["subscription", "monthlyCost"],
      key: "monthlyCost",
      render: (monthlyCost: any, record: any) => {
        if (!record.subscription) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Text strong style={{ color: "#52c41a" }}>
            ${Number(record.subscription.monthlyCost).toFixed(2)}
          </Text>
        );
      },
    },
    {
      title: "Credit Usage",
      dataIndex: ["subscription"],
      key: "creditUsage",
      render: (subscription: any) => {
        if (!subscription) {
          return <Text type="secondary">No subscription</Text>;
        }

        // Calculate remaining credits
        const creditsRemaining =
          subscription.creditsLimit - subscription.creditsUsed;
        const usagePercent = Math.round(
          (subscription.creditsUsed / subscription.creditsLimit) * 100,
        );

        return (
          <Space direction="vertical" size={0} style={{ width: "100%" }}>
            <Text strong>
              {subscription.creditsUsed.toLocaleString()} /{" "}
              {subscription.creditsLimit.toLocaleString()}
            </Text>
            <Progress
              percent={usagePercent}
              size="small"
              status={usagePercent > 90 ? "exception" : "normal"}
              showInfo={false}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {creditsRemaining < 0
                ? `${Math.abs(creditsRemaining).toLocaleString()} over limit`
                : `${creditsRemaining.toLocaleString()} remaining`}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Billing Cycle",
      key: "billingCycle",
      width: 120,
      render: (_, record: Admin) => {
        if (!record.subscription) return <Text type="secondary">—</Text>;
        return (
          <Tooltip
            title={`Next billing: ${new Date(
              record.subscription.nextBillingDate,
            ).toLocaleDateString()}`}
          >
            <Text>Day {record.subscription.billingCycleDay}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Enabled Features",
      dataIndex: ["subscription"],
      key: "features",
      render: (subscription: any) => renderFeatures(subscription),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record: Admin) => (
        <Space>
          <Tooltip title="Edit Admin">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditAdmin(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Admin">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAdmin(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Admin Management
          </Title>
          <Text type="secondary">Manage admin accounts and subscriptions</Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddAdmin}
        >
          Add Admin
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap style={{ width: "100%" }}>
          <Input
            placeholder="Search by email or company..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />

          <Select
            placeholder="Filter by status"
            style={{ width: 200 }}
            value={statusFilter || undefined}
            onChange={handleStatusFilter}
            allowClear
          >
            <Option value="active">Active</Option>
            <Option value="trialing">Trialing</Option>
            <Option value="past_due">Past Due</Option>
            <Option value="canceled">Canceled</Option>
            <Option value="incomplete">Incomplete</Option>
          </Select>

          <Select
            placeholder="Filter by role"
            style={{ width: 200 }}
            value={roleFilter || undefined}
            onChange={handleRoleFilter}
            allowClear
          >
            <Option value="super_admin">Super Admin</Option>
            <Option value="admin">Admin</Option>
          </Select>

          {(searchText || statusFilter || roleFilter) && (
            <Button
              onClick={() => {
                setSearchText("");
                setStatusFilter("");
                setRoleFilter("");
                fetchAdmins();
              }}
            >
              Clear Filters
            </Button>
          )}
        </Space>
      </Card>

      {/* Admin Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={admins}
          loading={loading}
          rowKey="adminId"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} admins`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Card>

      {/* Admin Modal */}
      <AdminModal
        visible={modalVisible}
        mode={modalMode}
        admin={selectedAdmin}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchAdmins(searchText, statusFilter, roleFilter);
        }}
      />
    </div>
  );
}
