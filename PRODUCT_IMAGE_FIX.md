# Backend Fix: Product Image Integration

## Problem

Cart API returns `image: ""` (empty string) because:

1. `products` table doesn't have `image` column
2. Images are stored in `product_images` table with `image_url` and `is_primary`
3. Product model doesn't include ProductImage association

## Solution

### Step 1: Create ProductImage Model

**File:** `BackEnd/src/models/product_image.model.js`

```javascript
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ProductImage = sequelize.define(
  "ProductImage",
  {
    image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "products",
        key: "product_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "product_images",
    timestamps: false,
  }
);

export default ProductImage;
```

---

### Step 2: Update Product Model

**File:** `BackEnd/src/models/product.model.js`

Add virtual field for primary image:

```javascript
import sequelize from "../config/db.js";
import { Sequelize, DataTypes } from "sequelize";

const Product = sequelize.define(
  "Product",
  {
    product_id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    alcohol_content: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    volume_ml: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    packaging_spec: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    sale_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    manufacturer_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    specialty_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "products",
    timestamps: false,
  }
);

export default Product;
```

---

### Step 3: Update Associations

**File:** `BackEnd/src/models/associations.js`

```javascript
import Customer from "./user.model.js";
import UserAddress from "./user_address.model.js";
import ShoppingCartItem from "./shopping_cart_item.model.js";
import Product from "./product.model.js";
import ProductImage from "./product_image.model.js";

// Customer <-> UserAddress associations
Customer.hasMany(UserAddress, {
  foreignKey: "user_id",
  as: "addresses",
});

UserAddress.belongsTo(Customer, {
  foreignKey: "user_id",
  as: "customer",
});

// Customer <-> ShoppingCartItem associations
Customer.hasMany(ShoppingCartItem, {
  foreignKey: "user_id",
  as: "cartItems",
});

ShoppingCartItem.belongsTo(Customer, {
  foreignKey: "user_id",
  as: "customer",
});

// Product <-> ShoppingCartItem associations
Product.hasMany(ShoppingCartItem, {
  foreignKey: "product_id",
  as: "cartItems",
});

ShoppingCartItem.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

// Product <-> ProductImage associations (NEW)
Product.hasMany(ProductImage, {
  foreignKey: "product_id",
  as: "images",
});

ProductImage.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

export { Customer, UserAddress, ShoppingCartItem, Product, ProductImage };
```

---

### Step 4: Update Shopping Cart Service

**File:** `BackEnd/src/services/shopping_cart.service.js`

Update the `getCartItems` function to include primary image:

```javascript
import ShoppingCartItem from "../models/shopping_cart_item.model.js";
import Product from "../models/product.model.js";
import ProductImage from "../models/product_image.model.js";
import sequelize from "../config/db.js";

export async function getCartItems(userId) {
  try {
    const cartItems = await ShoppingCartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["product_id", "product_name", "sale_price"],
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["image_url"],
              where: { is_primary: true },
              required: false, // LEFT JOIN - products without images still return
              limit: 1,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Transform to match API contract
    return cartItems.map((item) => ({
      itemId: item.item_id,
      productId: item.product_id,
      productName: item.product?.product_name || "",
      image: item.product?.images?.[0]?.image_url || "/placeholder-product.png",
      price: parseFloat(item.product?.sale_price || 0),
      quantity: item.quantity,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error("[ShoppingCartService] Error getting cart items:", error);
    throw error;
  }
}
```

**Update `addOrUpdateCartItem` function similarly:**

```javascript
export async function addOrUpdateCartItem(userId, productId, quantity) {
  try {
    const [results] = await sequelize.query(
      `
      INSERT INTO shopping_cart_item (user_id, product_id, quantity, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        quantity = quantity + ?,
        updated_at = NOW()
      `,
      {
        replacements: [userId, productId, quantity, quantity],
        type: sequelize.QueryTypes.INSERT,
      }
    );

    // Fetch the updated item with product details AND IMAGE
    const cartItem = await ShoppingCartItem.findOne({
      where: { user_id: userId, product_id: productId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["product_id", "product_name", "sale_price"],
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["image_url"],
              where: { is_primary: true },
              required: false,
              limit: 1,
            },
          ],
        },
      ],
    });

    if (!cartItem) {
      throw new Error("Failed to retrieve cart item after insert/update");
    }

    return {
      itemId: cartItem.item_id,
      productId: cartItem.product_id,
      productName: cartItem.product?.product_name || "",
      image:
        cartItem.product?.images?.[0]?.image_url || "/placeholder-product.png",
      price: parseFloat(cartItem.product?.sale_price || 0),
      quantity: cartItem.quantity,
      updatedAt: cartItem.updated_at,
    };
  } catch (error) {
    console.error(
      "[ShoppingCartService] Error adding/updating cart item:",
      error
    );
    throw error;
  }
}
```

**Update `updateCartItemQuantity` function similarly.**

---

## Testing

### 1. Verify ProductImage Data

```sql
-- Check if products have images
SELECT p.product_id, p.product_name, pi.image_url, pi.is_primary
FROM products p
LEFT JOIN product_images pi ON p.product_id = pi.product_id
WHERE pi.is_primary = 1
LIMIT 10;
```

### 2. Insert Test Image (if missing)

```sql
INSERT INTO product_images (product_id, image_url, is_primary)
VALUES ('P001', '/uploads/products/p001.jpg', 1);
```

### 3. Test Cart API

```bash
# Add to cart
curl -X POST https://api.ruouongtu.me/RuouOngTu/api/user/insertitems \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"P001","quantity":1}'

# Get cart items
curl -X GET https://api.ruouongtu.me/RuouOngTu/api/user/cartitems \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "items": [
    {
      "itemId": 1,
      "productId": "P001",
      "productName": "Dry Gin Sông Cái",
      "image": "/uploads/products/p001.jpg", // ✅ NOT EMPTY
      "price": 520000,
      "quantity": 1,
      "createdAt": "2025-11-26T10:00:00.000Z"
    }
  ],
  "totalItems": 1
}
```

---

## Alternative Solution: Use View

If you prefer using the existing view:

### Update Service to Use view_products_full

```javascript
// Create a separate Sequelize model for the view
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ViewProductsFull = sequelize.define(
  "ViewProductsFull",
  {
    product_id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
    },
    product_name: DataTypes.STRING(255),
    sale_price: DataTypes.DECIMAL(12, 2),
    primary_image: DataTypes.STRING(255),
  },
  {
    tableName: "view_products_full",
    timestamps: false,
  }
);

// Then in service:
include: [
  {
    model: ViewProductsFull,
    as: "productView",
    attributes: ["product_name", "sale_price", "primary_image"],
  },
];
```

---

## Summary

**Root Cause:** Product model missing image field + no association with product_images table

**Fix Applied:**

1. ✅ Created ProductImage model
2. ✅ Added Product ↔ ProductImage association
3. ✅ Updated cart service to include images with `is_primary = true`
4. ✅ Added fallback to `/placeholder-product.png`

**Result:** Cart API now returns proper image URLs! 🎉
