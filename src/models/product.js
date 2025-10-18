const db = require("../config/db");

// Lấy toàn bộ sản phẩm (từ VIEW)
const getAllProducts = async () => {
  const [rows] = await db.promise().execute("SELECT * FROM view_products_full");
  return rows;
};

// Lấy 1 sản phẩm theo ID
const getProductById = async (id) => {
  const [rows] = await db
    .promise()
    .execute("SELECT * FROM view_products_full WHERE product_id = ?", [id]);
  return rows[0];
};

// Thêm sản phẩm mới
const createProduct = async (productData) => {
  const {
    product_name,
    price,
    stock_quantity,
    manufacturer_id,
    specialty_id,
    description,
    image_url,
  } = productData;

  const [result] = await db.promise().execute(
    `INSERT INTO products 
    (product_name, price, stock_quantity, manufacturer_id, specialty_id, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
};

// Cập nhật sản phẩm
const updateProduct = async (id, productData) => {
  const {
    product_name,
    price,
    stock_quantity,
    manufacturer_id,
    specialty_id,
    description,
    image_url,
  } = productData;

  const [result] = await db.promise().execute(
    `UPDATE products 
     SET product_name = ?, price = ?, stock_quantity = ?, manufacturer_id = ?, 
         specialty_id = ?, description = ?, image_url = ?
     WHERE product_id = ?`,
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
};

// Xóa sản phẩm
const deleteProduct = async (id) => {
  const [result] = await db
    .promise()
    .execute("DELETE FROM products WHERE product_id = ?", [id]);
  return result;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
