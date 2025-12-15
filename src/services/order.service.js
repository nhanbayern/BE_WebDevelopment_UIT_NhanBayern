import sequelize from "../config/db.js";
import Order from "../models/order.model.js";
import OrderDetail from "../models/order_detail.model.js";
import Product from "../models/product.model.js";
import Customer from "../models/user.model.js";
import UserAddress from "../models/user_address.model.js";
import ShoppingCartItem from "../models/shopping_cart_item.model.js";
import Payment from "../models/payment.model.js";

/**
 * Helper: Map new payment_status enum to legacy enum for API compatibility
 * NEW schema uses: 'Pending', 'Completed', 'Failed'
 * OLD API expects: 'Unpaid', 'Paid'
 */
const mapPaymentStatusToLegacy = (status) => {
  if (status === "Completed") return "Paid";
  return "Unpaid"; // Pending, Failed, or null -> Unpaid
};

/**
 * Helper: Map legacy payment_status to new schema enum
 * OLD API sends: 'Unpaid', 'Paid'
 * NEW schema uses: 'Pending', 'Completed', 'Failed'
 */
const mapLegacyToPaymentStatus = (legacyStatus) => {
  if (legacyStatus === "Paid") return "Completed";
  return "Pending"; // Unpaid -> Pending
};

/**
 * Helper: Transform order with payment to include legacy payment fields
 * This maintains backward compatibility with API responses
 */
const transformOrderWithPayment = (order) => {
  if (!order) return order;

  const plainOrder = order.toJSON ? order.toJSON() : { ...order };
  const payment = plainOrder.payment || null;

  // Add legacy payment fields to order object for API compatibility
  plainOrder.payment_method = payment?.payment_method || "Cash";
  plainOrder.payment_status = mapPaymentStatusToLegacy(payment?.payment_status);

  return plainOrder;
};

/**
 * Create order with items, validate stock, deduct inventory
 * POST /orders/create
 * 
 * REFACTORED: Now creates a separate Payment record instead of storing
 * payment info directly in the orders table.
 */
