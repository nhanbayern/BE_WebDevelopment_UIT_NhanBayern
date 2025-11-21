import * as Region from "../services/region.service.js";
// gom toàn bộ vào object region

/**
 * 📍 Lấy danh sách tất cả vùng
 */
export const getAllRegions = async (req, res) => {
  try {
    const regions = await Region.getAllRegions();
    res.status(200).json(regions);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách vùng:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách vùng" });
  }
};

/**
 * 🏕️ Lấy thông tin chi tiết 1 vùng
 */
export const getRegionById = async (req, res) => {
  try {
    const region = await Region.getRegionById(req.params.regionId);
    if (!region) {
      return res.status(404).json({ message: "Không tìm thấy vùng" });
    }
    res.status(200).json(region);
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết vùng:", err);
    res.status(500).json({ message: "Lỗi server khi lấy vùng" });
  }
};

/**
 * 🍶 Lấy danh sách sản phẩm trong vùng
 */
export const getProductsByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    const products = await Region.getProductsByRegion(regionId);
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm theo vùng:", err);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm theo vùng" });
  }
};

/**
 * 🍾 Lấy chi tiết 1 sản phẩm trong vùng
 */
export const getProductByRegionAndId = async (req, res) => {
  try {
    const { regionId, productId } = req.params;
    const product = await Region.getProductByRegionAndId(regionId, productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm trong vùng" });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm chi tiết:", err);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm chi tiết" });
  }
};
