-- Fix trigger for orders table - MySQL 8.0
-- First, drop the old problematic AFTER INSERT trigger
DROP TRIGGER IF EXISTS trg_orders_after_insert;

-- Create new BEFORE INSERT trigger that generates order_code before insert
DELIMITER $$

CREATE TRIGGER trg_orders_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    -- If order_code is NULL, generate it using DATE + order_id
    IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
        SET NEW.order_code = CONCAT(
            'ORD',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            '-',
            LPAD(CAST(LAST_INSERT_ID() + 1 AS CHAR), 6, '0')
        );
    END IF;
END$$

DELIMITER ;

-- Verify the trigger was created
SHOW TRIGGERS LIKE 'trg_orders%';
