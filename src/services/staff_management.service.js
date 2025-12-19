import Customer from "../models/user.model.js";
import Order from "../models/order.model.js";
import OrderDetail from "../models/order_detail.model.js";
import Product from "../models/product.model.js";
import Manufacturer from "../models/manufacturer.model.js";
import Payment from "../models/payment.model.js";
import CustomerAudit from "../models/customer_audit.model.js";
import OrderAudit from "../models/order_audit.model.js";
import ProductAudit from "../models/product_audit.model.js";
import PaymentAudit from "../models/payment_audit.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

/**
 * Staff Management Service
 * Handles staff operations on customers, orders, products, manufacturers, payments
 */

// ==================== ORDER MANAGEMENT ====================

/**
 * Get all orders with optional filters
 */
export async function getAllOrders(filters = {}) {
  try {
    const where = {};

    if (filters.status) {
      where.order_status = filters.status;
    }

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customer_id", "customername", "email", "phone_number"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return { success: true, orders };
  } catch (error) {
    console.error("[StaffManagementService] Get all orders error:", error);
    return { success: false, message: "Lỗi khi lấy danh sách đơn hàng" };
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(order_id) {
  try {
    const order = await Order.findByPk(order_id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customer_id", "customername", "email", "phone_number"],
        },
      ],
    });

    if (!order) {
      return { success: false, message: "Đơn hàng không tồn tại" };
    }

    return { success: true, order };
  } catch (error) {
    console.error("[StaffManagementService] Get order error:", error);
    return { success: false, message: "Lỗi khi lấy thông tin đơn hàng" };
  }
}

/**
 * Get order details with product information
 */
export async function getOrderDetails(order_id) {
  try {
    const orderDetails = await OrderDetail.findAll({
      where: { order_id },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "image",
            "sale_price",
            "stock",
          ],
        },
      ],
    });

    if (!orderDetails || orderDetails.length === 0) {
      return { success: false, message: "Không tìm thấy chi tiết đơn hàng" };
    }

    // Format response
    const details = orderDetails.map((detail) => ({
      product_id: detail.product_id,
      product_name: detail.product?.product_name || "N/A",
      image: detail.product?.image || null,
      sale_price: detail.product?.sale_price ? parseFloat(detail.product.sale_price) : 0,
      unit_price: parseFloat(detail.unit_price),
      quantity: detail.quantity,
      total_price: parseFloat(detail.total_price),
    }));

    return { success: true, orderDetails: details };
  } catch (error) {
    console.error("[StaffManagementService] Get order details error:", error);
    return { success: false, message: "Lỗi khi lấy chi tiết đơn hàng" };
  }
}

/**
 * Update order information (status, shipping, notes)
 * DO NOT allow deletion
 */
