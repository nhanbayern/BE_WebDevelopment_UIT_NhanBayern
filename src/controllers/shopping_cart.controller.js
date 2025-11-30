import { validationResult } from "express-validator";
import * as ShoppingCartService from "../services/shopping_cart.service.js";

/**
 * GET /user/cartitems
 * Get all cart items for authenticated user
 */
export async function getCartItemsController(req, res) {
  try {
    // JWT payload contains user_id (snake_case), not userId
    if (!req.user || !req.user.user_id) {
      console.error(
        "[CartController] req.user or user_id is missing:",
        req.user
      );
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.user_id;

    console.log("[CartController] Getting cart items for user:", userId);

    const items = await ShoppingCartService.getCartItems(userId);

    return res.status(200).json({
      success: true,
      items,
      totalItems: items.length,
    });
  } catch (error) {
    console.error("[CartController] Error getting cart items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve cart items",
      error: error.message,
    });
  }
}

/**
 * POST /user/insertitems
 * Add item to cart or update quantity if exists
 */
export async function insertCartItemController(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Critical: Check if user is authenticated
    // JWT payload contains user_id (snake_case), not userId
    if (!req.user || !req.user.user_id) {
      console.error(
        "[CartController] req.user or user_id is missing:",
        req.user
      );
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.user_id;
    const { productId, quantity } = req.body;

    console.log("[CartController] Adding item to cart:", {
      userId,
      productId,
      quantity,
    });

    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const item = await ShoppingCartService.addOrUpdateCartItem(
      userId,
      productId,
      quantity
    );

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      item,
    });
  } catch (error) {
    console.error("[CartController] Error adding cart item:", error);

    // Handle duplicate key errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Item already exists in cart",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
}

/**
 * PUT /user/cartitems/:productId
 * Update cart item quantity (set to specific value)
 */
export async function updateCartItemController(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.user_id;
    const { productId } = req.params;
    const { quantity } = req.body;

    console.log("[CartController] Updating cart item:", {
      userId,
      productId,
      quantity,
    });

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const item = await ShoppingCartService.updateCartItemQuantity(
      userId,
      productId,
      quantity
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      item,
    });
  } catch (error) {
    console.error("[CartController] Error updating cart item:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    });
  }
}

/**
 * DELETE /user/cartitems/:productId
 * Remove item from cart
 */
export async function removeCartItemController(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.user_id;
    const { productId } = req.params;

    console.log("[CartController] Removing cart item:", { userId, productId });

    const deleted = await ShoppingCartService.removeCartItem(userId, productId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    console.error("[CartController] Error removing cart item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
      error: error.message,
    });
  }
}

/**
 * POST /user/incrementby1/:productId
 * Increment cart item quantity by 1
 */
export async function incrementByOneController(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.user_id;
    const { productId } = req.params;

    console.log("[CartController] Incrementing cart item:", {
      userId,
      productId,
    });

    const item = await ShoppingCartService.incrementByOne(userId, productId);

    return res.status(200).json({
      success: true,
      message: "Quantity incremented successfully",
      item,
    });
  } catch (error) {
    console.error("[CartController] Error incrementing cart item:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to increment quantity",
      error: error.message,
    });
  }
}

/**
 * POST /user/decrementby1/:productId
 * Decrement cart item quantity by 1 (minimum 1)
 */
export async function decrementByOneController(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.user_id;
    const { productId } = req.params;

    console.log("[CartController] Decrementing cart item:", {
      userId,
      productId,
    });

    const item = await ShoppingCartService.decrementByOne(userId, productId);

    return res.status(200).json({
      success: true,
      message: "Quantity decremented successfully",
      item,
    });
  } catch (error) {
    console.error("[CartController] Error decrementing cart item:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to decrement quantity",
      error: error.message,
    });
  }
}

/**
 * DELETE /user/cartitems
 * Clear all cart items for user
 */
export async function clearCartController(req, res) {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.user_id;

    console.log("[CartController] Clearing cart for user:", userId);

    const deletedCount = await ShoppingCartService.clearCart(userId);

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      deletedCount,
    });
  } catch (error) {
    console.error("[CartController] Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
}
