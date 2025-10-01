const express = require("express"); // commonjs
// import experess from 'express"
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();
var router1 = express.Router();
const app = express(); // app express
// Chạy server
const PORT = process.env.PORT || 5000; // khai báo port
app.use(express.json());
app.use(cors());

// Kết nối DB
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
});
db.connect((err) => {
  if (err) {
    console.error("❌ Cannot connect DB", err);
    return;
  }
  console.log("✅ DB connected");
});
//KHAI BÁO ROUTE
app.get("/", (req, res) => {
  res.send("Đây là web application, được chạy với mysql.Xin chào mọi người !!");
});

// CRUD viết trực tiếp ở đây
app.get("/products", (req, res) => {
  db.query("SELECT * FROM  usda_food_nutrition LIMIT 20;", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/products", (req, res) => {
  const { name, price, category } = req.body;
  const sql = "INSERT INTO products (name, price, category) VALUES (?, ?, ?)";
  db.query(sql, [name, price, category], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, name, price, category });
  });
});
router1.get("/", (req, res) => {
  res.json("this is router 1");
  console.log("running router 1");
});
app.use("/duongdan1", router1);
//this is localhost:3000/duongdan1//cuar router

router1.get("/giohang", (req, res) => {
  res.send("Xin moi ban vao gio hang");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
