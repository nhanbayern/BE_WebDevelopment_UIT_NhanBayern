import * as orderService from "../services/order.service.js";

/**
 * POST /orders/create
 * Create a new order with selected items
 */
export const createOrder = async (req, res) => {
  try {
    const user_id = req.user?.user_id; // From auth middleware

    if (!user_id) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Vui lòng đăng nhập để tạo đơn hàng",
      });
    }

    const {
      items,
      shipping_address_id,
      shipping_address,
      payment_method,
      recipient_name,
      recipient_phone,
    } = req.body;

    // Input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng cung cấp ít nhất 1 sản phẩm",
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng chọn phương thức thanh toán",
      });
    }

    const trimmedRecipientName =
      typeof recipient_name === "string" ? recipient_name.trim() : "";
    const trimmedRecipientPhone =
      typeof recipient_phone === "string" ? recipient_phone.trim() : "";

    if (!trimmedRecipientName) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng nhập họ tên người nhận",
      });
    }

    if (!trimmedRecipientPhone) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng nhập số điện thoại người nhận",
      });
    }

    if (!shipping_address_id && !shipping_address) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng cung cấp địa chỉ giao hàng",
      });
    }

    const normalizedShippingAddress =
      typeof shipping_address === "string" ? shipping_address.trim() : "";

    // Call service
    const result = await orderService.createOrder({
      user_id,
      items,
      shipping_address_id,
      shipping_address: normalizedShippingAddress,
      payment_method,
      recipient_name: trimmedRecipientName,
      recipient_phone: trimmedRecipientPhone,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("[OrderController] createOrder error:", error);

    if (error.code) {
      const statusCode =
        {
          INVALID_INPUT: 400,
          CUSTOMER_NOT_FOUND: 404,
          INVALID_ADDRESS: 400,
          PRODUCT_NOT_FOUND: 404,
          INSUFFICIENT_QUANTITY: 400,
          UNAUTHORIZED: 401,
        }[error.code] || 500;

      return res.status(statusCode).json({
        error: error.code,
        message: error.message,
        product_id: error.product_id,
        product_name: error.product_name,
        requested: error.requested,
        available: error.available,
      });
    }

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Có lỗi xảy ra khi tạo đơn hàng",
    });
  }
};

/**
 * GET /orders
 * Get all orders of authenticated user
 */
export const getOrders = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Vui lòng đăng nhập",
      });
    }

    const orders = await orderService.getOrdersByCustomer(user_id);

    return res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    console.error("[OrderController] getOrders error:", error);
    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Có lỗi xảy ra khi lấy danh sách đơn hàng",
    });
  }
};

/**
 * GET /orders/:order_id
 * Get order detail
 */
export const getOrderDetail = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { order_id } = req.params;

    if (!user_id) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Vui lòng đăng nhập",
      });
    }

    const order = await orderService.getOrderDetail(order_id);

    // Check if order belongs to user
    if (order.customer_id !== user_id) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Bạn không có quyền xem đơn hàng này",
      });
    }

    return res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("[OrderController] getOrderDetail error:", error);

    if (error.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        error: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Có lỗi xảy ra khi lấy chi tiết đơn hàng",
    });
  }
};

/**
 * PATCH /orders/:order_id/status
 * Update order status (admin/staff only)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { order_status } = req.body;

    if (!order_status) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng cung cấp trạng thái đơn hàng",
      });
    }

    const result = await orderService.updateOrderStatus(order_id, order_status);

    return res.status(200).json(result);
  } catch (error) {
    console.error("[OrderController] updateOrderStatus error:", error);

    if (error.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        error: error.code,
        message: error.message,
      });
    }

    if (error.code === "INVALID_STATUS") {
      return res.status(400).json({
        error: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng",
    });
  }
};

/**
 * PATCH /orders/:order_id/payment-status
 * Update payment status
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "Vui lòng cung cấp trạng thái thanh toán",
      });
    }

    const result = await orderService.updatePaymentStatus(
      order_id,
      payment_status
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("[OrderController] updatePaymentStatus error:", error);

    if (error.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        error: error.code,
        message: error.message,
      });
    }

    if (error.code === "INVALID_STATUS") {
      return res.status(400).json({
        error: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Có lỗi xảy ra khi cập nhật thanh toán",
    });
  }
};
