# Shopping Cart API Documentation

## Overview

Backend implementation for Shopping Cart "Add to Cart" feature with concurrency-safe operations.

## Database Schema

### Table: `shopping_cart_item`

```sql
CREATE TABLE shopping_cart_item (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  product_id VARCHAR(10) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES customers(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  CHECK (quantity >= 1)
);
```

### Relationships

- **Customer (1) → (Many) ShoppingCartItem**
- **Product (1) → (Many) ShoppingCartItem**
- **Unique constraint**: `(user_id, product_id)` - One user can only have one cart entry per product

---

## API Endpoints

All endpoints require authentication via Bearer token.

### 1. GET `/user/cartitems`

**Get all cart items for authenticated user**

#### Request

```http
GET /RuouOngTu/user/cartitems
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "items": [
    {
      "itemId": 1,
      "productId": "p001",
      "productName": "Rượu Gạo Miền Bắc",
      "image": "/img/dir/p001.png",
      "price": 450000,
      "quantity": 5,
      "createdAt": "2025-11-26T10:30:00Z"
    }
  ],
  "totalItems": 1
}
```

---

### 2. POST `/user/insertitems`

**Add item to cart or update quantity if exists**

#### Implementation Details

- Uses **INSERT ... ON DUPLICATE KEY UPDATE** for atomic operation
- **Concurrency-safe** in multi-instance backend setup
- If `(user_id, product_id)` exists → **UPDATE** (increment quantity)
- If not exists → **INSERT** new row
- Unique constraint prevents duplicates

#### Request

```http
POST /RuouOngTu/user/insertitems
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "p001",
  "quantity": 3
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "item": {
    "itemId": 1,
    "productId": "p001",
    "productName": "Rượu Gạo Miền Bắc",
    "image": "/img/dir/p001.png",
    "price": 450000,
    "quantity": 8,
    "updatedAt": "2025-11-26T10:35:00Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input (missing productId or quantity < 1)
- **401 Unauthorized**: Invalid or missing token
- **500 Internal Server Error**: Database error

---

### 3. PUT `/user/cartitems/:productId`

**Update cart item quantity (set to specific value)**

#### Request

```http
PUT /RuouOngTu/user/cartitems/p001
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quantity": 5
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "item": {
    "itemId": 1,
    "productId": "p001",
    "productName": "Rượu Gạo Miền Bắc",
    "price": 450000,
    "quantity": 5
  }
}
```

---

### 4. DELETE `/user/cartitems/:productId`

**Remove item from cart**

#### Request

```http
DELETE /RuouOngTu/user/cartitems/p001
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

#### Error Responses

- **404 Not Found**: Cart item not found

---

### 5. DELETE `/user/cartitems`

**Clear all cart items for user**

#### Request

```http
DELETE /RuouOngTu/user/cartitems
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "deletedCount": 3
}
```

---

## Architecture

### Layers

1. **Routes** (`shoppingCartRoutes.js`)

   - Express router with Swagger documentation
   - Input validation with express-validator
   - Authentication middleware

2. **Controllers** (`shopping_cart.controller.js`)

   - Request/response handling
   - Validation error processing
   - Error mapping

3. **Services** (`shopping_cart.service.js`)

   - Business logic
   - Database operations
   - Concurrency-safe INSERT/UPDATE

4. **Models** (`shopping_cart_item.model.js`)
   - Sequelize ORM model
   - Associations with Customer and Product
   - Unique constraint on `(user_id, product_id)`

### Concurrency Safety

```javascript
// Atomic INSERT or UPDATE using raw SQL
await sequelize.query(`
  INSERT INTO shopping_cart_item (user_id, product_id, quantity, created_at, updated_at)
  VALUES (:userId, :productId, :quantity, NOW(), NOW())
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + :quantity,
    updated_at = NOW()
`);
```

**Why this approach?**

- ✅ **Atomic operation** - No race conditions
- ✅ **Multi-instance safe** - Works with multiple backend servers
- ✅ **Database-level locking** - MySQL handles concurrency
- ✅ **No application-level locks** - Better performance

---

## Swagger Documentation

Access API documentation at: `https://api.ruouongtu.me/api-docs`

All endpoints are documented with:

- Request/response schemas
- Example payloads
- Error codes
- Authentication requirements

---

## Testing

### Setup

1. Run migration:

```bash
mysql -u root -p ruouongtu_db < src/dbfile/shopping_cart_migration.sql
```

2. Start server:

```bash
npm run dev
```

### Test Endpoints

```bash
# Login to get token
curl -X POST https://api.ruouongtu.me/RuouOngTu/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Add item to cart
curl -X POST https://api.ruouongtu.me/RuouOngTu/user/insertitems \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"productId":"p001","quantity":3}'

# Get cart items
curl -X GET https://api.ruouongtu.me/RuouOngTu/user/cartitems \
  -H "Authorization: Bearer <token>"
```

---

## Files Created

1. **Model**: `BackEnd/src/models/shopping_cart_item.model.js`
2. **Service**: `BackEnd/src/services/shopping_cart.service.js`
3. **Controller**: `BackEnd/src/controllers/shopping_cart.controller.js`
4. **Routes**: `BackEnd/src/routes/shoppingCartRoutes.js`
5. **Migration**: `BackEnd/src/dbfile/shopping_cart_migration.sql`
6. **Updated**: `BackEnd/src/models/associations.js`
7. **Updated**: `BackEnd/server.js`

---

## Features

✅ **Concurrency-safe** INSERT/UPDATE operations  
✅ **Swagger documentation** for all endpoints  
✅ **Authentication** required for all operations  
✅ **Validation** on all inputs  
✅ **Error handling** with meaningful messages  
✅ **Associations** with Customer and Product models  
✅ **Unique constraint** prevents duplicate cart entries  
✅ **Cascade delete** when user or product is deleted

---

## Next Steps

1. ✅ Run migration SQL
2. ✅ Test endpoints via Swagger UI
3. ✅ Integrate with Frontend
4. ⏳ Add pagination for large carts (if needed)
5. ⏳ Add cart expiration policy (optional)
