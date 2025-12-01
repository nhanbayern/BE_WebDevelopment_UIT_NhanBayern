// src/services/product.service.js
// 💼 Service xử lý nghiệp vụ cho đối tượng Product (sản phẩm)

import Product from "../models/product.model.js";
import sequelize from "../config/db.js";

/**
 * 📦 Lấy danh sách tất cả sản phẩm (có phân trang, tìm kiếm, và lọc)
 */
export async function getAllProducts({
  page = 1,
  limit = 10,
  keyword,
  category,
} = {}) {
  // ✅ Validate đầu vào
  if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
    const error = new Error("Tham số phân trang không hợp lệ");
    error.status = 400;
    throw error;
  }

  const offset = (page - 1) * limit;

  // Build WHERE clause for filtering
  let whereClause = "";
  const replacements = [];

  if (keyword) {
    whereClause += " WHERE name LIKE ?";
    replacements.push(`%${keyword}%`);
  }

  if (category) {
    whereClause += whereClause ? " AND category = ?" : " WHERE category = ?";
    replacements.push(category);
  }

  // Use view_products for READ operations
  const [countResult] = await sequelize.query(
    `SELECT COUNT(*) as count FROM view_products${whereClause}`,
    { replacements: [...replacements] }
  );
  const totalItems = parseInt(countResult[0].count || 0, 10);

  const [rows] = await sequelize.query(
    `SELECT * FROM view_products${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
    {
      replacements: [
        ...replacements,
        parseInt(limit, 10),
        parseInt(offset, 10),
      ],
    }
  );

  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
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
  // Read from view_products
  const [rows] = await sequelize.query(
    `SELECT * FROM view_products WHERE id = ? LIMIT 1`,
    { replacements: [id] }
  );

  const product = rows[0] || null;
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  return product;
}

/**
 * Lấy sản phẩm theo region (sử dụng column `region` từ view)
 */
export async function getProductsByRegion(
  region,
  { page = 1, limit = 10 } = {}
) {
  if (!region) {
    const error = new Error("Thiếu region");
    error.status = 400;
    throw error;
  }

  const offset = (page - 1) * limit;

  const [rows] = await sequelize.query(
    `SELECT * FROM view_products WHERE region = ? ORDER BY id ASC LIMIT ? OFFSET ?`,
    {
      replacements: [region, parseInt(limit, 10), parseInt(offset, 10)],
    }
  );

  return rows;
}
