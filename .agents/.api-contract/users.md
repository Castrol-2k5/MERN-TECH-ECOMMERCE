# Users & Personnel RBAC API Contract

## 1. GET /api/v1/users
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER` (Scoping theo chi nhánh)
- **Query:** `page, limit, role, branchId, isActive, search`
- **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "65f0a...",
        "fullName": "Nguyễn Văn A",
        "email": "staff.q1@techstore.com",
        "phone": "0901234567",
        "role": "STAFF",
        "branchId": {
          "_id": "65f0b...",
          "name": "Chi nhánh Q1"
        },
        "isActive": true,
        "createdAt": "2026-10-07T08:00:00.000Z"
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

## 2. POST /api/v1/users
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER` (Chỉ tạo STAFF cho chi nhánh của mình)
- **Body:**
```json
{
  "fullName": "Trần Thị B",
  "email": "staff.q1.2@techstore.com",
  "phone": "0909888777",
  "password": "Password123@",
  "role": "STAFF",
  "branchId": "65f0b..."
}
```

## 3. PUT /api/v1/users/:id
- **Roles:** `SUPER_ADMIN`
- **Body:** `{ "fullName": "...", "phone": "...", "role": "...", "branchId": "..." }`

## 4. PATCH /api/v1/users/:id/status
- **Roles:** `SUPER_ADMIN`
- **Body:** `{ "isActive": false }`

## 5. DELETE /api/v1/users/:id
- **Roles:** `SUPER_ADMIN`
