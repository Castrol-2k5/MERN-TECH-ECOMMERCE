# Analytics & Business Intelligence BI API Contract

## 1. GET /api/v1/analytics/overview
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query:** `branchId, startDate, endDate`
- **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy dữ liệu tổng quan phân tích kinh doanh thành công",
  "data": {
    "kpis": {
      "totalRevenue": "18,42 tỷ",
      "totalOrders": "4.862",
      "avgOrderValue": "3,79 triệu",
      "growth": "+18,6%"
    },
    "revenueOverTime": [
      { "day": "01/10", "online": 450, "pos": 280, "total": 730 }
    ],
    "channelData": [
      { "name": "B2C Web Online", "value": 62, "revenue": "11,42 tỷ", "color": "#2563EB" },
      { "name": "Web POS Quầy", "value": 38, "revenue": "7,00 tỷ", "color": "#06B6D4" }
    ],
    "branchSales": [
      { "name": "TechOne Q1", "revenue": "4,28 tỷ", "percentage": 100, "color": "bg-blue-600" }
    ],
    "branchPerformance": [
      { "rank": "01", "branch": "TechOne Q1", "revenue": "4,28 tỷ", "orders": "1.042", "aov": "4,11 triệu", "returnRate": "1,8%", "growth": "+22,4%" }
    ],
    "topProducts": [
      { "rank": 1, "name": "MacBook Air 13 M4", "sku": "MBA-M4-16-256", "quantity": "286 máy", "revenue": "7,58 tỷ", "color": "text-amber-400" }
    ]
  }
}
```
