import Customer from "./user.model.js";
import UserAddress from "./user_address.model.js";

// Define associations
Customer.hasMany(UserAddress, {
  foreignKey: "user_id",
  as: "addresses",
});

UserAddress.belongsTo(Customer, {
  foreignKey: "user_id",
  as: "customer",
});

export { Customer, UserAddress };
