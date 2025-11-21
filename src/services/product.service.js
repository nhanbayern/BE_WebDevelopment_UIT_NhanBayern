// src/services/product.service.js
// 💼 Service xử lý nghiệp vụ cho đối tượng Product (sản phẩm)

import Product from "../models/product.model.js";

/**
 * 📦 Lấy danh sách tất cả sản phẩm (có phân trang)
 */
export async function getAllProducts({ page = 1, limit = 20 } = {}) {
  // ✅ Validate đầu vào
  if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
    const error = new Error("Tham số phân trang không hợp lệ");
    error.status = 400;
    throw error;
  }

  const offset = (page - 1) * limit;

  // ✅ Query DB
  const { count, rows } = await Product.findAndCountAll({
    limit,
    offset,
    order: [["product_id", "ASC"]],
  });

  // ✅ Trả về cấu trúc RESTful chuẩn
  return {
    page,
    limit,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    products: rows,
  };
}

/**
 * 🔍 Lấy thông tin sản phẩm theo ID
 */
export async function getProductById(id) {
  if (!id) {
    const error = new Error("Thiếu product_id");
    error.status = 400;
    throw error;
  }

  const product = await Product.findByPk(id);

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  return product;
}

/**
 * 🆕 Tạo mới sản phẩm
 */
export async function createProduct(data) {
  // ✅ Kiểm tra dữ liệu bắt buộc
  const requiredFields = [
    "product_name",
    "cost_price",
    "sale_price",
    "manufacturer_id",
    "specialty_id",
  ];
  for (const field of requiredFields) {
    if (!data[field]) {
      const error = new Error(`Thiếu trường bắt buộc: ${field}`);
      error.status = 400;
      throw error;
    }
  }

  // ✅ Kiểm tra giá bán ≥ giá nhập
  if (parseFloat(data.sale_price) < parseFloat(data.cost_price)) {
    const error = new Error("Giá bán không được nhỏ hơn giá nhập");
    error.status = 400;
    throw error;
  }

  // ✅ Kiểm tra trùng tên sản phẩm
  const existing = await Product.findOne({
    where: { product_name: data.product_name },
  });
  if (existing) {
    const error = new Error("Tên sản phẩm đã tồn tại");
    error.status = 409;
    throw error;
  }

  // ✅ Tạo sản phẩm mới
  const newProduct = await Product.create(data);
  return newProduct;
}

/**
 * ✏️ Cập nhật sản phẩm
 */
export async function updateProduct(id, data) {
  if (!id) {
    const error = new Error("Thiếu product_id để cập nhật");
    error.status = 400;
    throw error;
  }

  const product = await Product.findByPk(id);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  // ✅ Nếu có thay đổi giá, kiểm tra logic giá bán ≥ giá nhập
  if (
    data.cost_price &&
    data.sale_price &&
    parseFloat(data.sale_price) < parseFloat(data.cost_price)
  ) {
    const error = new Error("Giá bán không được nhỏ hơn giá nhập");
    error.status = 400;
    throw error;
  }

  // ✅ Cập nhật sản phẩm
  await product.update(data);
  return product;
}

/**
 * 🗑️ Xóa sản phẩm
 */
export async function deleteProduct(id) {
  if (!id) {
    const error = new Error("Thiếu product_id để xóa");
    error.status = 400;
    throw error;
  }

  const product = await Product.findByPk(id);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  await product.destroy();
  return { success: true };
}
