const pool = require("../src/config/db");

/**
 * Lấy thông tin chi tiết vùng miền bằng ID.
 * Giả sử bảng của bạn tên là 'specialties' (hoặc 'regions').
 */
const getRegionDetails = async (specialty_id) => {
  try {
    const sql = `
      SELECT specialty_id, province_name, description 
      FROM specialties 
      WHERE specialty_id = ?
    `;
    const [rows] = await pool.query(sql, [specialty_id]);

    // rows là một mảng, ta lấy phần tử đầu tiên (hoặc undefined nếu không tìm thấy)
    return rows[0];
  } catch (err) {
    console.error("Lỗi khi query getRegionDetails:", err);
    throw err; // Ném lỗi để route handler có thể bắt
  }
};

/**
 * Lấy danh sách sản phẩm thuộc vùng (có phân trang).
 * Giả sử bảng 'products' có cột 'specialty_id' để liên kết.
 */
const getProductsByRegion = async (specialty_id, limit, offset) => {
  try {
    const sql = `
      SELECT product_id, product_name, alcohol_content, volume_ml, sale_price, primary_image 
      FROM products 
      WHERE specialty_id = ? 
      LIMIT ? 
      OFFSET ?
    `;
    const [rows] = await pool.query(sql, [specialty_id, limit, offset]);
    return rows; // Trả về mảng các sản phẩm
  } catch (err) {
    console.error("Lỗi khi query getProductsByRegion:", err);
    throw err;
  }
};

/**
 * Đếm tổng số sản phẩm thuộc vùng.
 */
const countProductsByRegion = async (specialty_id) => {
  try {
    const sql = `
      SELECT COUNT(*) as totalProducts 
      FROM products 
      WHERE specialty_id = ?
    `;
    const [rows] = await pool.query(sql, [specialty_id]);

    // Trả về con số totalProducts (ví dụ: 25)
    return rows[0].totalProducts;
  } catch (err) {
    console.error("Lỗi khi query countProductsByRegion:", err);
    throw err;
  }
};

// Xuất các module ra để file route biết
module.exports = {
  getRegionDetails,
  getProductsByRegion,
  countProductsByRegion,
};
