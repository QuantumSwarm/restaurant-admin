// components/menus/MenuModal.tsx
// UPDATED: Added store-specific toggles for assignment and availability

"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Space,
  Typography,
  Divider,
  Alert,
} from "antd";
import { InfoCircleOutlined, ShopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { confirm } = Modal;
const { TextArea } = Input;
const { Text } = Typography;

interface MenuModalProps {
  visible: boolean;
  mode: "create" | "edit";
  menu?: any;
  storeId: number | null;
  restaurantId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  categoryId: number;
  name: string;
}

interface Store {
  storeId: number;
  displayName: string;
}

export default function MenuModal({
  visible,
  mode,
  menu,
  storeId,
  restaurantId,
  onClose,
  onSuccess,
}: MenuModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [offeredAtStore, setOfferedAtStore] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (response.ok && data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  // Fetch current store info
  const fetchStoreInfo = async () => {
    if (!storeId) return;
    
    try {
      const response = await fetch(`/api/stores?format=dropdown`);
      const data = await response.json();

      if (response.ok && data.success) {
        const store = data.stores.find((s: any) => s.storeId === storeId);
        if (store) {
          setCurrentStore(store);
        }
      }
    } catch (error) {
      console.error("Fetch store info error:", error);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      fetchCategories();
      fetchStoreInfo();
    }
  }, [visible, storeId]);

  // Populate form when editing
  useEffect(() => {
    if (visible && mode === "edit" && menu) {
      form.setFieldsValue({
        name: menu.name,
        description: menu.description,
        categoryId: menu.categoryId,
        basePrice: menu.basePrice,
        imageUrl: menu.imageUrl,
        calories: menu.calories,
        isActive: menu.isActive,
        // Store-specific fields
        offeredAtStore: menu.isAssignedToStore,
        inStock: menu.isAvailableAtStore,
      });
      
      // Track if item is offered at this store
      setOfferedAtStore(menu.isAssignedToStore);
    } else if (visible && mode === "create") {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        offeredAtStore: true, // Default: offer at current store
        inStock: true, // Default: in stock
      });
      setOfferedAtStore(true);
    }
  }, [visible, mode, menu, form]);

  // Handle "Offered at Store" toggle change
  const handleOfferedAtStoreChange = (checked: boolean) => {
    setOfferedAtStore(checked);
    
    // If not offered, automatically set in stock to false
    if (!checked) {
      form.setFieldValue('inStock', false);
    }
  };

  // Handle "Active Status" toggle change with confirmation
  const handleActiveStatusChange = (checked: boolean) => {
    // If turning OFF, show confirmation
    if (!checked) {
      confirm({
        title: 'Deactivate Menu Item?',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>This will deactivate <strong>"{menu?.name || 'this item'}"</strong> for ALL stores in your restaurant.</p>
            <p>Customers will not be able to order this item from any location.</p>
          </div>
        ),
        okText: 'Yes, Deactivate All',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          form.setFieldValue('isActive', false);
        },
        onCancel() {
          // Keep it checked (do nothing)
        },
      });
    } else {
      // Turning ON - no confirmation needed
      form.setFieldValue('isActive', true);
    }
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/menus"
          : `/api/menus/${menu?.templateId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const payload =
        mode === "create"
          ? {
              ...values,
              restaurantId: restaurantId,
              storeId: storeId,
              assignToStore: values.offeredAtStore, // Use the toggle value
            }
          : {
              ...values,
              storeId: storeId, // Pass store ID for assignment management
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
            ? "Menu item created successfully"
            : "Menu item updated successfully"
        );
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(data.error || `Failed to ${mode} menu item`);
      }
    } catch (error) {
      console.error(`${mode} menu item error:`, error);
      message.error(`An error occurred while ${mode === "create" ? "creating" : "updating"} menu item`);
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
      title={mode === "create" ? "Add Menu Item" : "Edit Menu Item"}
      open={visible}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText={mode === "create" ? "Create" : "Update"}
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Name */}
        <Form.Item
          label="Item Name"
          name="name"
          rules={[
            { required: true, message: "Please enter item name" },
            { max: 100, message: "Name must be 100 characters or less" },
          ]}
        >
          <Input placeholder="e.g., Chicken Tikka Masala" size="large" />
        </Form.Item>

        {/* Description */}
        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 500, message: "Description must be 500 characters or less" },
          ]}
        >
          <TextArea
            placeholder="Describe the dish..."
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* Category */}
        <Form.Item
          label="Category"
          name="categoryId"
          tooltip="Select a category to organize your menu"
        >
          <Select
            placeholder="Select category"
            allowClear
            size="large"
            loading={categories.length === 0}
          >
            {categories.map((cat) => (
              <Select.Option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Base Price */}
        <Form.Item
          label="Base Price"
          name="basePrice"
          rules={[
            { required: true, message: "Please enter base price" },
            {
              validator: (_, value) => {
                if (value && value > 0) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Price must be greater than 0"));
              },
            },
          ]}
          tooltip="This is the default price. You can override it for specific stores later."
        >
          <InputNumber
            placeholder="0.00"
            prefix="$"
            style={{ width: "100%" }}
            size="large"
            precision={2}
            min={0.01}
            step={0.01}
          />
        </Form.Item>

        {/* Calories */}
        <Form.Item
          label="Calories (Optional)"
          name="calories"
          rules={[
            {
              type: "number",
              min: 0,
              message: "Calories must be 0 or greater",
            },
          ]}
        >
          <InputNumber
            placeholder="e.g., 450"
            style={{ width: "100%" }}
            size="large"
            min={0}
            step={10}
          />
        </Form.Item>

        {/* Image URL */}
        <Form.Item
          label="Image URL (Optional)"
          name="imageUrl"
          rules={[
            { type: "url", message: "Please enter a valid URL" },
            { max: 500, message: "URL must be 500 characters or less" },
          ]}
          tooltip="URL to an image of the dish"
        >
          <Input
            placeholder="https://example.com/image.jpg"
            size="large"
          />
        </Form.Item>

        <Divider orientation="left">Restaurant-Wide Settings</Divider>

        {/* Active Status (Restaurant-wide) */}
        <Form.Item
          label="Active Status (All Stores)"
          name="isActive"
          valuePropName="checked"
          tooltip="Inactive items won't be visible in any store's menu"
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive"
            onChange={handleActiveStatusChange}
          />
        </Form.Item>

        {/* Store-Specific Section */}
        {currentStore && (
          <>
            <Divider orientation="left">
              <Space>
                <ShopOutlined />
                Store-Specific Settings
              </Space>
            </Divider>

            <Alert
              message={`Managing: ${currentStore.displayName}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Toggle A: Offered at Store */}
            <Form.Item
              label="Offer at This Store"
              name="offeredAtStore"
              valuePropName="checked"
              tooltip="Controls whether this item is offered at the selected store"
            >
              <Switch
                checkedChildren="Offered"
                unCheckedChildren="Not Offered"
                onChange={handleOfferedAtStoreChange}
              />
            </Form.Item>

            {/* Toggle B: In Stock */}
            <Form.Item
              label="Stock Status"
              name="inStock"
              valuePropName="checked"
              tooltip="Controls whether this item is currently available (in stock)"
            >
              <Switch
                checkedChildren="Available"
                unCheckedChildren="Out of Stock"
                disabled={!offeredAtStore}
              />
            </Form.Item>

            {!offeredAtStore && (
              <Alert
                message="Item must be offered at this store before setting stock status"
                type="warning"
                showIcon
                style={{ marginTop: -8, marginBottom: 16 }}
              />
            )}
          </>
        )}

        {mode === "create" && (
          <Text type="secondary">
            <InfoCircleOutlined /> You can manage assignments for other stores after creating this item.
          </Text>
        )}
      </Form>
    </Modal>
  );
}
