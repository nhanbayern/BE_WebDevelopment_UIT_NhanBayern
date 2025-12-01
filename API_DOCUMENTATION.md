# 🍷 RuouOngTu Backend API Documentation

**Base URL:** `https://api.ruouongtu.me/RuouOngTu`

**API Documentation (Swagger):** `https://api.ruouongtu.me/api-docs`

---

## 📑 Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Customer Authentication](#2-customer-authentication)
3. [User Profile Management](#3-user-profile-management)
4. [Product Management](#4-product-management)
5. [Shopping Cart](#5-shopping-cart)
6. [Error Codes Reference](#6-error-codes-reference)

---

## 1. Authentication & Authorization

### 🔐 Bearer Token Authentication

Most endpoints require a valid JWT access token in the `Authorization` header:

```http
Authorization: Bearer <your_access_token_here>
```

### 1.1 Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Description:** Renew access token using refresh token stored in HttpOnly cookie

**Authentication:** None (uses HttpOnly cookie)

**Request:**

```http
POST /RuouOngTu/auth/refresh
Cookie: refreshToken=<refresh_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 Unauthorized):**

```json
{
  "message": "Token hết hạn"
}
```

---

### 1.2 Logout

**Endpoint:** `POST /auth/logout`

**Description:** Revoke refresh token and clear cookies

**Authentication:** None (uses HttpOnly cookie)

**Request:**

```http
POST /RuouOngTu/auth/logout
Cookie: refreshToken=<refresh_token>
```

**Response (200 OK):**

```json
{
  "success": true
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Token không tồn tại"
}
```

---

### 1.3 Check Email (Registration)

**Endpoint:** `POST /auth/check-email`

**Description:** Verify email availability and send OTP for registration

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP sent"
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Email đã được đăng ký"
}
```

---

### 1.4 Verify OTP (Registration)

**Endpoint:** `POST /auth/verify-otp`

**Description:** Verify OTP code sent to email during registration

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "username": "johndoe",
  "password": "SecurePass123!",
  "phone_number": "0912345678",
  "address": "123 Main St, District 1, HCMC"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "u001",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "OTP không hợp lệ hoặc đã hết hạn"
}
```

---

### 1.5 Resend OTP

**Endpoint:** `POST /auth/resend-otp`

**Description:** Resend OTP code to email

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP đã được gửi lại"
}
```

---

### 1.6 Forgot Password - Check Email

**Endpoint:** `POST /auth/forgot-password/check-email`

**Description:** Send password reset OTP to email

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP đã được gửi"
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Email không tồn tại"
}
```

---

### 1.7 Forgot Password - Verify OTP

**Endpoint:** `POST /auth/forgot-password/verify-otp`

**Description:** Verify OTP for password reset

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP xác thực thành công"
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "OTP không chính xác"
}
```

---

### 1.8 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** Reset password after OTP verification

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại"
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "OTP đã hết hạn"
}
```

---

## 2. Customer Authentication

### 2.1 Login with Email & Password

**Endpoint:** `POST /api/customer/login`  
**Alternative:** `POST /customer/login`

**Description:** Login customer account using email and password

**Request Body:**

```json
{
  "email": "phuong.nguyen@example.com",
  "password": "xinchao123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "account_id": "a001",
    "customer_id": "c001",
    "email": "phuong.nguyen@example.com",
    "full_name": "Phương Nguyễn",
    "phone_number": "0901234567",
    "address": "123 Lê Lợi, Quận 1, TP.HCM"
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác"
}
```

---

### 2.2 Login with Google OAuth

**Endpoint:** `GET /customer/google`

**Description:** Redirect to Google OAuth login page

**Response:** `302 Redirect` to Google authentication

---

### 2.3 Google OAuth Callback

**Endpoint:** `GET /customer/google/callback`

**Description:** Handle Google OAuth callback

**Response (Success):**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "account_id": "a002",
    "customer_id": "c002",
    "email": "googleuser@gmail.com",
    "full_name": "Google User",
    "oauth_provider": "google"
  }
}
```

---

### 2.4 Get Customer Profile

**Endpoint:** `GET /customer/profile`

**Authentication:** Required (Bearer Token)

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "account_id": "a001",
    "customer_id": "c001",
    "email": "phuong.nguyen@example.com",
    "full_name": "Phương Nguyễn",
    "phone_number": "0901234567",
    "address": "123 Lê Lợi, Quận 1, TP.HCM",
    "date_of_birth": "1995-03-15",
    "gender": "female",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## 3. User Profile Management

### 3.1 Get User Profile

**Endpoint:** `GET /api/user/profile`  
**Alternative:** `GET /user/profile`

**Authentication:** Required (Bearer Token)

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "user": {
    "user_id": "u001",
    "username": "johndoe",
    "email": "john@example.com",
    "phone_number": "0912345678",
    "address": "123 Main St, HCMC",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-11-26T00:00:00.000Z"
  }
}
```

**Response (404 Not Found):**

```json
{
  "message": "User not found"
}
```

---

### 3.2 Update User Profile

**Endpoint:** `POST /api/user/update`  
**Alternative:** `POST /user/update`

**Authentication:** Required (Bearer Token)

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "username": "johndoe_updated",
  "phone_number": "0987654321",
  "address": "456 New St, District 3, HCMC"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "user_id": "u001",
    "username": "johndoe_updated",
    "email": "john@example.com",
    "phone_number": "0987654321",
    "address": "456 New St, District 3, HCMC",
    "updated_at": "2024-11-26T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "errors": [
    {
      "field": "phone_number",
      "message": "Phone number must be valid"
    }
  ]
}
```

