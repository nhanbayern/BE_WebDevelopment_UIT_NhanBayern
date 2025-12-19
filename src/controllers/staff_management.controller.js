import * as staffManagementService from "../services/staff_management.service.js";

/**
 * Staff Management Controller
 * Handles staff operations on orders, customers, products, manufacturers, payments
 */

// ==================== ORDER MANAGEMENT ====================

export async function getAllOrders(req, res) {
  try {
    const filters = {
      status: req.query.status,
      customer_id: req.query.customer_id,
    };

    const result = await staffManagementService.getAllOrders(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get all orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đơn hàng",
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const { order_id } = req.params;

    const result = await staffManagementService.getOrderById(order_id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get order error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin đơn hàng",
    });
  }
}

export async function getOrderDetails(req, res) {
  try {
    const { order_id } = req.params;

    const result = await staffManagementService.getOrderDetails(order_id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get order details error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết đơn hàng",
    });
  }
}

export async function updateOrder(req, res) {
  try {
    const { order_id } = req.params;
    const staff_id = req.staff.staff_id;
    const updateData = req.body;

    const result = await staffManagementService.updateOrder(
      order_id,
      updateData,
      staff_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Update order error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật đơn hàng",
    });
  }
}

// ==================== CUSTOMER MANAGEMENT ====================

export async function getAllCustomers(req, res) {
  try {
    const result = await staffManagementService.getAllCustomers();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get all customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách khách hàng",
    });
  }
}

export async function getCustomerById(req, res) {
  try {
    const { customer_id } = req.params;

    const result = await staffManagementService.getCustomerById(customer_id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin khách hàng",
    });
  }
}

export async function updateCustomer(req, res) {
  try {
    const { customer_id } = req.params;
    const staff_id = req.staff.staff_id;
    const updateData = req.body;

    const result = await staffManagementService.updateCustomer(
      customer_id,
      updateData,
      staff_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Update customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật khách hàng",
    });
  }
}

// ==================== PRODUCT MANAGEMENT ====================

export async function getAllProducts(req, res) {
  try {
    const result = await staffManagementService.getAllProducts();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get all products error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
}

export async function getProductById(req, res) {
  try {
    const { product_id } = req.params;

    const result = await staffManagementService.getProductById(product_id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get product error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin sản phẩm",
    });
  }
}

export async function createProduct(req, res) {
  try {
    const staff_id = req.staff.staff_id;
    const productData = req.body;
    const imageFile = req.file; // From multer middleware

    const result = await staffManagementService.createProduct(
      productData,
      imageFile,
      staff_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo sản phẩm",
    });
  }
}

export async function updateProduct(req, res) {
  try {
    const { product_id } = req.params;
    const staff_id = req.staff.staff_id;
    const productData = req.body;
    const imageFile = req.file; // From multer middleware

    const result = await staffManagementService.updateProduct(
      product_id,
      productData,
      imageFile,
      staff_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Update product error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật sản phẩm",
    });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { product_id } = req.params;
    const staff_id = req.staff.staff_id;

    const result = await staffManagementService.deleteProduct(
      product_id,
      staff_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Delete product error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sản phẩm",
    });
  }
}

// ==================== MANUFACTURER MANAGEMENT ====================

export async function getAllManufacturers(req, res) {
  try {
    const result = await staffManagementService.getAllManufacturers();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "[StaffManagementController] Get all manufacturers error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhà sản xuất",
    });
  }
}

export async function createManufacturer(req, res) {
  try {
    const manufacturerData = req.body;

    const result = await staffManagementService.createManufacturer(
      manufacturerData
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "[StaffManagementController] Create manufacturer error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo nhà sản xuất",
    });
  }
}

export async function updateManufacturer(req, res) {
  try {
    const { manufacturer_id } = req.params;
    const manufacturerData = req.body;

    const result = await staffManagementService.updateManufacturer(
      manufacturer_id,
      manufacturerData
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "[StaffManagementController] Update manufacturer error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật nhà sản xuất",
    });
  }
}

export async function deleteManufacturer(req, res) {
  try {
    const { manufacturer_id } = req.params;

    const result = await staffManagementService.deleteManufacturer(
      manufacturer_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "[StaffManagementController] Delete manufacturer error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa nhà sản xuất",
    });
  }
}

// ==================== PAYMENT MANAGEMENT ====================

export async function getAllPayments(req, res) {
  try {
    const filters = {
      status: req.query.status,
      method: req.query.method,
    };

    const result = await staffManagementService.getAllPayments(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Get all payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thanh toán",
    });
  }
}

export async function updatePaymentStatus(req, res) {
  try {
    const { payment_id } = req.params;
    const staff_id = req.staff.staff_id;
    const { payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái thanh toán mới",
      });
    }

    const result = await staffManagementService.updatePaymentStatus(
      payment_id,
      payment_status,
      staff_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffManagementController] Update payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thanh toán",
    });
  }
}
