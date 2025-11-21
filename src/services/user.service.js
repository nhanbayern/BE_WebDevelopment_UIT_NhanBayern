import { Op, Sequelize } from "sequelize";
import Customer from "../models/user.model.js";

/**
 * ✅ Sinh user_id dạng user0001, user0002, ...
 */
export const generateNextUserId = async () => {
  const lastUser = await Customer.findOne({
    order: [
      [Sequelize.literal("CAST(SUBSTRING(user_id, 5) AS UNSIGNED)"), "DESC"],
    ],
  });

  if (!lastUser) return "user0001";

  const lastId = lastUser.user_id;
  const num = parseInt(lastId.replace("user", ""), 10) + 1;
  return `user${num.toString().padStart(4, "0")}`;
};

/**
 * ✅ Khi khách hàng đăng nhập qua Google → tạo hoặc lấy thông tin
 */
export const findOrCreateByGoogle = async ({
  username,
  email,
  google_id,
  address = null,
}) => {
  const existing = await Customer.findOne({
    where: { [Op.or]: [{ email }, { google_id }] },
  });
  if (existing) return existing;

  const user_id = await generateNextUserId();
  const newUser = await Customer.create({
    user_id,
    username,
    email,
    address,
    google_id,
  });

  return newUser;
};

/**
 * ✅ Lấy danh sách khách hàng
 */
export const getAllUsers = async () => {
  return await Customer.findAll({ order: [["created_at", "DESC"]] });
};

/**
 * ✅ Lấy khách hàng theo ID
 */
export const getUserById = async (user_id) => {
  return await Customer.findByPk(user_id);
};

/**
 * ✅ Cập nhật địa chỉ khách hàng
 */
export const updateUserAddress = async (user_id, newAddress) => {
  const user = await Customer.findByPk(user_id);
  if (!user) throw new Error("Không tìm thấy khách hàng");

  user.address = newAddress;
  await user.save();
  return user;
};