---

### 3.3 Get User Addresses

**Endpoint:** `GET /api/user/address`  
**Alternative:** `GET /user/address`

**Authentication:** Required (Bearer Token)

**Response (200 OK):**

```json
{
  "addresses": [
    {
      "address_id": 1,
      "user_id": "u001",
      "address_line": "123 Main Street",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "province": "TP. Hồ Chí Minh",
      "is_default": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "address_id": 2,
      "user_id": "u001",
      "address_line": "456 Second Ave",
      "ward": "Phường 12",
      "district": "Quận 3",
      "province": "TP. Hồ Chí Minh",
      "is_default": 0,
      "created_at": "2024-03-15T00:00:00.000Z"
    }
  ]
}
```

---

### 3.4 Create Address

**Endpoint:** `POST /api/user/address/create`  
**Alternative:** `POST /user/address/create`

**Authentication:** Required (Bearer Token)

**Request Body:**

```json
{
  "address_line": "789 New Boulevard",
  "ward": "Phường Tân Định",
  "district": "Quận 1",
  "province": "TP. Hồ Chí Minh",
  "is_default": 0
}
```

**Response (201 Created):**

```json
{
  "address": {
    "address_id": 3,
    "user_id": "u001",
    "address_line": "789 New Boulevard",
    "ward": "Phường Tân Định",
    "district": "Quận 1",
    "province": "TP. Hồ Chí Minh",
    "is_default": 0,
    "created_at": "2024-11-26T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "errors": [
    {
      "field": "address_line",
      "message": "Address line is required"
    }
  ]
}
```

---

### 3.5 Update Address

**Endpoint:** `POST /api/user/address/update/:address_id`  
**Alternative:** `POST /user/address/update/:address_id`

**Authentication:** Required (Bearer Token)

**URL Parameters:**

- `address_id` (integer, required): ID of address to update

**Request Body:**

```json
{
  "address_line": "789 Updated Boulevard",
  "ward": "Phường Tân Định",
  "district": "Quận 1",
  "province": "TP. Hồ Chí Minh",
  "is_default": 1
}
```

**Response (200 OK):**

```json
{
  "address": {
    "address_id": 3,
    "user_id": "u001",
    "address_line": "789 Updated Boulevard",
    "ward": "Phường Tân Định",
    "district": "Quận 1",
    "province": "TP. Hồ Chí Minh",
    "is_default": 1,
    "updated_at": "2024-11-26T11:00:00.000Z"
  }
}
```

**Response (403 Forbidden):**

```json
{
  "message": "Address does not belong to user"
}
```

**Response (404 Not Found):**

```json
{
  "message": "Address not found"
}
```

---

### 3.6 Delete Address

**Endpoint:** `DELETE /api/user/address/:address_id`  
**Alternative:** `DELETE /user/address/:address_id`

