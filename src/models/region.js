import db from "../config/db.js";

/**
 * 🗺️ Lấy danh sách tất cả các vùng (specialties)
 */
export async function getAllRegions() {
  const [rows] = await db.execute(
    "SELECT * FROM specialties ORDER BY specialty_id ASC"
  );
  return rows;
}

/**
 * 🏕️ Lấy thông tin chi tiết 1 vùng theo ID
 * @param {string} id - Mã vùng (specialty_id)
 */
export async function getRegionById(id) {
  const [rows] = await db.execute(
    "SELECT * FROM specialties WHERE specialty_id = ?",
    [id]
  );
  return rows[0];
}

/**
 * 🍶 Lấy danh sách sản phẩm thuộc 1 vùng
 * @param {string} specialty_id - Mã vùng
 */
export async function getProductsByRegion(specialty_id) {
  const [rows] = await db.execute(
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
    `,
    [specialty_id]
  );
  return rows;
}

/**
 * 🍾 Lấy 1 sản phẩm cụ thể trong 1 vùng
 * @param {string} regionId - ID vùng
 * @param {string} productId - ID sản phẩm
 */
export async function getProductByRegionAndId(regionId, productId) {
  const [rows] = await db.execute(
    `
      SELECT * 
      FROM view_products_full 
      WHERE specialty_id = ? 
        AND product_id = ?
    `,
    [regionId, productId]
  );
  return rows[0];
}
