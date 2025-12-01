-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema backend
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema backend
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `backend` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `backend` ;

-- -----------------------------------------------------
-- Table `backend`.`customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`customers` (
  `user_id` VARCHAR(20) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone_number` VARCHAR(20) NULL DEFAULT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `google_id` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE,
  UNIQUE INDEX `google_id` (`google_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`customers_account`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`customers_account` (
  `account_id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `login_type` ENUM('google', 'password') NOT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `password_hash` VARCHAR(255) NULL DEFAULT NULL,
  `google_id` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  UNIQUE INDEX `uq_email_unique` (`email` ASC) VISIBLE,
  UNIQUE INDEX `uq_google_id_unique` (`google_id` ASC) VISIBLE,
  INDEX `fk_customer_account_user` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_customer_account_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `backend`.`customers` (`user_id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`emailotp`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`emailotp` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `otp_type` ENUM('register', 'forgot_password', 'change_email', '2fa') NULL DEFAULT 'register',
  `otp_hash` VARCHAR(255) NOT NULL,
  `expired_at` DATETIME NOT NULL,
  `attempt_count` INT NULL DEFAULT '0',
  `max_attempts` INT NULL DEFAULT '5',
  `resend_count` INT NULL DEFAULT '0',
  `resend_at` DATETIME NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` VARCHAR(255) NULL DEFAULT NULL,
  `device_fingerprint` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE,
  INDEX `idx_email_otp_email` (`email` ASC) VISIBLE,
  INDEX `idx_email_otp_ip` (`ip_address` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`login_logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`login_logs` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `session_id` INT NULL DEFAULT NULL,
  `account_id` VARCHAR(30) NULL DEFAULT NULL,
  `input_username` VARCHAR(50) NULL DEFAULT NULL,
  `username` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(255) NULL DEFAULT NULL,
  `login_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_time` DATETIME NULL DEFAULT NULL,
  `status` ENUM('success', 'failed', 'logout') NOT NULL,
  `error_message` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  INDEX `account_id` (`account_id` ASC) VISIBLE,
  INDEX `idx_session_id` (`session_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 151
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`manufacturers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`manufacturers` (
  `manufacturer_id` VARCHAR(10) NOT NULL,
  `manufacturer_name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `province` VARCHAR(100) NULL DEFAULT NULL,
  `phone` VARCHAR(50) NULL DEFAULT NULL,
  `website` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`manufacturer_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`orders` (
  `order_id` INT NOT NULL AUTO_INCREMENT,
  `order_code` VARCHAR(20) NULL DEFAULT NULL,
  `customer_id` VARCHAR(20) NOT NULL,
  `recipient_name` VARCHAR(100) NOT NULL,
  `recipient_phone` VARCHAR(20) NOT NULL,
  `shipping_address` VARCHAR(255) NOT NULL,
  `shipping_partner` VARCHAR(50) NULL DEFAULT 'Local',
  `order_status` ENUM('Preparing', 'On delivery', 'Delivered') NULL DEFAULT 'Preparing',
  `payment_method` ENUM('Cash', 'OnlineBanking') NOT NULL,
  `payment_status` ENUM('Unpaid', 'Paid') NULL DEFAULT 'Unpaid',
  `total_amount` DECIMAL(12,2) NOT NULL,
  `final_amount` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE INDEX `order_code` (`order_code` ASC) VISIBLE,
  INDEX `customer_id` (`customer_id` ASC) VISIBLE,
  CONSTRAINT `orders_ibfk_1`
    FOREIGN KEY (`customer_id`)
    REFERENCES `backend`.`customers` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`products` (
  `product_id` VARCHAR(10) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `image` VARCHAR(255) NULL DEFAULT NULL,
  `alcohol_content` DECIMAL(4,2) NOT NULL,
  `volume_ml` INT NOT NULL,
  `packaging_spec` VARCHAR(100) NULL DEFAULT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `long_description` TEXT NULL DEFAULT NULL,
  `origin` VARCHAR(100) NULL DEFAULT 'Việt Nam',
  `cost_price` DECIMAL(12,2) NOT NULL,
  `sale_price` DECIMAL(12,2) NOT NULL,
  `stock` INT NULL DEFAULT '0',
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `region` VARCHAR(100) NULL DEFAULT NULL,
  `manufacturer_id` VARCHAR(10) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  INDEX `fk_products_manufacturer` (`manufacturer_id` ASC) VISIBLE,
  CONSTRAINT `fk_products_manufacturer`
    FOREIGN KEY (`manufacturer_id`)
    REFERENCES `backend`.`manufacturers` (`manufacturer_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`order_details`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`order_details` (
  `detail_id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `product_id` VARCHAR(10) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`detail_id`),
  INDEX `order_id` (`order_id` ASC) VISIBLE,
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  CONSTRAINT `order_details_ibfk_1`
    FOREIGN KEY (`order_id`)
    REFERENCES `backend`.`orders` (`order_id`)
    ON DELETE CASCADE,
  CONSTRAINT `order_details_ibfk_2`
    FOREIGN KEY (`product_id`)
    REFERENCES `backend`.`products` (`product_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`payments` (
  `payment_id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` ENUM('Cash', 'OnlineBanking') NULL DEFAULT NULL,
  `payment_status` ENUM('Pending', 'Completed', 'Failed') NULL DEFAULT NULL,
  `transaction_id` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE INDEX `transaction_id` (`transaction_id` ASC) VISIBLE,
  INDEX `order_id` (`order_id` ASC) VISIBLE,
  CONSTRAINT `payments_ibfk_1`
    FOREIGN KEY (`order_id`)
    REFERENCES `backend`.`orders` (`order_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`refresh_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`refresh_tokens` (
  `session_id` INT NOT NULL AUTO_INCREMENT,
  `token_hash` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `device_info` VARCHAR(255) NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked` TINYINT(1) NULL DEFAULT '0',
  `revoked_at` DATETIME NULL DEFAULT NULL,
  `last_used_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  INDEX `idx_token_hash` (`token_hash` ASC) VISIBLE,
  INDEX `idx_user_id` (`user_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 257
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`shopping_cart_item`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`shopping_cart_item` (
  `item_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(20) NOT NULL,
  `product_id` VARCHAR(10) NOT NULL,
  `quantity` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  UNIQUE INDEX `unique_user_product` (`user_id` ASC, `product_id` ASC) VISIBLE,
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  CONSTRAINT `fk_cart_item_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `backend`.`customers` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `shopping_cart_item_ibfk_2`
    FOREIGN KEY (`product_id`)
    REFERENCES `backend`.`products` (`product_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 45
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `backend`.`user_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`user_address` (
  `address_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(20) NOT NULL,
  `address_line` VARCHAR(255) NOT NULL,
  `ward` VARCHAR(50) NULL DEFAULT NULL,
  `district` VARCHAR(50) NULL DEFAULT NULL,
  `province` VARCHAR(50) NULL DEFAULT NULL,
  `is_default` TINYINT(1) NULL DEFAULT '0',
  `address_code` VARCHAR(64) NULL DEFAULT NULL,
  PRIMARY KEY (`address_id`),
  UNIQUE INDEX `address_code` (`address_code` ASC) VISIBLE,
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  CONSTRAINT `user_address_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `backend`.`customers` (`user_id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

USE `backend` ;

-- -----------------------------------------------------
-- Placeholder table for view `backend`.`view_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`view_products` (`id` INT, `name` INT, `image` INT, `price` INT, `stock` INT, `category` INT, `region` INT, `manufacturer_name` INT, `description` INT, `long_description` INT, `volume` INT, `abv` INT, `origin` INT);

-- -----------------------------------------------------
-- Placeholder table for view `backend`.`view_products_full`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `backend`.`view_products_full` (`product_id` INT, `product_name` INT, `alcohol_content` INT, `volume_ml` INT, `packaging_spec` INT, `description` INT, `cost_price` INT, `sale_price` INT, `created_at` INT, `updated_at` INT, `manufacturer_id` INT, `manufacturer_name` INT, `manufacturer_address` INT, `manufacturer_province` INT, `manufacturer_phone` INT, `manufacturer_website` INT, `specialty_id` INT, `specialty_province` INT, `specialty_description` INT, `primary_image` INT);

-- -----------------------------------------------------
-- View `backend`.`view_products`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `backend`.`view_products`;
USE `backend`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `backend`.`view_products` AS select `p`.`product_id` AS `id`,`p`.`product_name` AS `name`,`p`.`image` AS `image`,`p`.`sale_price` AS `price`,`p`.`stock` AS `stock`,`p`.`category` AS `category`,`p`.`region` AS `region`,`m`.`manufacturer_name` AS `manufacturer_name`,`p`.`description` AS `description`,`p`.`long_description` AS `long_description`,`p`.`volume_ml` AS `volume`,`p`.`alcohol_content` AS `abv`,`p`.`origin` AS `origin` from (`backend`.`products` `p` join `backend`.`manufacturers` `m` on((`p`.`manufacturer_id` = `m`.`manufacturer_id`)));

-- -----------------------------------------------------
-- View `backend`.`view_products_full`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `backend`.`view_products_full`;
USE `backend`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `backend`.`view_products_full` AS select `backend`.`p`.`product_id` AS `product_id`,`backend`.`p`.`product_name` AS `product_name`,`backend`.`p`.`alcohol_content` AS `alcohol_content`,`backend`.`p`.`volume_ml` AS `volume_ml`,`backend`.`p`.`packaging_spec` AS `packaging_spec`,`backend`.`p`.`description` AS `description`,`backend`.`p`.`cost_price` AS `cost_price`,`backend`.`p`.`sale_price` AS `sale_price`,`backend`.`p`.`created_at` AS `created_at`,`backend`.`p`.`updated_at` AS `updated_at`,`backend`.`m`.`manufacturer_id` AS `manufacturer_id`,`backend`.`m`.`manufacturer_name` AS `manufacturer_name`,`backend`.`m`.`address` AS `manufacturer_address`,`backend`.`m`.`province` AS `manufacturer_province`,`backend`.`m`.`phone` AS `manufacturer_phone`,`backend`.`m`.`website` AS `manufacturer_website`,`backend`.`s`.`specialty_id` AS `specialty_id`,`backend`.`s`.`province_name` AS `specialty_province`,`backend`.`s`.`description` AS `specialty_description`,`backend`.`pi`.`image_url` AS `primary_image` from (((`backend`.`products` `p` left join `backend`.`manufacturers` `m` on((`backend`.`p`.`manufacturer_id` = `backend`.`m`.`manufacturer_id`))) left join `backend`.`specialties` `s` on((`backend`.`p`.`specialty_id` = `backend`.`s`.`specialty_id`))) left join `backend`.`product_images` `pi` on(((`backend`.`p`.`product_id` = `backend`.`pi`.`product_id`) and (`backend`.`pi`.`is_primary` = true))));
USE `backend`;

DELIMITER $$
USE `backend`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `backend`.`trg_create_account_id`
BEFORE INSERT ON `backend`.`customers_account`
FOR EACH ROW
BEGIN
    -- Nếu account_id chưa được truyền vào thì tự generate
    IF NEW.account_id IS NULL OR NEW.account_id = '' THEN
        SET NEW.account_id = CONCAT('ACC', NEW.user_id);
    END IF;
END$$

USE `backend`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `backend`.`trg_payments_after_insert`
AFTER INSERT ON `backend`.`payments`
FOR EACH ROW
BEGIN
    IF NEW.transaction_id IS NULL THEN
        UPDATE payments
        SET transaction_id = CONCAT(
            'TX',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            '-',
            LPAD(NEW.payment_id, 6, '0')
        )
        WHERE payment_id = NEW.payment_id;
    END IF;
END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