**Authentication:** Required (Bearer Token)

**URL Parameters:**

- `address_id` (integer, required): ID of address to delete

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

**Response (404 Not Found):**

```json
{
  "message": "Address not found"
}
```

---

## 4. Product Management

### 4.1 Get All Products (with Pagination & Search)

**Endpoint:** `GET /products`

**Query Parameters:**

- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10): Items per page
- `q` (string, optional): Search keyword (product name)
- `category` (string, optional): Filter by category

**Request Example:**

```http
GET /RuouOngTu/products?page=1&limit=20&q=rượu&category=miền%20bắc
```

**Response (200 OK):**

```json
{
  "page": 1,
  "limit": 20,
  "totalItems": 45,
  "totalPages": 3,
  "products": [
    {
      "product_id": "p001",
      "product_name": "Rượu Gạo Miền Bắc",
      "category": "Rượu Truyền Thống",
      "region": "Miền Bắc",
      "sale_price": 450000,
      "original_price": 500000,
      "discount_percent": 10,
      "image": "/uploads/products/p001.jpg",
      "stock_quantity": 100,
      "description": "Rượu gạo truyền thống từ miền Bắc Việt Nam",
      "rating": 4.5,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "product_id": "p002",
      "product_name": "Rượu Ngô Sapa",
      "category": "Rượu Vùng Cao",
      "region": "Miền Bắc",
      "sale_price": 380000,
      "original_price": 380000,
      "discount_percent": 0,
      "image": "/uploads/products/p002.jpg",
      "stock_quantity": 50,
      "description": "Rượu ngô đặc sản từ Sapa",
      "rating": 4.7,
      "created_at": "2024-01-05T00:00:00.000Z"
    }
  ]
}
```

---

### 4.2 Get Product by ID

**Endpoint:** `GET /products/:id`

**URL Parameters:**

- `id` (string, required): Product ID

**Request Example:**

```http
GET /RuouOngTu/products/p001
```

**Response (200 OK):**

```json
{
  "product_id": "p001",
  "product_name": "Rượu Gạo Miền Bắc",
  "category": "Rượu Truyền Thống",
  "region": "Miền Bắc",
  "sale_price": 450000,
  "original_price": 500000,
  "discount_percent": 10,
  "image": "/uploads/products/p001.jpg",
  "gallery": [
    "/uploads/products/p001_1.jpg",
    "/uploads/products/p001_2.jpg",
    "/uploads/products/p001_3.jpg"
  ],
  "stock_quantity": 100,
  "description": "Rượu gạo truyền thống được ủ từ gạo nếp thơm miền Bắc Việt Nam, có hương vị đặc trưng và nồng độ cồn vừa phải.",
  "alcohol_content": 29.5,
  "volume_ml": 750,
  "ingredients": "Gạo nếp, men rượu truyền thống",
  "rating": 4.5,
  "review_count": 128,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-11-20T00:00:00.000Z"
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Không tìm thấy sản phẩm"
}
```

---

### 4.3 Get Products by Region

**Endpoint:** `GET /products/region/:regionName`

**URL Parameters:**

- `regionName` (string, required): Region name (e.g., "Miền Bắc", "Miền Nam", "Vùng Cao")

**Request Example:**

```http
GET /RuouOngTu/products/region/Miền%20Bắc
```

**Response (200 OK):**

```json
{
  "region": "Miền Bắc",
  "totalProducts": 24,
  "products": [
    {
      "product_id": "p001",
      "product_name": "Rượu Gạo Miền Bắc",
      "category": "Rượu Truyền Thống",
      "region": "Miền Bắc",
      "sale_price": 450000,
      "image": "/uploads/products/p001.jpg",
      "rating": 4.5
    },
    {
      "product_id": "p003",
      "product_name": "Rượu Nếp Cẩm Hà Giang",
      "category": "Rượu Vùng Cao",
      "region": "Miền Bắc",
      "sale_price": 520000,
      "image": "/uploads/products/p003.jpg",
      "rating": 4.8
    }
  ]
}
```

---

## 5. Shopping Cart

### 5.1 Get Cart Items

**Endpoint:** `GET /api/user/cartitems`  
**Alternative:** `GET /user/cartitems`

