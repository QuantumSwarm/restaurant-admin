"use client";

import { useShow, useOne } from "@refinedev/core";
import { Show, NumberField, TextField } from "@refinedev/antd";
import { Typography, Descriptions, Tag, Card, Alert } from "antd";
import { useParams } from "next/navigation";

const { Title } = Typography;

export default function MenuShow() {
  const params = useParams();
  const { queryResult } = useShow({
    resource: "menus",
    id: params?.id as string,
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  // Get restaurant details
  const { data: restaurantData } = useOne({
    resource: "restaurants",
    id: record?.restaurantId,
    queryOptions: {
      enabled: !!record?.restaurantId,
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const parseSubItems = (subItems: any) => {
    if (!subItems) return null;
    
    try {
      const parsed = typeof subItems === 'string' ? JSON.parse(subItems) : subItems;
      return parsed;
    } catch (e) {
      console.error('Error parsing subItems:', e);
      return null;
    }
  };

  return (
    <Show isLoading={isLoading}>
      <Card>
        <Title level={3}>{record?.name}</Title>
        
        {!record?.isAvailable && (
          <Alert
            message="Currently Unavailable"
            description="This menu item is currently marked as unavailable"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Restaurant" span={2}>
            <TextField value={restaurantData?.data?.name || "N/A"} />
          </Descriptions.Item>

          <Descriptions.Item label="Category">
            <Tag color="blue">{record?.category}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Base Price">
            <NumberField
              value={record?.price}
              options={{
                style: "currency",
                currency: "USD",
              }}
            />
          </Descriptions.Item>

          <Descriptions.Item label="Description" span={2}>
            <TextField value={record?.description || "No description"} />
          </Descriptions.Item>

          <Descriptions.Item label="Available" span={2}>
            <Tag color={record?.isAvailable ? "green" : "red"}>
              {record?.isAvailable ? "Yes" : "No"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {record?.subItems && (
        <Card title="Options & Add-ons" style={{ marginTop: 16 }}>
          {(() => {
            const subItems = parseSubItems(record.subItems);
            if (!subItems || !subItems.addons) {
              return <p>No add-ons configured</p>;
            }
            
            return (
              <Descriptions bordered column={1}>
                {subItems.addons.map((addon: any, index: number) => (
                  <Descriptions.Item
                    key={index}
                    label={addon.name}
                  >
                    {formatPrice(addon.price)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            );
          })()}
        </Card>
      )}

      {record?.upsellPrompt && (
        <Card title="AI Upsell Prompt" style={{ marginTop: 16 }}>
          <p>{record.upsellPrompt}</p>
        </Card>
      )}

      {record?.outOfStockHandling && (
        <Card title="Out of Stock Handling" style={{ marginTop: 16 }}>
          <p>{record.outOfStockHandling}</p>
        </Card>
      )}

      <Card title="Metadata" style={{ marginTop: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Created At">
            {record?.createdAt
              ? new Date(record.createdAt).toLocaleString()
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {record?.updatedAt
              ? new Date(record.updatedAt).toLocaleString()
              : "N/A"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Show>
  );
}
