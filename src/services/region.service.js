// src/services/region.service.js
// 💼 Service xử lý nghiệp vụ cho đối tượng Region (địa phương / vùng đặc sản)

import sequelize from "../config/db.js";
import Region from "../models/region.model.js";

/**
 * 🗺️ Lấy danh sách tất cả các vùng (specialties)
 */
export async function getAllRegions() {
  try {
    const regions = await Region.findAll({
      order: [["specialty_id", "ASC"]],
    });

    return regions;
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách vùng:", err);
    throw new Error("Không thể lấy danh sách vùng từ cơ sở dữ liệu");
  }
}

/**
 * 🏕️ Lấy thông tin chi tiết 1 vùng theo ID
 * @param {string} regionId - Mã vùng (specialty_id)
 */
export async function getRegionById(regionId) {
  try {
    if (!regionId) {
      const error = new Error("Thiếu specialty_id");
      error.status = 400;
      throw error;
    }

    const region = await Region.findByPk(regionId);

    if (!region) {
      const error = new Error("Không tìm thấy vùng");
      error.status = 404;
      throw error;
    }

    return region;
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết vùng:", err);
    throw err;
  }
}

/**
 * 🍶 Lấy danh sách sản phẩm thuộc 1 vùng (theo specialty_id)
 * — Dữ liệu lấy từ view `view_products_full` vì có join bảng manufacturer & specialties.
 */
export async function getProductsByRegion(regionId) {
  try {
    if (!regionId) {
      const error = new Error("Thiếu specialty_id");
      error.status = 400;
      throw error;
    }

    const [rows] = await sequelize.query(
      `
        SELECT 
          product_id,
          product_name,
          alcohol_content,
          volume_ml,
          packaging_spec,
          description,
          cost_price,
          sale_price,
          specialty_province,
          specialty_description,
          primary_image
        FROM view_products_full
        WHERE specialty_id = ?
        ORDER BY product_id ASC
      `,
      {
        replacements: [regionId],
      }
    );

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows;
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm theo vùng:", err);
    throw err;
  }
}

/**
 * 🍾 Lấy chi tiết 1 sản phẩm trong 1 vùng
 * @param {string} regionId - ID vùng (specialty_id)
 * @param {string} productId - ID sản phẩm (product_id)
 */
export async function getProductByRegionAndId(regionId, productId) {
  try {
    if (!regionId || !productId) {
      const error = new Error("Thiếu specialty_id hoặc product_id");
      error.status = 400;
      throw error;
    }

    const [rows] = await sequelize.query(
      `
        SELECT 
          product_id,
          product_name,
          alcohol_content,
          volume_ml,
          packaging_spec,
          description,
          cost_price,
          sale_price,
          specialty_province,
          specialty_description,
          primary_image
        FROM view_products_full
        WHERE specialty_id = ?
          AND product_id = ?
      `,
      {
        replacements: [regionId, productId],
      }
    );

    return rows[0] || null;
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết sản phẩm theo vùng:", err);
    throw err;
  }
}
