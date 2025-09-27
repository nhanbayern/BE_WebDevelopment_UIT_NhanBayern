const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối DB
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
db.connect((err) => {
  if (err) {
    console.error("❌ Cannot connect DB", err);
    return;
  }
  console.log("✅ DB connected");
});
app.get("/", (req, res) => {
  res.send("Đây là web application, được chạy với mysql.Xin chào mọi người !!");
});

// CRUD viết trực tiếp ở đây
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
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

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