export const createOrder = async ({
  user_id,
  items, // [{ product_id, quantity }]
  shipping_address_id,
  shipping_address,
  payment_method,
  recipient_name,
  recipient_phone,
}) => {
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Validate input
    if (!user_id || !items || items.length === 0) {
      throw {
        code: "INVALID_INPUT",
        message: "Vui lòng cung cấp user_id và ít nhất 1 sản phẩm",
      };
    }

    const trimmedRecipientName =
      typeof recipient_name === "string" ? recipient_name.trim() : "";
    const trimmedRecipientPhone =
      typeof recipient_phone === "string" ? recipient_phone.trim() : "";

    if (!trimmedRecipientName) {
      throw {
        code: "INVALID_INPUT",
        message: "Vui lòng nhập họ tên người nhận",
      };
    }

    if (!trimmedRecipientPhone) {
      throw {
        code: "INVALID_INPUT",
        message: "Vui lòng nhập số điện thoại người nhận",
      };
    }

    // Check customer exists
    const customer = await Customer.findByPk(user_id, { transaction });
    if (!customer) {
      throw { code: "CUSTOMER_NOT_FOUND", message: "Khách hàng không tồn tại" };
    }

    // Resolve shipping address
    const normalizedShippingText =
      typeof shipping_address === "string" ? shipping_address.trim() : "";
    let shippingAddressStr = normalizedShippingText || null;

    const normalizedAddressId = Number.isFinite(Number(shipping_address_id))
      ? Number(shipping_address_id)
      : null;

    if (!shippingAddressStr && normalizedAddressId) {
      const address = await UserAddress.findOne({
        where: { address_id: normalizedAddressId, user_id },
        transaction,
      });

      if (!address) {
        throw {
          code: "INVALID_ADDRESS",
          message: "Địa chỉ giao hàng không hợp lệ",
        };
      }

      const parts = [
        address.address_line,
        address.ward,
        address.district,
        address.province,
      ].filter(Boolean);
      shippingAddressStr = parts.join(", ");
    }

    if (!shippingAddressStr) {
      throw {
        code: "INVALID_ADDRESS",
        message: "Vui lòng cung cấp địa chỉ giao hàng",
      };
    }

    const normalizedPaymentMethod =
      payment_method === "OnlineBanking" ? "OnlineBanking" : "Cash";

    // Step 2: Check stock for all products with FOR UPDATE lock
    const productIds = items.map((item) => item.product_id);
    const products = await Product.findAll({
      where: { product_id: productIds },
      transaction,
      lock: transaction.LOCK.UPDATE, // FOR UPDATE
    });

    const productMap = new Map(products.map((p) => [p.product_id, p]));

    // Validate each item
    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = productMap.get(item.product_id);

      if (!product) {
        throw {
          code: "PRODUCT_NOT_FOUND",
          product_id: item.product_id,
          message: `Sản phẩm ${item.product_id} không tồn tại`,
        };
      }

      if (product.stock < item.quantity) {
        throw {
          code: "INSUFFICIENT_QUANTITY",
          product_id: item.product_id,
          product_name: product.product_name,
          requested: item.quantity,
          available: product.stock,
          message: `Số lượng bạn chọn vượt quá số lượng tồn kho (Có sẵn: ${product.stock})`,
        };
      }

      const itemTotal = parseFloat(product.sale_price) * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.sale_price,
        total_price: itemTotal,
      });
    }

    const orderedProductIds = [
      ...new Set(validatedItems.map((item) => item.product_id)),
    ];

    // Step 3: Create order record (order_code will be generated by trigger)
    // NOTE: payment_method removed from orders table - now in payments table
    const order = await Order.create(
      {
        customer_id: user_id,
        recipient_name: trimmedRecipientName,
        recipient_phone: trimmedRecipientPhone,
        shipping_address: shippingAddressStr,
        total_amount: totalAmount,
        final_amount: totalAmount,
        // order_code will be NULL, trigger will populate it
      },
      { transaction }
    );

    // Step 3b: Create payment record in the new payments table
    // This replaces the old payment_method/payment_status columns in orders
    await Payment.create(
      {
        order_id: order.order_id,
        amount: totalAmount,
        payment_method: normalizedPaymentMethod,
        payment_status: "Pending", // Maps to legacy 'Unpaid'
        // transaction_id will be set by trigger or when payment completes
      },
      { transaction }
    );

    // Step 4: Create order details
    for (const item of validatedItems) {
      await OrderDetail.create(
        {
          order_id: order.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        },
        { transaction }
      );
    }

    // Step 5: Deduct inventory
    for (const item of validatedItems) {
      await Product.decrement("stock", {
        by: item.quantity,
        where: { product_id: item.product_id },
        transaction,
      });
    }

    // Step 6: Remove ordered items from shopping cart inside the same transaction
    if (orderedProductIds.length > 0) {
      await ShoppingCartItem.destroy({
        where: {
          user_id,
          product_id: orderedProductIds,
        },
        transaction,
      });
    }

    // Commit transaction
    await transaction.commit();

    // Step 7: Generate order_code in application (avoid trigger lock issues)
    // Format: ORD20250130-000001
    const orderCode = `ORD${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${String(order.order_id).padStart(6, "0")}`;
    await Order.update(
      { order_code: orderCode },
      { where: { order_id: order.order_id } }
    );

    // Step 8: Query order again to get updated order_code and payment info
    const createdOrder = await Order.findByPk(order.order_id, {
      include: [
        {
          model: OrderDetail,
          as: "orderDetails",
          include: [{ model: Product, as: "product" }],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });

    // Transform to include legacy payment fields for API compatibility
    const orderWithPayment = transformOrderWithPayment(createdOrder);

    return {
      status: "success",
      order_id: orderWithPayment.order_id,
      order_code: orderWithPayment.order_code,
      total_amount: orderWithPayment.total_amount,
      final_amount: orderWithPayment.final_amount,
      payment_method: orderWithPayment.payment_method,
      payment_status: orderWithPayment.payment_status,
      items: orderWithPayment.orderDetails,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get orders by customer
 * REFACTORED: Now includes payment data and transforms for API compatibility
 */
export const getOrdersByCustomer = async (user_id) => {
  const orders = await Order.findAll({
    where: { customer_id: user_id },
    include: [
      {
        model: OrderDetail,
        as: "orderDetails",
        include: [{ model: Product, as: "product" }],
      },
      {
        model: Payment,
        as: "payment",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Transform each order to include legacy payment fields
  return orders.map(transformOrderWithPayment);
};

/**
 * Get order detail
 * REFACTORED: Now includes payment data and transforms for API compatibility
 */
export const getOrderDetail = async (order_id) => {
  const order = await Order.findByPk(order_id, {
    include: [
      { model: Customer, as: "customer" },
      {
        model: OrderDetail,
        as: "orderDetails",
        include: [{ model: Product, as: "product" }],
      },
      {
        model: Payment,
        as: "payment",
      },
    ],
  });

  if (!order) {
    throw { code: "ORDER_NOT_FOUND", message: "Đơn hàng không tồn tại" };
  }

  // Transform to include legacy payment fields for API compatibility
  return transformOrderWithPayment(order);
};

/**
 * Update order status
 */
export const updateOrderStatus = async (order_id, order_status) => {
  const validStatuses = ["Preparing", "On delivery", "Delivered"];

  if (!validStatuses.includes(order_status)) {
    throw {
      code: "INVALID_STATUS",
      message: `Trạng thái đơn hàng phải là: ${validStatuses.join(", ")}`,
    };
  }

  const [updatedCount] = await Order.update(
    { order_status },
    { where: { order_id } }
  );

  if (updatedCount === 0) {
    throw { code: "ORDER_NOT_FOUND", message: "Đơn hàng không tồn tại" };
  }

  return { status: "success", message: "Cập nhật trạng thái thành công" };
};

/**
 * Update payment status
 * REFACTORED: Now updates the payments table instead of orders table
 * Maintains backward compatibility with legacy 'Unpaid'/'Paid' API values
 */
export const updatePaymentStatus = async (order_id, payment_status) => {
  const validStatuses = ["Unpaid", "Paid"];

  if (!validStatuses.includes(payment_status)) {
    throw {
      code: "INVALID_STATUS",
      message: `Trạng thái thanh toán phải là: ${validStatuses.join(", ")}`,
    };
  }

  // Map legacy status to new schema status
  const newPaymentStatus = mapLegacyToPaymentStatus(payment_status);

  // Update the payment record instead of order record
  const [updatedCount] = await Payment.update(
    { payment_status: newPaymentStatus },
    { where: { order_id } }
  );

  if (updatedCount === 0) {
    throw { code: "ORDER_NOT_FOUND", message: "Đơn hàng không tồn tại" };
  }

  return { status: "success", message: "Cập nhật thanh toán thành công" };
};
