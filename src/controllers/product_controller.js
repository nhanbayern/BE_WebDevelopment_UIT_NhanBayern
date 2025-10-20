import * as Product from "../models/product.js";

/**
 * 📦 Lấy toàn bộ sản phẩm
 */
export const getAllProductsController = async (req, res) => {
  try {
    const products = await Product.getAllProducts();
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách sản phẩm" });
  }
};

/**
 * 🔍 Lấy sản phẩm theo ID
 */
export const getProductByIdController = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.getProductById(id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm" });
  }
};

/**
 * 🆕 Thêm sản phẩm mới
 */
export const createProductController = async (req, res) => {
  try {
    const result = await Product.createProduct(req.body);
    res.status(201).json({ message: "Đã thêm sản phẩm mới", result });
  } catch (err) {
    console.error("❌ Lỗi khi thêm sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi thêm sản phẩm" });
  }
};

/**
 * ✏️ Cập nhật sản phẩm
 */
export const updateProductController = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Product.updateProduct(id, req.body);
    res.status(200).json({ message: "Đã cập nhật sản phẩm", result });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm" });
  }
};

/**
 * 🗑️ Xóa sản phẩm
 */
export const deleteProductController = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Product.deleteProduct(id);
    res.status(200).json({ message: "Đã xóa sản phẩm", result });
  } catch (err) {
    console.error("❌ Lỗi khi xóa sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm" });
  }
};
