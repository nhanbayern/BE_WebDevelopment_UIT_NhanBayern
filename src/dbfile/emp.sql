use backend;
	CREATE TABLE employees (
		employee_id      VARCHAR(20) PRIMARY KEY,  -- VD: NV001
		full_name        VARCHAR(100) NOT NULL,
		dob              DATE NOT NULL,             -- ngày sinh
		phone            VARCHAR(15),
		address          VARCHAR(255),
		start_date       DATE, -- ngày vào làm
		cccd             VARCHAR(20) UNIQUE,        -- căn cước công dân
		is_active        BOOLEAN DEFAULT TRUE,      -- còn làm hay không
		created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	);
INSERT INTO employees (
    employee_id,
    full_name,
    dob,
    phone,
    address,
    start_date,
    cccd,
    is_active
)
VALUES (
    'NV001',
    'Nguyễn Thiện Nhân',
    '2005-02-09',                      -- yyyy-mm-dd (định dạng chuẩn SQL)
    '0909921933',
    '124 Pham Ngu Lao, TPCT',
    '2025-10-19',                      -- yyyy-mm-dd
    '092205090405',
    TRUE
);
	CREATE TABLE employee_accounts (
		account_id       INT AUTO_INCREMENT PRIMARY KEY,
		employee_id      VARCHAR(20) NOT NULL,
		username         VARCHAR(50) UNIQUE NOT NULL,
		password_hash    VARCHAR(255) NOT NULL,
		role             ENUM('admin', 'inventory_staff', 'sales_staff') DEFAULT 'inventory_staff',
		last_login       DATETIME,
		is_locked        BOOLEAN DEFAULT FALSE,
		FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
	);
	CREATE TABLE roles (
		role_id   INT AUTO_INCREMENT PRIMARY KEY,
		role_name VARCHAR(50) UNIQUE NOT NULL,   -- admin, inventory, sales,...
		description TEXT
	);
    INSERT INTO employee_accounts (
    employee_id, username, password_hash, role, is_locked
)
VALUES (
    'NV001',
    'manager_nhan',
    '$2b$10$M4m4BoJ4VMDiO3jx8fkg0eT02blZ8AvlX2ovCE2jOvmUyzcFb/KNe',
    'manager',
    FALSE
);

-- 1️⃣ Bỏ AUTO_INCREMENT vì VARCHAR không hỗ trợ
ALTER TABLE employee_accounts MODIFY account_id INT;

-- 2️⃣ Đổi kiểu dữ liệu từ INT sang VARCHAR(10)
ALTER TABLE employee_accounts MODIFY account_id VARCHAR(10);

-- 3️⃣ Map dữ liệu sang định dạng "ACC001"
UPDATE employee_accounts
SET account_id = CONCAT('ACC', LPAD(account_id, 3, '0'));


