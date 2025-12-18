import ShoppingCartItem from "../models/shopping_cart_item.model.js";
import Product from "../models/product.model.js";
import sequelize from "../config/db.js";

/**
 * Shopping Cart Service
 * UPDATED: Uses customer_id instead of user_id
 */

/**
 * Get all cart items for a user with product details
 * @param {string} userId - Customer ID (user_id for backward compat)
 * @returns {Promise<Array>} Array of cart items with product info
 */
export async function getCartItems(userId) {
  try {
    const cartItems = await ShoppingCartItem.findAll({
      where: { customer_id: userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "sale_price",
            "image",
            "stock",
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
      image: item.product?.image || "",
      price: parseFloat(item.product?.sale_price || 0),
      quantity: item.quantity,
      stock:
        typeof item.product?.stock === "number" ? item.product.stock : null,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error("[ShoppingCartService] Error getting cart items:", error);
    throw error;
  }
}

/**
 * Add item to cart or update quantity if exists
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for concurrency safety (UPDATED to use customer_id)
 * @param {string} userId - Customer ID
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Created/updated cart item
 */
export async function addOrUpdateCartItem(userId, productId, quantity) {
  try {
    // UPDATED: Use customer_id instead of user_id
    const [results] = await sequelize.query(
      `
      INSERT INTO shopping_cart_item (customer_id, product_id, quantity, created_at, updated_at)
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

    // Fetch the updated item with product details
    const cartItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "sale_price",
            "image",
            "stock",
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
      image: cartItem.product?.image || "",
      price: parseFloat(cartItem.product?.sale_price || 0),
      quantity: cartItem.quantity,
      stock:
        typeof cartItem.product?.stock === "number"
          ? cartItem.product.stock
          : null,
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

/**
 * Update cart item quantity directly (set to specific value) (UPDATED)
 * @param {string} userId - Customer ID
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart item
 */
export async function updateCartItemQuantity(userId, productId, quantity) {
  try {
    const cartItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    // Fetch with product details
    const updatedItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "sale_price",
            "image",
            "stock",
          ],
        },
      ],
    });

    return {
      itemId: updatedItem.item_id,
      productId: updatedItem.product_id,
      productName: updatedItem.product?.product_name || "",
      image: updatedItem.product?.image || "",
      price: parseFloat(updatedItem.product?.sale_price || 0),
      quantity: updatedItem.quantity,
      stock:
        typeof updatedItem.product?.stock === "number"
          ? updatedItem.product.stock
          : null,
      updatedAt: updatedItem.updated_at,
    };
  } catch (error) {
    console.error(
      "[ShoppingCartService] Error updating cart item quantity:",
      error
    );
    throw error;
  }
}

/**
 * Remove item from cart (UPDATED)
 * @param {string} userId - Customer ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeCartItem(userId, productId) {
  try {
    const deleted = await ShoppingCartItem.destroy({
      where: { customer_id: userId, product_id: productId },
    });

    return deleted > 0;
  } catch (error) {
    console.error("[ShoppingCartService] Error removing cart item:", error);
    throw error;
  }
}

/**
 * Increment cart item quantity by 1 (UPDATED)
 * @param {string} userId - Customer ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Updated cart item
 */
export async function incrementByOne(userId, productId) {
  try {
    const cartItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    cartItem.quantity += 1;
    await cartItem.save();

    // Fetch with product details
    const updatedItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "sale_price",
            "image",
            "stock",
          ],
        },
      ],
    });

    return {
      itemId: updatedItem.item_id,
      productId: updatedItem.product_id,
      productName: updatedItem.product?.product_name || "",
      image: updatedItem.product?.image || "",
      price: parseFloat(updatedItem.product?.sale_price || 0),
      quantity: updatedItem.quantity,
      stock:
        typeof updatedItem.product?.stock === "number"
          ? updatedItem.product.stock
          : null,
      updatedAt: updatedItem.updated_at,
    };
  } catch (error) {
    console.error("[ShoppingCartService] Error incrementing cart item:", error);
    throw error;
  }
}

/**
 * Decrement cart item quantity by 1 (minimum 1) (UPDATED)
 * @param {string} userId - Customer ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Updated cart item
 */
export async function decrementByOne(userId, productId) {
  try {
    const cartItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // Ensure quantity doesn't go below 1
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      await cartItem.save();
    }

    // Fetch with product details
    const updatedItem = await ShoppingCartItem.findOne({
      where: { customer_id: userId, product_id: productId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "sale_price",
            "image",
            "stock",
          ],
        },
      ],
    });

    return {
      itemId: updatedItem.item_id,
      productId: updatedItem.product_id,
      productName: updatedItem.product?.product_name || "",
      image: updatedItem.product?.image || "",
      price: parseFloat(updatedItem.product?.sale_price || 0),
      quantity: updatedItem.quantity,
      stock:
        typeof updatedItem.product?.stock === "number"
          ? updatedItem.product.stock
          : null,
      updatedAt: updatedItem.updated_at,
    };
  } catch (error) {
    console.error("[ShoppingCartService] Error decrementing cart item:", error);
    throw error;
  }
}

/**
 * Clear all cart items for a user (UPDATED)
 * @param {string} userId - Customer ID
 * @returns {Promise<number>} Number of deleted items
 */
export async function clearCart(userId) {
  try {
    const deleted = await ShoppingCartItem.destroy({
      where: { customer_id: userId },
    });

    return deleted;
  } catch (error) {
    console.error("[ShoppingCartService] Error clearing cart:", error);
    throw error;
  }
}
