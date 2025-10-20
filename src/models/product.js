import db from "../config/db.js";

/**
 * 📦 Lấy toàn bộ sản phẩm
 */
export async function getAllProducts() {
  const [rows] = await db.execute(`
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
    ORDER BY product_id ASC
  `);
  return rows;
}

/**
 * 🔍 Lấy sản phẩm theo ID
 */
export async function getProductById(id) {
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
    WHERE product_id = ?
    `,
    [id]
  );
  return rows[0];
}

/**
 * 🆕 Thêm sản phẩm mới
 */
export async function createProduct(productData) {
  const {
    product_name,
    price,
    stock_quantity,
    manufacturer_id,
    specialty_id,
    description,
    image_url,
  } = productData;

  const [result] = await db.execute(
    `
    INSERT INTO products 
    (product_name, price, stock_quantity, manufacturer_id, specialty_id, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      product_name,
      price,
      stock_quantity,
      manufacturer_id,
      specialty_id,
      description,
      image_url,
    ]
  );
  return result;
}

/**
 * ✏️ Cập nhật sản phẩm
 */
export async function updateProduct(id, productData) {
  const {
    product_name,
    price,
    stock_quantity,
    manufacturer_id,
    specialty_id,
    description,
    image_url,
  } = productData;

  const [result] = await db.execute(
    `
    UPDATE products 
    SET product_name = ?, price = ?, stock_quantity = ?, manufacturer_id = ?, 
        specialty_id = ?, description = ?, image_url = ?
    WHERE product_id = ?
    `,
    [
      product_name,
      price,
      stock_quantity,
      manufacturer_id,
      specialty_id,
      description,
      image_url,
      id,
    ]
  );
  return result;
}

/**
 * 🗑️ Xóa sản phẩm
 */
export async function deleteProduct(id) {
  const [result] = await db.execute(
    "DELETE FROM products WHERE product_id = ?",
    [id]
  );
  return result;
}
