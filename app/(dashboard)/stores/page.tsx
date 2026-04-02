"use client";

export const dynamic = "force-dynamic";

// app/(dashboard)/stores/page.tsx
// Stores list page with table

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import StoreModal from "@/components/stores/StoreModal";

const { Title } = Typography;
const { Search } = Input;

interface Store {
  storeId: number;
  address: string;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  isAiAgentEnabled: boolean;
  timeZone: string;
  isActive: boolean;
  restaurant: {
    restaurantId: number;
    name: string;
  };
  location: {
    locationId: number;
    name: string;
  };
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedStore, setSelectedStore] = useState<Store | undefined>();

  // Fetch stores
  const fetchStores = async (search = "") => {
    setLoading(true);
    try {
      const url = search
        ? `/api/stores?search=${encodeURIComponent(search)}`
        : "/api/stores";

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        setStores(data.stores);
      } else {
        messageApi.error(data.error || "Failed to fetch stores");
      }
    } catch (error) {
      console.error("Fetch stores error:", error);
      messageApi.error("An error occurred while fetching stores");
    } finally {
      setLoading(false);
    }
  };

  // Load stores on mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchStores(value);
  };

  // Handle delete
  const handleDelete = async (storeId: number) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        messageApi.success("Store deleted successfully");
        fetchStores(searchText); // Refresh list
      } else {
        messageApi.error(data.error || "Failed to delete store");
      }
    } catch (error) {
      console.error("Delete store error:", error);
      messageApi.error("An error occurred while deleting store");
    }
  };

  // Handle create
  const handleCreate = () => {
    setModalMode("create");
    setSelectedStore(undefined);
    setModalVisible(true);
  };

  // Handle edit
  const handleEdit = (store: Store) => {
    setModalMode("edit");
    setSelectedStore(store);
    setModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedStore(undefined);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    fetchStores(searchText); // Refresh list
  };

  // Table columns
  const columns: ColumnsType<Store> = [
    {
      title: "Restaurant",
      dataIndex: ["restaurant", "name"],
      key: "restaurant",
      width: 150,
    },
    {
      title: "Location",
      dataIndex: ["location", "name"],
      key: "location",
      width: 120,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Phone",
      dataIndex: "phonePrimary",
      key: "phone",
      width: 130,
      render: (phone) => phone || "-",
    },
    {
      title: "AI Agent",
      dataIndex: "isAiAgentEnabled",
      key: "aiAgent",
      width: 100,
      align: "center",
      render: (enabled: boolean) =>
        enabled ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Enabled
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            Disabled
          </Tag>
        ),
    },
    {
      title: "Time Zone",
      dataIndex: "timeZone",
      key: "timeZone",
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Store"
            description="Are you sure you want to delete this store?"
            onConfirm={() => handleDelete(record.storeId)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Stores
          </Title>
          <Typography.Text type="secondary">
            Manage your restaurant store locations
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Add Store
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search by address, phone, or location..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch("");
              }
            }}
            style={{ maxWidth: 400 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={stores}
          rowKey="storeId"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} stores`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Store Modal */}
      <StoreModal
        visible={modalVisible}
        mode={modalMode}
        store={selectedStore}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
