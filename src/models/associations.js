import Customer from "./user.model.js";
import UserAddress from "./user_address.model.js";
import ShoppingCartItem from "./shopping_cart_item.model.js";
import Product from "./product.model.js";
import Order from "./order.model.js";
import OrderDetail from "./order_detail.model.js";

// Customer <-> UserAddress associations
Customer.hasMany(UserAddress, {
  foreignKey: "user_id",
  as: "addresses",
});

UserAddress.belongsTo(Customer, {
  foreignKey: "user_id",
  as: "customer",
});

// Customer <-> ShoppingCartItem associations
Customer.hasMany(ShoppingCartItem, {
  foreignKey: "user_id",
  as: "cartItems",
});

ShoppingCartItem.belongsTo(Customer, {
  foreignKey: "user_id",
  as: "customer",
});

// Product <-> ShoppingCartItem associations
Product.hasMany(ShoppingCartItem, {
  foreignKey: "product_id",
  as: "cartItems",
});

ShoppingCartItem.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

// Customer <-> Order associations
Customer.hasMany(Order, {
  foreignKey: "customer_id",
  as: "orders",
});

Order.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

// Order <-> OrderDetail associations
Order.hasMany(OrderDetail, {
  foreignKey: "order_id",
  as: "orderDetails",
});

OrderDetail.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

// Product <-> OrderDetail associations
Product.hasMany(OrderDetail, {
  foreignKey: "product_id",
  as: "orderDetails",
});

OrderDetail.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

export { Customer, UserAddress, ShoppingCartItem, Product, Order, OrderDetail };
