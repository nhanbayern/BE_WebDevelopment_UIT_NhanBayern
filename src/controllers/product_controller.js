import * as ProductService from "../services/product.service.js";

/**
 * 📦 Lấy toàn bộ sản phẩm (có phân trang, tìm kiếm, và lọc)
 */
export const getAllProductsController = async (req, res) => {
  try {
    const { page, limit, q, category } = req.query;
    const products = await ProductService.getAllProducts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      keyword: q,
      category: category,
    });
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
    res.status(err.status || 500).json({
      message: err.message || "Lỗi server khi lấy sản phẩm theo region",
    });
  }
};
