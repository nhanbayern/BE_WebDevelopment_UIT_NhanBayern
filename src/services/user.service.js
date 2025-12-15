import { Op, Sequelize } from "sequelize";
import Customer from "../models/user.model.js";
import UserAddress from "../models/user_address.model.js";
import sequelize from "../config/db.js";

// Import associations to ensure they are properly set up
import "../models/associations.js";

/**
 * ✅ Sinh user_id dạng user0001, user0002, ...
 */
export const generateNextUserId = () => {
  const now = new Date();
  const time = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")  // 20251212153045xxx
    .slice(0, 14);            // yyyyMMddHHmmss

  const rand = Math.floor(Math.random() * 9000) + 1000; // 1000–9999

  return `U${time}${rand}`;
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
  const whereClauses = [];
  if (email) whereClauses.push({ email });
  if (google_id) whereClauses.push({ google_id });
  if (whereClauses.length === 0) {
    throw new Error("Email hoặc Google ID là bắt buộc");
  }

  const existing = await Customer.findOne({
    where: { [Op.or]: whereClauses },
  });

  if (existing) {
    if (!existing.google_id && google_id) {
      existing.google_id = google_id;
      await existing.save();
    }
    return existing;
  }

  // Sử dụng transaction để tránh race condition
  const transaction = await sequelize.transaction();
  
  try {
    const user_id = await generateNextUserId();
    
    // Validate user_id trước khi tạo
    if (!user_id || user_id.includes('NaN')) {
      throw new Error(`Invalid user_id generated: ${user_id}`);
    }
    
    const newUser = await Customer.create({
      user_id,
      username,
      email,
      address,
      google_id,
    }, { transaction });
    
    await transaction.commit();
    return newUser;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating user:", error);
    throw error;
  }
};

/**
 * ✅ Lấy danh sách khách hàng
 */
export const getAllUsers = async () => {
  return await Customer.findAll({ order: [["created_at", "DESC"]] });
};

export const getUserById = async (user_id) => {
  return await Customer.findByPk(user_id);
};

export const updateUserAddress = async (user_id, newAddress) => {
  const user = await Customer.findByPk(user_id);
  if (!user) throw new Error("Không tìm thấy khách hàng");

  user.address = newAddress;
  await user.save();
  return user;
};

