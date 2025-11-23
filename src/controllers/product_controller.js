import * as ProductService from "../services/product.service.js";

/**
 * 📦 Lấy toàn bộ sản phẩm
 */
export const getAllProductsController = async (req, res) => {
  try {
    const products = await ProductService.getAllProducts();
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", err);
    res.status(err.status || 500).json({
      message: err.message || "Lỗi server khi lấy danh sách sản phẩm",
    });
  }
};

/**
 * 🔍 Lấy sản phẩm theo ID
 */
export const getProductByIdController = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Lỗi server khi lấy sản phẩm" });
  }
};

/**
 * Lấy danh sách sản phẩm theo region
 */
export const getProductsByRegionController = async (req, res) => {
  try {
    const { regionName } = req.params;
    const products = await ProductService.getProductsByRegion(regionName);
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm theo region:", err);
    res
      .status(err.status || 500)
      .json({
        message: err.message || "Lỗi server khi lấy sản phẩm theo region",
      });
  }
};

/**
 * 🆕 Thêm sản phẩm mới
 */
export const createProductController = async (req, res) => {
  try {
    const newProduct = await ProductService.createProduct(req.body);
    res.status(201).json({ message: "Đã thêm sản phẩm mới", newProduct });
  } catch (err) {
    console.error("❌ Lỗi khi thêm sản phẩm:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Lỗi server khi thêm sản phẩm" });
  }
};

/**
 * ✏️ Cập nhật sản phẩm
 */
export const updateProductController = async (req, res) => {
  try {
    const updated = await ProductService.updateProduct(req.params.id, req.body);
    res.status(200).json({ message: "Đã cập nhật sản phẩm", updated });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Lỗi server khi cập nhật sản phẩm" });
  }
};

/**
 * 🗑️ Xóa sản phẩm
 */
export const deleteProductController = async (req, res) => {
  try {
    const result = await ProductService.deleteProduct(req.params.id);
    res.status(200).json({ message: "Đã xóa sản phẩm", result });
  } catch (err) {
    console.error("❌ Lỗi khi xóa sản phẩm:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Lỗi server khi xóa sản phẩm" });
  }
};
