import { Op, Sequelize } from "sequelize";
import Customer from "../models/user.model.js";
import CustomerAddress from "../models/user_address.model.js";
import sequelize from "../config/db.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";
import path from "path";
import fs from "fs";

// Import associations to ensure they are properly set up
import "../models/associations.js";

/**
 * Customer Service
 * Standardized to use customer terminology throughout
 */

/**
 * Generate customer_id
 */
export const generateNextCustomerId = () => {
  const now = new Date();
  const time = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const rand = Math.floor(Math.random() * 9000) + 1000;

  return `C${time}${rand}`; // C prefix for customer
};

/**
 * Find or create customer by Google auth
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

  const transaction = await sequelize.transaction();
  
  try {
    const customer_id = await generateNextCustomerId();
    
    if (!customer_id || customer_id.includes('NaN')) {
      throw new Error(`Invalid customer_id generated: ${customer_id}`);
    }
    
    const newCustomer = await Customer.create({
      customer_id,
      customername: username,
      email,
      google_id,
      login_type: "google",
    }, { transaction });
    
    await transaction.commit();
    return newCustomer;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating customer:", error);
    throw error;
  }
};

/**
 * Get all customers
 */
export const getAllCustomers = async () => {
  return await Customer.findAll({ order: [["created_at", "DESC"]] });
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (customerId) => {
  return await Customer.findByPk(customerId, {
    attributes: [
      "customer_id",
      "customername",
      "email",
      "phone_number",
      "profileimage",
      "google_id",
      "login_type",
      "created_at",
    ],
  });
};

/**
 * Get customer profile by ID (with backward compatibility aliases)
 */
export const getCustomerProfile = async (customerId) => {
  try {
    const customer = await Customer.findByPk(customerId, {
      attributes: [
        "customer_id",
        "customername",
        "email",
        "phone_number",
        "profileimage",
        "google_id",
        "created_at",
      ],
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Add backward compatibility aliases
    const customerJson = customer.toJSON();
    return {
      ...customerJson,
      user_id: customerJson.customer_id, // Backward compat
      username: customerJson.customername, // Backward compat
    };
  } catch (error) {
    throw new Error(`Failed to get customer profile: ${error.message}`);
  }
};

/**
 * Update customer profile with validation
 */
export const updateCustomerProfile = async (customerId, updateData, avatarFile = null) => {
  try {
    const { username, customername, phone_number } = updateData;

    // Support both username (old) and customername (new)
    const name = customername || username;

    // Validation
    const validationErrors = [];

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        validationErrors.push("Name must be a non-empty string");
      }
      if (name.length > 100) {
        validationErrors.push("Name too long (max 100 chars)");
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

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(", "));
    }

    // Build update object
    const updateFields = {};
    if (name !== undefined) updateFields.customername = name.trim();
    if (phone_number !== undefined)
      updateFields.phone_number = phone_number.trim();

    // Handle avatar upload if file is provided
    if (avatarFile) {
      try {
        // Get current customer to check for existing avatar
        const currentCustomer = await Customer.findByPk(customerId);
        
        // Extract file extension from uploaded file
        const fileExtension = path.extname(avatarFile.originalname);
        
        // Upload to Cloudinary with custom public_id (customer_id without extension)
        const uploadResult = await uploadImage(avatarFile.path, {
          folder: "avatars",
          public_id: customerId, // Use customer_id as public_id (e.g., C001)
          overwrite: true, // Overwrite if exists
        });
        
        // Delete the temporary file
        fs.unlinkSync(avatarFile.path);
        
        // Update profileimage field with Cloudinary URL
        updateFields.profileimage = uploadResult.secure_url;
        
        // Delete old avatar from Cloudinary if it exists and is different
        if (currentCustomer && currentCustomer.profileimage && 
            currentCustomer.profileimage !== uploadResult.secure_url) {
          try {
            // Extract public_id from old URL if needed
            await deleteImage(`avatars/${customerId}`);
          } catch (deleteError) {
            console.error("Failed to delete old avatar:", deleteError.message);
            // Continue anyway, not critical
          }
        }
      } catch (uploadError) {
        // Clean up temp file if upload fails
        if (avatarFile.path && fs.existsSync(avatarFile.path)) {
          fs.unlinkSync(avatarFile.path);
        }
        throw new Error(`Failed to upload avatar: ${uploadError.message}`);
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No updatable fields provided");
    }

    await Customer.update(updateFields, {
      where: { customer_id: customerId },
    });

    return await getCustomerProfile(customerId);
  } catch (error) {
    throw new Error(`Failed to update customer profile: ${error.message}`);
  }
};

// ========== CUSTOMER ADDRESS SERVICES ==========

/**
 * Get all addresses for a customer
 */
export const getCustomerAddresses = async (customerId) => {
  try {
    const addresses = await CustomerAddress.findAll({
      where: { customer_id: customerId },
      order: [
        ["is_default", "DESC"],
        ["address_id", "DESC"],
      ],
    });
    return addresses;
  } catch (error) {
    throw new Error(`Failed to get customer addresses: ${error.message}`);
  }
};

/**
 * Get single address by ID (with ownership check)
 */
export const getAddressById = async (addressId, customerId) => {
  try {
    const address = await CustomerAddress.findOne({
      where: {
        address_id: addressId,
        customer_id: customerId,
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
export const createCustomerAddress = async (customerId, addressData) => {
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
      customer_id: customerId,
      address_line: address_line.trim(),
      ward: ward ? ward.trim() : null,
      district: district ? district.trim() : null,
      province: province ? province.trim() : null,
      is_default: Number(is_default) === 1 ? 1 : 0,
    };

    // If setting as default, clear other defaults first
    if (sanitizedData.is_default === 1) {
      await CustomerAddress.update(
        { is_default: 0 },
        {
          where: { customer_id: customerId },
          transaction,
        }
      );
    }

    // Create the address
    const newAddress = await CustomerAddress.create(sanitizedData, { transaction });

    // Generate address code
    const addressCount = await CustomerAddress.count({
      where: { customer_id: customerId },
      transaction,
    });

    const paddedNumber = String(addressCount).padStart(3, "0");
    const address_code = `Address${customerId}${paddedNumber}`;

    await newAddress.update({ address_code }, { transaction });

    await transaction.commit();

    // Return the complete address
    return await CustomerAddress.findByPk(newAddress.address_id);
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to create address: ${error.message}`);
  }
};

/**
 * Update existing address
 */
export const updateCustomerAddressById = async (addressId, customerId, updateData) => {
  const transaction = await sequelize.transaction();

  try {
    // First verify ownership
    const existingAddress = await getAddressById(addressId, customerId);

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
      await CustomerAddress.update(
        { is_default: 0 },
        {
          where: { customer_id: customerId },
          transaction,
        }
      );
    }

    // Update the address
    await CustomerAddress.update(updateFields, {
      where: { address_id: addressId },
      transaction,
    });

    await transaction.commit();

    // Return updated address
    return await CustomerAddress.findByPk(addressId);
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Failed to update address: ${error.message}`);
  }
};

/**
 * Delete address
 */
export const deleteCustomerAddress = async (addressId, customerId) => {
  const transaction = await sequelize.transaction();

  try {
    // Verify ownership and get address info
    const address = await getAddressById(addressId, customerId);

    // Delete the address
    await CustomerAddress.destroy({
      where: { address_id: addressId },
      transaction,
    });

    // If deleted address was default, set another one as default
    if (address.is_default === 1) {
      const nextAddress = await CustomerAddress.findOne({
        where: { customer_id: customerId },
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

// ========== BACKWARD COMPATIBILITY EXPORTS ==========
// Keep old function names pointing to new ones
export const generateNextUserId = generateNextCustomerId;
export const getAllUsers = getAllCustomers;
export const getUserById = getCustomerById;
export const getUserProfile = getCustomerProfile;
export const updateUserProfile = updateCustomerProfile;
export const getUserAddresses = getCustomerAddresses;
export const createUserAddress = createCustomerAddress;
export const updateUserAddressById = updateCustomerAddressById;
export const deleteUserAddress = deleteCustomerAddress;