**Authentication:** Required (Bearer Token)

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "items": [
    {
      "itemId": 1,
      "productId": "p001",
      "productName": "Rượu Gạo Miền Bắc",
      "image": "/uploads/products/p001.jpg",
      "price": 450000,
      "quantity": 2,
      "createdAt": "2024-11-26T08:30:00.000Z"
    },
    {
      "itemId": 2,
      "productId": "p005",
      "productName": "Rượu Đế Miền Trung",
      "image": "/uploads/products/p005.jpg",
      "price": 320000,
      "quantity": 1,
      "createdAt": "2024-11-26T09:15:00.000Z"
    }
  ],
  "totalItems": 2
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

---

### 5.2 Add Item to Cart (Insert or Update)

**Endpoint:** `POST /api/user/insertitems`  
**Alternative:** `POST /user/insertitems`

**Authentication:** Required (Bearer Token)

**Description:**

- If product exists in cart: increment quantity
- If product is new: create new cart item
- Uses `INSERT ... ON DUPLICATE KEY UPDATE` for concurrency safety

**Headers:**

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "productId": "p001",
  "quantity": 3
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "item": {
    "itemId": 1,
    "productId": "p001",
    "productName": "Rượu Gạo Miền Bắc",
    "image": "/uploads/products/p001.jpg",
    "price": 450000,
    "quantity": 5,
    "updatedAt": "2024-11-26T10:00:00.000Z"
  }
}
```

**Response (400 Bad Request - Validation Error):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be at least 1"
    }
  ]
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "User not authenticated. Please login again."
}
```

**Response (409 Conflict):**

```json
{
  "success": false,
  "message": "Item already exists in cart"
}
```

---

### 5.3 Update Cart Item Quantity

**Endpoint:** `PUT /api/user/cartitems/:productId`  
**Alternative:** `PUT /user/cartitems/:productId`

**Authentication:** Required (Bearer Token)

**Description:** Set cart item quantity to a specific value (not increment)

**URL Parameters:**

- `productId` (string, required): Product ID

**Headers:**

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "quantity": 5
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "item": {
    "itemId": 1,
    "productId": "p001",
    "productName": "Rượu Gạo Miền Bắc",
    "image": "/uploads/products/p001.jpg",
    "price": 450000,
    "quantity": 5,
    "updatedAt": "2024-11-26T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Quantity must be at least 1"
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Cart item not found"
}
```

---

### 5.4 Remove Item from Cart

**Endpoint:** `DELETE /api/user/cartitems/:productId`  
**Alternative:** `DELETE /user/cartitems/:productId`

**Authentication:** Required (Bearer Token)

**URL Parameters:**

- `productId` (string, required): Product ID to remove

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Cart item not found"
}
```

---

### 5.5 Clear All Cart Items

**Endpoint:** `DELETE /api/user/cartitems`  
**Alternative:** `DELETE /user/cartitems`

**Authentication:** Required (Bearer Token)

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "deletedCount": 5
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

---

## 6. Error Codes Reference

### HTTP Status Codes

| Code | Meaning               | Description                                         |
| ---- | --------------------- | --------------------------------------------------- |
| 200  | OK                    | Request successful                                  |
| 201  | Created               | Resource created successfully                       |
| 400  | Bad Request           | Invalid request parameters or validation error      |
| 401  | Unauthorized          | Missing or invalid authentication token             |
| 403  | Forbidden             | Valid token but insufficient permissions            |
| 404  | Not Found             | Resource does not exist                             |
| 409  | Conflict              | Resource already exists (e.g., duplicate cart item) |
| 500  | Internal Server Error | Unexpected server error                             |

---

### Common Error Response Formats

#### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be valid"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "message": "Token hết hạn"
}
```

#### Authorization Error (403)

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này"
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "message": "Không tìm thấy sản phẩm"
}
```

#### Server Error (500)

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 7. Authentication Flow Diagrams

### 7.1 Login Flow (Email & Password)

