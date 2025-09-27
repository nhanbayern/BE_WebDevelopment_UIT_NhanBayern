const express = require("express"); // tao server
const router = express.Router();
app.post("/products", (req, res) => {
  const { name, price, category } = req.body;
  const sql = "INSERT INTO products (name, price, category) VALUES (?, ?, ?)";
  db.query(sql, [name, price, category], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, name, price, category });
  });
});

app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.get("/products/:id", (req, res) => {
  db.query(
    "SELECT * FROM products WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    }
  );
});
app.put("/products/:id", (req, res) => {
  const { name, price, category } = req.body;
  const sql = "UPDATE products SET name=?, price=?, category=? WHERE id=?";
  db.query(sql, [name, price, category, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Updated successfully" });
  });
});
app.delete("/products/:id", (req, res) => {
  db.query("DELETE FROM products WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});
module.exports = router;
