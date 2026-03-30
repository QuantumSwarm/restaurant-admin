// app/(dashboard)/admins/page.tsx
// FIXED: All TypeScript errors resolved

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  message,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import AdminModal from "@/components/admins/AdminModal";

const { Title } = Typography;

interface Admin {
  adminId: number;
  email: string;
  role: string;
  companyName: string;
  companyPhone?: string;
  companyAddress?: string;
  companyFax?: string;
  companyUrl?: string;
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: string;
  subscription?: {
    subscriptionId: number;
    planId: number;
    status: string;
    creditsUsed: number;
    billingCycleDay: number;
    plan: {
      planId: number;
      name: string;
      monthlyCost: number;
      creditsLimit: number;
      overageCost: number;
    };
    enableRestaurant: boolean;
    enableReports: boolean;
    enableDownloadAudio: boolean;
    enableDownloadTranscription: boolean;
    enableBulkSms: boolean;
    enableSmsConfirmation: boolean;
  };
}

interface Stats {
  total: number;
  active: number;
  admins: number;
  superAdmins: number;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [searchText, setSearchText] = useState("");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    admins: 0,
    superAdmins: 0,
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);

      const response = await fetch(`/api/admins?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAdmins(data.admins);
        setStats(data.stats);
      } else {
        message.error(data.error || "Failed to fetch admins");
      }
    } catch (error) {
      message.error("Failed to fetch admins");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.success) {
        setCurrentUserEmail(data.user.email);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCurrentUser();
  }, [fetchAdmins]);

  const handleDelete = async (adminId: number) => {
    try {
      const response = await fetch(`/api/admins/${adminId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        message.success("Admin deleted successfully");
        fetchAdmins();
      } else {
        message.error(data.error || "Failed to delete admin");
      }
    } catch (error) {
      message.error("Failed to delete admin");
      console.error(error);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedAdmin(null);
  };

  const handleModalSuccess = () => {
    fetchAdmins();
    handleModalClose();
  };

  // FIXED: Proper ColumnsType with correct onFilter type
  const columns: ColumnsType<Admin> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "super_admin" ? "gold" : "blue"}>
          {role === "super_admin" ? "Super Admin" : "Admin"}
        </Tag>
      ),
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Super Admin", value: "super_admin" },
      ],
      // FIXED: Correct type for onFilter - value is React.Key (string | number)
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
      filters: [
        { text: "Active", value: "true" },
        { text: "Inactive", value: "false" },
      ],
      // FIXED: Compare as string since filter values are strings
      onFilter: (value, record) => String(record.isActive) === value,
    },
    {
      title: "Subscription",
      key: "subscription",
      render: (record: Admin) => {
        if (record.role === "super_admin") {
          return <Tag>N/A</Tag>;
        }
        if (!record.subscription) {
          return <Tag color="red">No Subscription</Tag>;
        }
        return (
          <Space direction="vertical" size="small">
            <Tag color={record.subscription.status === "active" ? "green" : "orange"}>
              {record.subscription.status}
            </Tag>
            <span style={{ fontSize: "12px" }}>
              Credits: {record.subscription.creditsUsed}/{record.subscription.plan.creditsLimit}
            </span>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Admin) => {
        const isSelf = record.email === currentUserEmail;

        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedAdmin(record);
                setModalMode("edit");
                setModalVisible(true);
              }}
            >
              Edit
            </Button>
            {isSelf ? (
              <Button type="link" danger disabled title="You cannot delete your own account">
                Delete
              </Button>
            ) : (
              <Popconfirm
                title="Delete Admin"
                description={
                  <div style={{ maxWidth: 300 }}>
                    <p>
                      Are you sure you want to delete <strong>{record.email}</strong>?
                    </p>
                    <p style={{ marginBottom: 0 }}>
                      This will:
                      <br />
                      â€¢ Deactivate the account
                      <br />
                      â€¢ Cancel their subscription
                      <br />â€¢ Send a notification email
                    </p>
                  </div>
                }
                onConfirm={() => handleDelete(record.adminId)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Admin Management
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => {
            setSelectedAdmin(null);
            setModalMode("create");
            setModalVisible(true);
          }}
        >
          Add Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Admins"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Admins" value={stats.admins} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Super Admins" value={stats.superAdmins} />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%" }} direction="vertical">
          <Input
            placeholder="Search by email or company name..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => fetchAdmins()}
            style={{ width: 400 }}
            size="large"
            allowClear
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={admins}
          rowKey="adminId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} admins`,
          }}
        />
      </Card>

      {/* Modal - FIXED: Added mode prop */}
      <AdminModal
        visible={modalVisible}
        mode={modalMode}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        admin={selectedAdmin}
      />
    </div>
  );
}