// ========== NEW USER PROFILE SERVICES (SEQUELIZE) ==========

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  try {
    const user = await Customer.findByPk(userId, {
      attributes: [
        "user_id",
        "username",
        "email",
        "phone_number",
        "address",
        "google_id",
        "created_at",
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

/**
 * Update user profile with validation
 */
export const updateUserProfile = async (userId, updateData) => {
  try {
    const { username, phone_number, address } = updateData;

    // Validation
    const validationErrors = [];

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length === 0) {
        validationErrors.push("Username must be a non-empty string");
      }
      if (username.length > 100) {
        validationErrors.push("Username too long (max 100 chars)");
      }
    }

    if (phone_number !== undefined) {
      const PHONE_RE = /^\+?\d{9,15}$/;
      if (
        typeof phone_number !== "string" ||
        !PHONE_RE.test(phone_number.trim())
      ) {
        validationErrors.push("Invalid phone format");
      }
    }

    if (address !== undefined) {
      if (typeof address !== "string") {
        validationErrors.push("Address must be a string");
      }
      if (address.length > 255) {
        validationErrors.push("Address too long (max 255 chars)");
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(", "));
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (username !== undefined) updateFields.username = username.trim();
    if (phone_number !== undefined)
      updateFields.phone_number = phone_number.trim();
    if (address !== undefined) updateFields.address = address.trim();

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No updatable fields provided");
    }

    await Customer.update(updateFields, {
      where: { user_id: userId },
    });

    // Return updated user
    return await getUserProfile(userId);
  } catch (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

// ========== USER ADDRESS SERVICES (SEQUELIZE) ==========

/**
 * Get all addresses for a user
 */
export const getUserAddresses = async (userId) => {
  try {
    const addresses = await UserAddress.findAll({
      where: { user_id: userId },
      order: [
        ["is_default", "DESC"],
        ["address_id", "DESC"],
      ],
    });
    return addresses;
  } catch (error) {
    throw new Error(`Failed to get user addresses: ${error.message}`);
  }
};

/**
 * Get single address by ID (with ownership check)
 */
export const getAddressById = async (addressId, userId) => {
  try {
    const address = await UserAddress.findOne({
      where: {
        address_id: addressId,
        user_id: userId,
      },
    });

    if (!address) {
      throw new Error("Address not found or access denied");
    }

    return address;
  } catch (error) {
    throw new Error(`Failed to get address: ${error.message}`);
  }
};

/**
 * Create new address
 */
export const createUserAddress = async (userId, addressData) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      address_line,
      ward,
      district,
      province,
      is_default = 0,
    } = addressData;

    // Validation
    if (
      !address_line ||
      typeof address_line !== "string" ||
      address_line.trim().length === 0
    ) {
      throw new Error("Address line is required");
    }

    if (address_line.length > 255) {
      throw new Error("Address line too long (max 255 chars)");
    }

    const sanitizedData = {
      user_id: userId,
      address_line: address_line.trim(),
      ward: ward ? ward.trim() : null,
      district: district ? district.trim() : null,
      province: province ? province.trim() : null,
      is_default: Number(is_default) === 1 ? 1 : 0,
    };

    // If setting as default, clear other defaults first
    if (sanitizedData.is_default === 1) {
      await UserAddress.update(
        { is_default: 0 },
        {
          where: { user_id: userId },
          transaction,
        }
      );
    }

    // Create the address
    const newAddress = await UserAddress.create(sanitizedData, { transaction });

    // Generate address code
    const addressCount = await UserAddress.count({
      where: { user_id: userId },
      transaction,
    });

    const paddedNumber = String(addressCount).padStart(3, "0");
    const address_code = `Address${userId}${paddedNumber}`;

    await newAddress.update({ address_code }, { transaction });

    await transaction.commit();

    // Return the complete address
    return await UserAddress.findByPk(newAddress.address_id);
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to create address: ${error.message}`);
  }
};

/**
 * Update existing address
 */
export const updateUserAddressById = async (addressId, userId, updateData) => {
  const transaction = await sequelize.transaction();

  try {
    // First verify ownership
    const existingAddress = await getAddressById(addressId, userId);

    const { address_line, ward, district, province, is_default } = updateData;

    // Validation
    const updateFields = {};

    if (address_line !== undefined) {
      if (
        typeof address_line !== "string" ||
        address_line.trim().length === 0
      ) {
        throw new Error("Address line cannot be empty");
      }
      if (address_line.length > 255) {
        throw new Error("Address line too long");
      }
      updateFields.address_line = address_line.trim();
    }

    if (ward !== undefined) {
      updateFields.ward = ward ? ward.trim() : null;
    }

    if (district !== undefined) {
      updateFields.district = district ? district.trim() : null;
    }

    if (province !== undefined) {
      updateFields.province = province ? province.trim() : null;
    }

    if (is_default !== undefined) {
      updateFields.is_default = Number(is_default) === 1 ? 1 : 0;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No updatable fields provided");
    }

    // If setting as default, clear other defaults first
    if (updateFields.is_default === 1) {
      await UserAddress.update(
        { is_default: 0 },
        {
          where: { user_id: userId },
          transaction,
        }
      );
    }

    // Update the address
    await UserAddress.update(updateFields, {
      where: { address_id: addressId },
      transaction,
    });

    await transaction.commit();

    // Return updated address
    return await UserAddress.findByPk(addressId);
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to update address: ${error.message}`);
  }
};

/**
 * Delete address
 */
export const deleteUserAddress = async (addressId, userId) => {
  const transaction = await sequelize.transaction();

  try {
    // Verify ownership and get address info
    const address = await getAddressById(addressId, userId);

    // Delete the address
    await UserAddress.destroy({
      where: { address_id: addressId },
      transaction,
    });

    // If deleted address was default, set another one as default
    if (address.is_default === 1) {
      const nextAddress = await UserAddress.findOne({
        where: { user_id: userId },
        order: [["address_id", "DESC"]],
        transaction,
      });

      if (nextAddress) {
        await nextAddress.update({ is_default: 1 }, { transaction });
      }
    }

    await transaction.commit();

    return { message: "Address deleted successfully" };
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to delete address: ${error.message}`);
  }
};