export async function updateOrder(order_id, updateData, staff_id) {
  try {
    const order = await Order.findByPk(order_id);

    if (!order) {
      return { success: false, message: "Đơn hàng không tồn tại" };
    }

    const oldStatus = order.order_status;
    const oldData = order.toJSON();

    // Update order
    const allowedFields = [
      "order_status",
      "shipping_partner",
      "shipping_address",
      "recipient_name",
      "recipient_phone",
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    await order.update(updateFields);

    // Log audit trail if status changed
    if (updateData.order_status && updateData.order_status !== oldStatus) {
      await OrderAudit.create({
        order_id,
        staff_id,
        old_status: oldStatus,
        new_status: updateData.order_status,
        note: updateData.note || null,
      });
    }

    return {
      success: true,
      message: "Cập nhật đơn hàng thành công",
      order: order.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Update order error:", error);
    return { success: false, message: "Lỗi khi cập nhật đơn hàng" };
  }
}

// ==================== CUSTOMER MANAGEMENT ====================

/**
 * Get all customers
 */
export async function getAllCustomers() {
  try {
    const customers = await Customer.findAll({
      attributes: {
        exclude: ["password_hash", "google_id"], // Don't expose sensitive data
      },
      order: [["created_at", "DESC"]],
    });

    return { success: true, customers };
  } catch (error) {
    console.error("[StaffManagementService] Get all customers error:", error);
    return { success: false, message: "Lỗi khi lấy danh sách khách hàng" };
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customer_id) {
  try {
    const customer = await Customer.findByPk(customer_id, {
      attributes: {
        exclude: ["password_hash", "google_id"],
      },
    });

    if (!customer) {
      return { success: false, message: "Khách hàng không tồn tại" };
    }

    return { success: true, customer };
  } catch (error) {
    console.error("[StaffManagementService] Get customer error:", error);
    return { success: false, message: "Lỗi khi lấy thông tin khách hàng" };
  }
}

/**
 * Update customer information
 * Only allow: name, phone, email
 * DO NOT allow: deletion, password, google_id changes
 */
export async function updateCustomer(customer_id, updateData, staff_id) {
  try {
    const customer = await Customer.findByPk(customer_id);

    if (!customer) {
      return { success: false, message: "Khách hàng không tồn tại" };
    }

    const oldData = customer.toJSON();

    // Only allow specific fields
    const allowedFields = ["customername", "phone_number", "email"];
    const updateFields = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    // Validate email uniqueness if changed
    if (updateFields.email && updateFields.email !== customer.email) {
      const existingEmail = await Customer.findOne({
        where: { email: updateFields.email },
      });
      if (existingEmail) {
        return { success: false, message: "Email đã được sử dụng" };
      }
    }

    await customer.update(updateFields);

    // Log audit trail
    await CustomerAudit.create({
      customer_id,
      staff_id,
      action: "UPDATE",
      old_data: oldData,
      new_data: customer.toJSON(),
    });

    return {
      success: true,
      message: "Cập nhật thông tin khách hàng thành công",
      customer: customer.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Update customer error:", error);
    return { success: false, message: "Lỗi khi cập nhật khách hàng" };
  }
}

// ==================== PRODUCT MANAGEMENT ====================

/**
 * Get all products
 */
export async function getAllProducts() {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Manufacturer,
          as: "manufacturer",
          attributes: ["manufacturer_id", "manufacturer_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return { success: true, products };
  } catch (error) {
    console.error("[StaffManagementService] Get all products error:", error);
    return { success: false, message: "Lỗi khi lấy danh sách sản phẩm" };
  }
}

/**
 * Get product by ID
 */
export async function getProductById(product_id) {
  try {
    const product = await Product.findByPk(product_id, {
      include: [
        {
          model: Manufacturer,
          as: "manufacturer",
        },
      ],
    });

    if (!product) {
      return { success: false, message: "Sản phẩm không tồn tại" };
    }

    return { success: true, product };
  } catch (error) {
    console.error("[StaffManagementService] Get product error:", error);
    return { success: false, message: "Lỗi khi lấy thông tin sản phẩm" };
  }
}

/**
 * Create new product
 * With Cloudinary image upload
 */
export async function createProduct(productData, imageFile, staff_id) {
  try {
    // Generate product_id
    const product_id = `P${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (imageFile) {
      const uploadResult = await uploadToCloudinary(
        imageFile.buffer,
        "products",
        product_id
      );
      if (uploadResult.success) {
        imageUrl = uploadResult.secure_url;
      } else {
        return {
          success: false,
          message: "Lỗi khi upload ảnh sản phẩm",
        };
      }
    }

    // Create product
    const product = await Product.create({
      product_id,
      product_name: productData.product_name,
      image: imageUrl,
      alcohol_content: productData.alcohol_content,
      volume_ml: productData.volume_ml,
      packaging_spec: productData.packaging_spec,
      description: productData.description,
      long_description: productData.long_description,
      origin: productData.origin || "Việt Nam",
      cost_price: productData.cost_price,
      sale_price: productData.sale_price,
      stock: productData.stock || 0,
      category: productData.category,
      region: productData.region,
      manufacturer_id: productData.manufacturer_id,
    });

    // Log audit trail
    await ProductAudit.create({
      product_id,
      staff_id,
      action: "CREATE",
      old_data: null,
      new_data: product.toJSON(),
    });

    return {
      success: true,
      message: "Tạo sản phẩm thành công",
      product: product.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Create product error:", error);
    return { success: false, message: "Lỗi khi tạo sản phẩm" };
  }
}

/**
 * Update product
 * With optional image upload to Cloudinary
 */
export async function updateProduct(product_id, productData, imageFile, staff_id) {
  try {
    const product = await Product.findByPk(product_id);

    if (!product) {
      return { success: false, message: "Sản phẩm không tồn tại" };
    }

    const oldData = product.toJSON();

    // Handle image upload if provided
    if (imageFile) {
      // Delete old image from Cloudinary if exists
      if (product.image) {
        await deleteFromCloudinary(product.image);
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(
        imageFile.buffer,
        "products",
        product_id
      );

      if (uploadResult.success) {
        productData.image = uploadResult.secure_url;
      } else {
        return {
          success: false,
          message: "Lỗi khi upload ảnh sản phẩm mới",
        };
      }
    }

    // Update product
    await product.update(productData);

    // Log audit trail
    await ProductAudit.create({
      product_id,
      staff_id,
      action: "UPDATE",
      old_data: oldData,
      new_data: product.toJSON(),
    });

    return {
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: product.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Update product error:", error);
    return { success: false, message: "Lỗi khi cập nhật sản phẩm" };
  }
}

/**
 * Delete product
 */
export async function deleteProduct(product_id, staff_id) {
  try {
    const product = await Product.findByPk(product_id);

    if (!product) {
      return { success: false, message: "Sản phẩm không tồn tại" };
    }

    const oldData = product.toJSON();

    // Delete image from Cloudinary if exists
    if (product.image) {
      await deleteFromCloudinary(product.image);
    }

    // Delete product
    await product.destroy();

    // Log audit trail
    await ProductAudit.create({
      product_id,
      staff_id,
      action: "DELETE",
      old_data: oldData,
      new_data: null,
    });

    return { success: true, message: "Xóa sản phẩm thành công" };
  } catch (error) {
    console.error("[StaffManagementService] Delete product error:", error);
    return { success: false, message: "Lỗi khi xóa sản phẩm" };
  }
}

// ==================== MANUFACTURER MANAGEMENT ====================

/**
 * Get all manufacturers
 */
export async function getAllManufacturers() {
  try {
    const manufacturers = await Manufacturer.findAll({
      order: [["manufacturer_name", "ASC"]],
    });

    return { success: true, manufacturers };
  } catch (error) {
    console.error(
      "[StaffManagementService] Get all manufacturers error:",
      error
    );
    return { success: false, message: "Lỗi khi lấy danh sách nhà sản xuất" };
  }
}

/**
 * Create manufacturer
 */
export async function createManufacturer(manufacturerData) {
  try {
    // Generate manufacturer_id
    const manufacturer_id = `M${Date.now()}`;

    const manufacturer = await Manufacturer.create({
      manufacturer_id,
      ...manufacturerData,
    });

    return {
      success: true,
      message: "Tạo nhà sản xuất thành công",
      manufacturer: manufacturer.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Create manufacturer error:", error);
    return { success: false, message: "Lỗi khi tạo nhà sản xuất" };
  }
}

/**
 * Update manufacturer
 */
export async function updateManufacturer(manufacturer_id, manufacturerData) {
  try {
    const manufacturer = await Manufacturer.findByPk(manufacturer_id);

    if (!manufacturer) {
      return { success: false, message: "Nhà sản xuất không tồn tại" };
    }

    await manufacturer.update(manufacturerData);

    return {
      success: true,
      message: "Cập nhật nhà sản xuất thành công",
      manufacturer: manufacturer.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Update manufacturer error:", error);
    return { success: false, message: "Lỗi khi cập nhật nhà sản xuất" };
  }
}

/**
 * Delete manufacturer
 */
export async function deleteManufacturer(manufacturer_id) {
  try {
    const manufacturer = await Manufacturer.findByPk(manufacturer_id);

    if (!manufacturer) {
      return { success: false, message: "Nhà sản xuất không tồn tại" };
    }

    // Check if manufacturer has products
    const productCount = await Product.count({
      where: { manufacturer_id },
    });

    if (productCount > 0) {
      return {
        success: false,
        message: `Không thể xóa nhà sản xuất vì còn ${productCount} sản phẩm liên kết`,
      };
    }

    await manufacturer.destroy();

    return { success: true, message: "Xóa nhà sản xuất thành công" };
  } catch (error) {
    console.error("[StaffManagementService] Delete manufacturer error:", error);
    return { success: false, message: "Lỗi khi xóa nhà sản xuất" };
  }
}

// ==================== PAYMENT MANAGEMENT ====================

/**
 * Get all payments with optional filters
 */
export async function getAllPayments(filters = {}) {
  try {
    const where = {};

    if (filters.status) {
      where.payment_status = filters.status;
    }

    if (filters.method) {
      where.payment_method = filters.method;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["customer_id", "customername", "email"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return { success: true, payments };
  } catch (error) {
    console.error("[StaffManagementService] Get all payments error:", error);
    return { success: false, message: "Lỗi khi lấy danh sách thanh toán" };
  }
}

/**
 * Update payment status
 * DO NOT allow deletion
 */
export async function updatePaymentStatus(payment_id, newStatus, staff_id) {
  try {
    const payment = await Payment.findByPk(payment_id);

    if (!payment) {
      return { success: false, message: "Thanh toán không tồn tại" };
    }

    const oldStatus = payment.payment_status;

    await payment.update({ payment_status: newStatus });

    // Log audit trail
    await PaymentAudit.create({
      payment_id,
      staff_id,
      old_status: oldStatus,
      new_status: newStatus,
    });

    return {
      success: true,
      message: "Cập nhật trạng thái thanh toán thành công",
      payment: payment.toJSON(),
    };
  } catch (error) {
    console.error("[StaffManagementService] Update payment error:", error);
    return { success: false, message: "Lỗi khi cập nhật thanh toán" };
  }
}
