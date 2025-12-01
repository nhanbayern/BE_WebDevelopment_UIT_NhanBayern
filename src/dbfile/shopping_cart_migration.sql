-- Shopping Cart Item Table Migration
-- This table stores shopping cart items for users with products

CREATE TABLE IF NOT EXISTS `shopping_cart_item` (
  `item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(20) NOT NULL,
  `product_id` VARCHAR(10) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT `fk_cart_user`
    FOREIGN KEY (`user_id`) 
    REFERENCES `customers` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    
  CONSTRAINT `fk_cart_product`
    FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`product_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  
  -- Unique constraint: one user can only have one entry per product
  CONSTRAINT `unique_user_product` 
    UNIQUE KEY (`user_id`, `product_id`),
  
  -- Quantity validation
  CONSTRAINT `chk_quantity_positive` 
    CHECK (`quantity` >= 1)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX `idx_cart_user_id` ON `shopping_cart_item` (`user_id`);
CREATE INDEX `idx_cart_product_id` ON `shopping_cart_item` (`product_id`);
CREATE INDEX `idx_cart_created_at` ON `shopping_cart_item` (`created_at`);

-- Sample data (optional, for testing)
-- INSERT INTO shopping_cart_item (user_id, product_id, quantity) 
-- VALUES ('user001', 'p001', 2);
