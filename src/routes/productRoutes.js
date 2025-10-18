const express = require("express");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../models/product");

const router = express.Router();

// GET tất cả sản phẩm
router.get("/", async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET 1 sản phẩm theo ID
router.get("/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST thêm sản phẩm mới
router.post("/", async (req, res) => {
  try {
    const result = await createProduct(req.body);
    res.status(201).json({ message: "Đã thêm sản phẩm mới", result });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm" });
  }
});

// PUT cập nhật sản phẩm
router.put("/:id", async (req, res) => {
  try {
    const result = await updateProduct(req.params.id, req.body);
    res.json({ message: "Đã cập nhật sản phẩm", result });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm" });
  }
});

// DELETE xóa sản phẩm
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    res.json({ message: "Đã xóa sản phẩm", result });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
  }
});

module.exports = router;
