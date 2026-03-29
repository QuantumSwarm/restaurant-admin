"use client";

// app/(dashboard)/analytics/page.tsx
// Complete analytics dashboard with PDF export

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Typography,
  Space,
  Spin,
  message,
  Table,
  Tag,
  Button,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { Line, Column } from "@ant-design/plots";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SummaryMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

interface TrendDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

interface TopItem {
  templateId: number;
  name: string;
  category: string;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
  avgPrice: number;
}

interface PeakHourData {
  hour: number;
  orderCount: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [peakHoursLoading, setPeakHoursLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    uniqueCustomers: 0,
  });
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "days"),
    dayjs(),
  ]);
  const [messageApi, contextHolder] = message.useMessage();

  // Refs for capturing chart elements
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const peakHoursChartRef = useRef<HTMLDivElement>(null);

  // Format hour (0-23) to 12-hour format
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  // Export to PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    messageApi.loading({
      content: "Generating PDF report...",
      key: "pdf-export",
    });

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Analytics Report", pageWidth / 2, yPosition, {
        align: "center",
      });

      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${dateRange[0].format("MMM DD, YYYY")} - ${dateRange[1].format(
          "MMM DD, YYYY",
        )}`,
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );

      yPosition += 15;

      // Summary Metrics Section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary Metrics", 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      // Metrics in a grid
      const metricsData = [
        ["Total Orders", metrics.totalOrders.toString()],
        ["Total Revenue", `$${metrics.totalRevenue.toFixed(2)}`],
        ["Avg Order Value", `$${metrics.avgOrderValue.toFixed(2)}`],
        ["Unique Customers", metrics.uniqueCustomers.toString()],
      ];

      metricsData.forEach(([label, value], index) => {
        const xPos = 20 + (index % 2) * 90;
        const yPos = yPosition + Math.floor(index / 2) * 10;
        pdf.setFont("helvetica", "bold");
        pdf.text(`${label}:`, xPos, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, xPos + 40, yPos);
      });

      yPosition += 30;

      // Revenue Trend Chart
      if (revenueChartRef.current && trendData.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Revenue Trend", 20, yPosition);
        yPosition += 5;

        const canvas = await html2canvas(revenueChartRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }

      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }

      // Peak Hours Chart
      if (peakHoursChartRef.current && peakHours.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Peak Hours", 20, yPosition);
        yPosition += 5;

        const canvas = await html2canvas(peakHoursChartRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if chart fits on current page
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Peak Hours", 20, yPosition);
          yPosition += 5;
        }

        pdf.addImage(imgData, "PNG", 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }

      // Check if we need a new page for table
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      // Top Items Table
      if (topItems.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Top Menu Items", 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");

        // Table headers
        const headers = ["#", "Item", "Category", "Qty", "Orders", "Revenue"];
        const colWidths = [10, 60, 35, 20, 20, 25];
        let xPos = 20;

        headers.forEach((header, i) => {
          pdf.text(header, xPos, yPosition);
          xPos += colWidths[i];
        });

        yPosition += 6;
        pdf.setFont("helvetica", "normal");

        // Table rows
        topItems.forEach((item, index) => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }

          xPos = 20;
          const rowData = [
            `${index + 1}`,
            item.name.substring(0, 25),
            item.category.substring(0, 12),
            item.totalQuantity.toString(),
            item.orderCount.toString(),
            `$${item.totalRevenue.toFixed(2)}`,
          ];

          rowData.forEach((data, i) => {
            pdf.text(data, xPos, yPosition);
            xPos += colWidths[i];
          });

          yPosition += 6;
        });
      }

      // Footer
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
        pdf.text(
          `Generated on ${dayjs().format("MMM DD, YYYY hh:mm A")}`,
          pageWidth - 20,
          pageHeight - 10,
          { align: "right" },
        );
      }

      // Save PDF
      const filename = `analytics-report-${dateRange[0].format(
        "YYYY-MM-DD",
      )}-to-${dateRange[1].format("YYYY-MM-DD")}.pdf`;
      pdf.save(filename);

      messageApi.success({
        content: "PDF report generated successfully!",
        key: "pdf-export",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      messageApi.error({
        content: "Failed to generate PDF report",
        key: "pdf-export",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  // Fetch analytics summary
  const fetchSummary = async (start: Dayjs, end: Dayjs) => {
    setLoading(true);
    try {
      const startDate = start.format("YYYY-MM-DD");
      const endDate = end.format("YYYY-MM-DD");
      const url = `/api/analytics/summary?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.success) {
        setMetrics(data.summary);
      } else {
        messageApi.error(data.error || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Fetch analytics error:", error);
      messageApi.error("An error occurred while fetching analytics");
    } finally {
      setLoading(false);
    }
  };

  // Fetch revenue trend
  const fetchTrend = async (start: Dayjs, end: Dayjs) => {
    setChartLoading(true);
    try {
      const startDate = start.format("YYYY-MM-DD");
      const endDate = end.format("YYYY-MM-DD");
      const url = `/api/analytics/revenue-trend?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.success) {
        setTrendData(data.trend);
      } else {
        messageApi.error(data.error || "Failed to fetch revenue trend");
      }
    } catch (error) {
      console.error("Fetch trend error:", error);
      messageApi.error("An error occurred while fetching trend data");
    } finally {
      setChartLoading(false);
    }
  };

  // Fetch top items
  const fetchTopItems = async (start: Dayjs, end: Dayjs) => {
    setTableLoading(true);
    try {
      const startDate = start.format("YYYY-MM-DD");
      const endDate = end.format("YYYY-MM-DD");
      const url = `/api/analytics/top-items?startDate=${startDate}&endDate=${endDate}&limit=10`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.success) {
        setTopItems(data.topItems);
      } else {
        messageApi.error(data.error || "Failed to fetch top items");
      }
    } catch (error) {
      console.error("Fetch top items error:", error);
      messageApi.error("An error occurred while fetching top items");
    } finally {
      setTableLoading(false);
    }
  };

  // Fetch peak hours
  const fetchPeakHours = async (start: Dayjs, end: Dayjs) => {
    setPeakHoursLoading(true);
    try {
      const startDate = start.format("YYYY-MM-DD");
      const endDate = end.format("YYYY-MM-DD");
      const url = `/api/analytics/peak-hours?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.success) {
        setPeakHours(data.peakHours);
      } else {
        messageApi.error(data.error || "Failed to fetch peak hours");
      }
    } catch (error) {
      console.error("Fetch peak hours error:", error);
      messageApi.error("An error occurred while fetching peak hours");
    } finally {
      setPeakHoursLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchSummary(dateRange[0], dateRange[1]);
    fetchTrend(dateRange[0], dateRange[1]);
    fetchTopItems(dateRange[0], dateRange[1]);
    fetchPeakHours(dateRange[0], dateRange[1]);
  }, []);

  // Handle date range change
  const handleDateChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      fetchSummary(dates[0], dates[1]);
      fetchTrend(dates[0], dates[1]);
      fetchTopItems(dates[0], dates[1]);
      fetchPeakHours(dates[0], dates[1]);
    }
  };

  // Revenue chart configuration
  const revenueChartConfig = {
    data: trendData,
    xField: "date",
    yField: "revenue",
    smooth: true,
    animation: {
      appear: {
        animation: "wave-in",
        duration: 1000,
      },
    },
    color: "#52c41a",
    point: {
      size: 5,
      shape: "circle",
      style: {
        fill: "#52c41a",
        stroke: "#fff",
        lineWidth: 2,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: "Revenue",
          value: `$${Number(datum.revenue).toFixed(2)}`,
        };
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: true,
      },
    },
    yAxis: {
      label: {
        formatter: (value: string) => `$${Number(value).toFixed(0)}`,
      },
    },
    areaStyle: {
      fill: "l(270) 0:#ffffff 0.5:#d9f7be 1:#52c41a",
    },
  };

  // Peak hours chart configuration
  const peakHoursChartConfig = {
    // Only include hours that have at least one order so zeros are not shown
    data: peakHours
      .filter((item) => item.orderCount > 0)
      .map((item) => ({
        hour: formatHour(item.hour),
        orderCount: item.orderCount,
      })),
    xField: "hour",
    yField: "orderCount",
    color: "#1890ff",
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    animation: {
      appear: {
        animation: "scale-in-y",
        duration: 800,
      },
    },
    label: {
      position: "top" as const,
      style: {
        fill: "#000000",
        opacity: 0.6,
        fontSize: 10,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        rotate: -45,
        offset: 10,
        style: {
          fontSize: 10,
          textAlign: "right",
        },
        formatter: (text: string, index: number) => {
          // Show every 2nd hour to reduce crowding
          if (index % 2 === 0) {
            return text;
          }
          return "";
        },
      },
    },
    yAxis: {
      label: {
        formatter: (value: string) => Math.round(Number(value)).toString(),
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: "Orders",
          value: datum.orderCount,
        };
      },
    },
  };

  // Top items table columns
  const topItemsColumns: ColumnsType<TopItem> = [
    {
      title: "Rank",
      key: "rank",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <span style={{ fontSize: 18, fontWeight: "bold", color: "#faad14" }}>
          #{index + 1}
        </span>
      ),
    },
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "Qty Sold",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
      width: 100,
      align: "right",
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: "Orders",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 100,
      align: "right",
      sorter: (a, b) => a.orderCount - b.orderCount,
    },
    {
      title: "Revenue",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 120,
      align: "right",
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      defaultSortOrder: "descend",
      render: (revenue: number) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          ${revenue.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Avg Price",
      dataIndex: "avgPrice",
      key: "avgPrice",
      width: 100,
      align: "right",
      sorter: (a, b) => a.avgPrice - b.avgPrice,
      render: (price: number) => `$${price.toFixed(2)}`,
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Header Section */}
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
            Analytics Dashboard
          </Title>
          <Text type="secondary">
            Track your restaurant's performance and insights
          </Text>
        </div>

        <Space size="middle">
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            size="large"
            presets={[
              {
                label: "Last 7 Days",
                value: [dayjs().subtract(7, "days"), dayjs()],
              },
              {
                label: "Last 30 Days",
                value: [dayjs().subtract(30, "days"), dayjs()],
              },
              {
                label: "Last 90 Days",
                value: [dayjs().subtract(90, "days"), dayjs()],
              },
              {
                label: "This Month",
                value: [dayjs().startOf("month"), dayjs()],
              },
              {
                label: "Last Month",
                value: [
                  dayjs().subtract(1, "month").startOf("month"),
                  dayjs().subtract(1, "month").endOf("month"),
                ],
              },
            ]}
          />

          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            size="large"
            onClick={handleExportPDF}
            loading={exportingPDF}
          >
            Export PDF
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "#f0f5ff" }}>
              <Statistic
                title={
                  <Space>
                    <ShoppingCartOutlined style={{ color: "#1890ff" }} />
                    <span>Total Orders</span>
                  </Space>
                }
                value={metrics.totalOrders}
                valueStyle={{ color: "#1890ff", fontSize: 32 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "#f6ffed" }}>
              <Statistic
                title={
                  <Space>
                    <DollarOutlined style={{ color: "#52c41a" }} />
                    <span>Total Revenue</span>
                  </Space>
                }
                value={metrics.totalRevenue}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#52c41a", fontSize: 32 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "#fff7e6" }}>
              <Statistic
                title={
                  <Space>
                    <LineChartOutlined style={{ color: "#fa8c16" }} />
                    <span>Avg Order Value</span>
                  </Space>
                }
                value={metrics.avgOrderValue}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#fa8c16", fontSize: 32 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "#fff0f6" }}>
              <Statistic
                title={
                  <Space>
                    <UserOutlined style={{ color: "#eb2f96" }} />
                    <span>Unique Customers</span>
                  </Space>
                }
                value={metrics.uniqueCustomers}
                valueStyle={{ color: "#eb2f96", fontSize: 32 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Revenue Trend Chart */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined style={{ color: "#52c41a" }} />
                <span>Revenue Trend</span>
              </Space>
            }
            extra={<Text type="secondary">Daily revenue</Text>}
          >
            <Spin spinning={chartLoading}>
              {trendData.length > 0 ? (
                <div ref={revenueChartRef} style={{ height: 350 }}>
                  <Line {...revenueChartConfig} />
                </div>
              ) : (
                <div
                  style={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  <Text type="secondary">No data available</Text>
                </div>
              )}
            </Spin>
          </Card>
        </Col>

        {/* Peak Hours Chart */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: "#1890ff" }} />
                <span>Peak Hours</span>
              </Space>
            }
            extra={<Text type="secondary">Orders by hour</Text>}
          >
            <Spin spinning={peakHoursLoading}>
              {peakHours.length > 0 ? (
                <>
                  <div ref={peakHoursChartRef} style={{ height: 350 }}>
                    <Column {...peakHoursChartConfig} />
                  </div>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginTop: 12,
                      fontSize: 12,
                      fontStyle: "italic",
                    }}
                  >
                    ℹ️ Hours with zero orders are omitted from this chart
                  </Text>
                </>
              ) : (
                <div
                  style={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  <Text type="secondary">No data available</Text>
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Top Menu Items Table */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: "#faad14" }} />
            <span>Top Menu Items</span>
          </Space>
        }
        style={{ marginTop: 24 }}
        extra={<Text type="secondary">Best-selling items by revenue</Text>}
      >
        <Table
          columns={topItemsColumns}
          dataSource={topItems}
          rowKey="templateId"
          loading={tableLoading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
