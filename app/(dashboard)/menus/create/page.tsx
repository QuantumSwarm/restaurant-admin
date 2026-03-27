"use client";

import { useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Switch, Button, Card, Space } from "antd";
import { Create } from "@refinedev/antd";
import { useRouter } from "next/navigation";

const { TextArea } = Input;

export default function MenuCreate() {
  const router = useRouter();

  const { formProps, saveButtonProps } = useForm({
    resource: "menus",
    action: "create",
    redirect: "list",
  });

  // Get restaurants for dropdown
  const { selectProps: restaurantSelectProps } = useSelect({
    resource: "restaurants",
    optionLabel: "name",
    optionValue: "restaurantId",
  });

  // Get categories for dropdown
  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    optionLabel: "name",
    optionValue: "name", // Using name as value since category is stored as string
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Restaurant"
          name="restaurantId"
          rules={[
            {
              required: true,
              message: "Please select a restaurant",
            },
          ]}
        >
          <Select
            {...restaurantSelectProps}
            placeholder="Select restaurant"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Item Name"
          name="name"
          rules={[
            {
              required: true,
              message: "Please enter item name",
            },
          ]}
        >
          <Input placeholder="e.g., Margherita Pizza" size="large" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea
            rows={3}
            placeholder="Describe the menu item..."
            size="large"
          />
        </Form.Item>

        <Space style={{ width: "100%" }} size="large" direction="vertical">
          <Card title="Pricing" size="small">
            <Form.Item
              label="Base Price"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Please enter a price",
                },
                {
                  type: "number",
                  min: 0,
                  message: "Price must be a positive number",
                },
              ]}
            >
              <InputNumber
                prefix="$"
                placeholder="0.00"
                style={{ width: "100%" }}
                precision={2}
                min={0}
                size="large"
              />
            </Form.Item>
          </Card>

          <Card title="Categorization" size="small">
            <Form.Item
              label="Category"
              name="category"
              rules={[
                {
                  required: true,
                  message: "Please select a category",
                },
              ]}
            >
              <Select
                {...categorySelectProps}
                placeholder="Select category"
                size="large"
              />
            </Form.Item>
          </Card>

          <Card title="Options & Add-ons (JSON)" size="small">
            <Form.Item
              label="Sub Items / Options"
              name="subItems"
              extra="Format: {addons: [{name: 'Extra Cheese', price: 2.00}]}"
            >
              <TextArea
                rows={4}
                placeholder='{"addons": [{"name": "Extra Cheese", "price": 2.00}]}'
                size="large"
              />
            </Form.Item>
          </Card>

          <Card title="AI Integration" size="small">
            <Form.Item
              label="Upsell Prompt"
              name="upsellPrompt"
              extra="Text for AI to suggest this item or add-ons"
            >
              <TextArea
                rows={3}
                placeholder="Would you like to add extra toppings for just $2 more?"
                size="large"
              />
            </Form.Item>
          </Card>

          <Card title="Availability" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Form.Item
                label="Available"
                name="isAvailable"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>

              <Form.Item
                label="Out of Stock Handling"
                name="outOfStockHandling"
                extra="Instructions for AI when item is unavailable"
              >
                <TextArea
                  rows={2}
                  placeholder="Sorry, this item is currently unavailable. May I suggest..."
                  size="large"
                />
              </Form.Item>
            </Space>
          </Card>
        </Space>

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" {...saveButtonProps} size="large">
              Create Menu Item
            </Button>
            <Button size="large" onClick={() => router.push("/menus")}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Create>
  );
}