```
Client                          Server                          Database
  |                               |                                 |
  |-- POST /customer/login ------>|                                 |
  |   { email, password }         |                                 |
  |                               |-- Query customer_account ------>|
  |                               |<-- Return account data ---------|
  |                               |                                 |
  |                               |-- Verify password (bcrypt) ---->|
  |                               |<-- Password valid --------------|
  |                               |                                 |
  |                               |-- Generate JWT tokens --------->|
  |                               |-- Store refresh_token --------->|
  |                               |<-- Tokens stored --------------|
  |                               |                                 |
  |<-- 200 OK --------------------|                                 |
  |   { accessToken, user }       |                                 |
  |   Set-Cookie: refreshToken    |                                 |
```

### 7.2 Token Refresh Flow

```
Client                          Server                          Database
  |                               |                                 |
  |-- POST /auth/refresh -------->|                                 |
  |   Cookie: refreshToken        |                                 |
  |                               |-- Verify refreshToken --------->|
  |                               |<-- Token valid -----------------|
  |                               |                                 |
  |                               |-- Generate new accessToken ---->|
  |<-- 200 OK --------------------|                                 |
  |   { accessToken }             |                                 |
```

### 7.3 Shopping Cart Add Flow

```
Client                          Server                          Database
  |                               |                                 |
  |-- POST /user/insertitems ---->|                                 |
  |   Authorization: Bearer token |                                 |
  |   { productId, quantity }     |                                 |
  |                               |-- Verify JWT token ------------>|
  |                               |<-- Token valid, user_id --------|
  |                               |                                 |
  |                               |-- INSERT ... ON DUPLICATE ----->|
  |                               |    KEY UPDATE quantity          |
  |                               |<-- Item added/updated ----------|
  |                               |                                 |
  |                               |-- Fetch updated cart item ----->|
  |                               |<-- Return with product info ----|
  |                               |                                 |
  |<-- 200 OK --------------------|                                 |
  |   { success, item }           |                                 |
```

---

## 8. Environment Variables Reference

Required environment variables in `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=backend

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES_DAYS=30

# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.ruouongtu.me/RuouOngTu/auth/google/callback

# Email Configuration
NODE_MAILER_KEY=your_app_password
USER_EMAIL=your_email@gmail.com

# CORS
FRONTEND_ORIGIN=http://localhost:5174

# Server
PORT=3000
NODE_ENV=development
```

---

## 9. Testing with cURL Examples

### Login Example

```bash
curl -X POST https://api.ruouongtu.me/RuouOngTu/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phuong.nguyen@example.com",
    "password": "xinchao123"
  }'
```

### Get Products with Search

```bash
curl -X GET "https://api.ruouongtu.me/RuouOngTu/products?page=1&limit=10&q=rượu&category=miền%20bắc"
```

### Add to Cart

```bash
curl -X POST https://api.ruouongtu.me/RuouOngTu/api/user/insertitems \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "p001",
    "quantity": 2
  }'
```

### Get Cart Items

```bash
curl -X GET https://api.ruouongtu.me/RuouOngTu/api/user/cartitems \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST https://api.ruouongtu.me/RuouOngTu/auth/refresh \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

---

## 10. Rate Limiting & Security Notes

### Security Headers

- All sensitive endpoints require HTTPS in production
- CORS configured for `http://localhost:5174` (dev) and production origin
- Cookies set with `HttpOnly`, `Secure` (prod), and `SameSite` flags

### Token Security

- **Access Token:** Short-lived (15 minutes), sent in `Authorization` header
- **Refresh Token:** Long-lived (30 days), stored in HttpOnly cookie
- Refresh tokens are hashed (SHA256) before storage in database
- Token cleanup scheduler runs daily to remove expired tokens

### Input Validation

- All endpoints use `express-validator` for input sanitization
- SQL queries use parameterized placeholders to prevent SQL injection
- Passwords hashed with bcrypt (10 rounds)

---

## 📞 Support & Documentation

- **Swagger UI:** `https://api.ruouongtu.me/api-docs`
- **GitHub Repository:** [BE_WebDevelopment_UIT_NhanBayern](https://github.com/nhanbayern/BE_WebDevelopment_UIT_NhanBayern)
- **Database Schema:** See `BackEnd/diagram/dbdiagram/`
- **API Tests:** Use Postman collection (import from Swagger export)

---

**Last Updated:** November 26, 2025  
**API Version:** 1.0.0  
**Maintainer:** NhanBayern
