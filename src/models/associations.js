import Customer from "./user.model.js";
import CustomerAddress from "./user_address.model.js";
import ShoppingCartItem from "./shopping_cart_item.model.js";
import Product from "./product.model.js";
import Order from "./order.model.js";
import OrderDetail from "./order_detail.model.js";
import Payment from "./payment.model.js";
import Manufacturer from "./manufacturer.model.js";
import Staff from "./staff.model.js";
import ProductAudit from "./product_audit.model.js";
import OrderAudit from "./order_audit.model.js";
import PaymentAudit from "./payment_audit.model.js";
import CustomerAudit from "./customer_audit.model.js";
import ManufacturerAudit from "./manufacturer_audit.model.js";

// Customer <-> CustomerAddress associations (UPDATED: user_id → customer_id)
Customer.hasMany(CustomerAddress, {
  foreignKey: "customer_id",
  as: "addresses",
});

CustomerAddress.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

// Customer <-> ShoppingCartItem associations (UPDATED: user_id → customer_id)
Customer.hasMany(ShoppingCartItem, {
  foreignKey: "customer_id",
  as: "cartItems",
});

ShoppingCartItem.belongsTo(Customer, {
  foreignKey: "customer_id",
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

// NEW: Order <-> Payment associations (payment info normalized to separate table)
Order.hasOne(Payment, {
  foreignKey: "order_id",
  as: "payment",
});

Payment.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

// Manufacturer <-> Product associations
Manufacturer.hasMany(Product, {
  foreignKey: "manufacturer_id",
  as: "products",
});

Product.belongsTo(Manufacturer, {
  foreignKey: "manufacturer_id",
  as: "manufacturer",
});

// NEW AUDIT ASSOCIATIONS

// Staff <-> ProductAudit associations
Staff.hasMany(ProductAudit, {
  foreignKey: "staff_id",
  as: "productAudits",
});

ProductAudit.belongsTo(Staff, {
  foreignKey: "staff_id",
  as: "staff",
});

Product.hasMany(ProductAudit, {
  foreignKey: "product_id",
  as: "audits",
});

ProductAudit.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

// Staff <-> OrderAudit associations
Staff.hasMany(OrderAudit, {
  foreignKey: "staff_id",
  as: "orderAudits",
});

OrderAudit.belongsTo(Staff, {
  foreignKey: "staff_id",
  as: "staff",
});

Order.hasMany(OrderAudit, {
  foreignKey: "order_id",
  as: "audits",
});

OrderAudit.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

// Staff <-> PaymentAudit associations
Staff.hasMany(PaymentAudit, {
  foreignKey: "staff_id",
  as: "paymentAudits",
});

PaymentAudit.belongsTo(Staff, {
  foreignKey: "staff_id",
  as: "staff",
});

Payment.hasMany(PaymentAudit, {
  foreignKey: "payment_id",
  as: "audits",
});

PaymentAudit.belongsTo(Payment, {
  foreignKey: "payment_id",
  as: "payment",
});

// Staff <-> CustomerAudit associations
Staff.hasMany(CustomerAudit, {
  foreignKey: "staff_id",
  as: "customerAudits",
});

CustomerAudit.belongsTo(Staff, {
  foreignKey: "staff_id",
  as: "staff",
});

Customer.hasMany(CustomerAudit, {
  foreignKey: "customer_id",
  as: "audits",
});

CustomerAudit.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

// Staff <-> ManufacturerAudit associations
Staff.hasMany(ManufacturerAudit, {
  foreignKey: "staff_id",
  as: "manufacturerAudits",
});

ManufacturerAudit.belongsTo(Staff, {
  foreignKey: "staff_id",
  as: "staff",
});

Manufacturer.hasMany(ManufacturerAudit, {
  foreignKey: "manufacturer_id",
  as: "audits",
});

ManufacturerAudit.belongsTo(Manufacturer, {
  foreignKey: "manufacturer_id",
  as: "manufacturer",
});

export { 
  Customer, 
  CustomerAddress,
  CustomerAddress as UserAddress, // Backward compatibility
  ShoppingCartItem, 
  Product, 
  Order, 
  OrderDetail, 
  Payment, 
  Manufacturer,
  Staff,
  ProductAudit,
  OrderAudit,
  PaymentAudit,
  CustomerAudit,
  ManufacturerAudit
};
