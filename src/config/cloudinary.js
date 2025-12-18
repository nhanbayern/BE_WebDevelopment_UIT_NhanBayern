import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary Configuration
 * Uses existing environment variables without modification
 */

// Load credentials from environment
const CLOUD_NAME = process.env.CLOUDINARY_API_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRECT; // Note: Original typo preserved

/**
 * Configure Cloudinary instance
 */
const configureCloudinary = () => {
  // Validate required credentials
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error("❌ [Cloudinary] Configuration failed");
    console.error("   ⚠️  Missing required environment variables:");
    if (!CLOUD_NAME) console.error("      - CLOUDINARY_API_NAME");
    if (!API_KEY) console.error("      - CLOUDINARY_API_KEY");
    if (!API_SECRET) console.error("      - CLOUDINARY_API_SECRECT");
    return false;
  }

  try {
    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      api_secret: API_SECRET,
      secure: true, // Always use HTTPS
    });

    console.log("✅ [Cloudinary] Configured successfully");
    console.log(`   🌐 Cloud name: ${CLOUD_NAME}`);
    
    return true;
  } catch (error) {
    console.error("❌ [Cloudinary] Configuration failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    return false;
  }
};

/**
 * Health check - Test Cloudinary connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
  try {
    // Simple API call to verify credentials
    await cloudinary.api.ping();
    
    console.log("✅ [Cloudinary] Connection test passed");
    console.log("   📡 API is reachable and credentials are valid");
    
    return true;
  } catch (error) {
    console.error("❌ [Cloudinary] Connection test failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    
    if (error.http_code === 401) {
      console.error("   🔐 Check your API credentials");
    } else if (error.http_code === 404) {
      console.error("   🌐 Check your cloud name");
    }
    
    return false;
  }
};

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path or base64 data URI
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with secure_url, public_id, etc.
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: "products", // Default folder for organizing uploads
      resource_type: "auto",
      ...options,
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    
    console.log("✅ [Cloudinary] Image uploaded successfully");
    console.log(`   📸 Public ID: ${result.public_id}`);
    console.log(`   🔗 URL: ${result.secure_url}`);
    
    return result;
  } catch (error) {
    console.error("❌ [Cloudinary] Upload failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public_id of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === "ok") {
      console.log("✅ [Cloudinary] Image deleted successfully");
      console.log(`   🗑️  Public ID: ${publicId}`);
    } else {
      console.warn("⚠️  [Cloudinary] Image deletion status: " + result.result);
    }
    
    return result;
  } catch (error) {
    console.error("❌ [Cloudinary] Deletion failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    throw error;
  }
};

/**
 * Upload image from buffer (for memory storage uploads)
 * @param {Buffer} buffer - Image buffer from memory storage
 * @param {string} folder - Folder to upload to (e.g., "products", "avatars")
 * @param {string} publicId - Public ID for the image
 * @returns {Promise<Object>} Upload result with success flag and secure_url
 */
const uploadToCloudinary = async (buffer, folder, publicId) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("❌ [Cloudinary] Buffer upload failed");
            console.error(`   ⚠️  Reason: ${error.message}`);
            reject(error);
          } else {
            console.log("✅ [Cloudinary] Buffer uploaded successfully");
            console.log(`   📸 Public ID: ${result.public_id}`);
            console.log(`   🔗 URL: ${result.secure_url}`);
            resolve({
              success: true,
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("❌ [Cloudinary] Upload from buffer failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Delete image from Cloudinary using URL
 * @param {string} imageUrl - Full Cloudinary URL or public_id
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Extract public_id from URL if full URL provided
    let publicId = imageUrl;
    
    if (imageUrl.includes("cloudinary.com")) {
      // Extract public_id from URL
      // Example: https://res.cloudinary.com/xxx/image/upload/v123/products/PRD001.jpg
      const urlParts = imageUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Get everything after version number, remove extension
        publicId = urlParts
          .slice(uploadIndex + 2)
          .join("/")
          .replace(/\.[^/.]+$/, "");
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === "ok") {
      console.log("✅ [Cloudinary] Image deleted successfully");
      console.log(`   🗑️  Public ID: ${publicId}`);
    } else {
      console.warn("⚠️  [Cloudinary] Image deletion status: " + result.result);
    }
    
    return result;
  } catch (error) {
    console.error("❌ [Cloudinary] Deletion failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - The public_id of the image
 * @param {Object} transformations - Cloudinary transformation options
 * @returns {string} Transformed image URL
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  try {
    const defaultTransformations = {
      quality: "auto",
      fetch_format: "auto",
      ...transformations,
    };

    return cloudinary.url(publicId, defaultTransformations);
  } catch (error) {
    console.error("❌ [Cloudinary] URL generation failed");
    console.error(`   ⚠️  Reason: ${error.message}`);
    return null;
  }
};

// Initialize configuration on module load
configureCloudinary();

// Export configured instance and helper functions
export default cloudinary;
export { 
  configureCloudinary, 
  testConnection, 
  uploadImage, 
  deleteImage, 
  getOptimizedUrl,
  uploadToCloudinary,
  deleteFromCloudinary
};
