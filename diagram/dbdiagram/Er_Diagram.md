```mermaid

erDiagram



&nbsp;   CUSTOMERS {

&nbsp;       VARCHAR(20) user\_id PK

&nbsp;       VARCHAR(100) username

&nbsp;       VARCHAR(150) email

&nbsp;       VARCHAR(20) phone\_number

&nbsp;       VARCHAR(255) address

&nbsp;       VARCHAR(50) google\_id

&nbsp;       TIMESTAMP created\_at

&nbsp;   }



&nbsp;   CUSTOMERS\_ACCOUNT {

&nbsp;       VARCHAR(30) account\_id PK

&nbsp;       VARCHAR(20) user\_id FK

&nbsp;       ENUM login\_type

&nbsp;       VARCHAR(150) email

&nbsp;       VARCHAR(255) password\_hash

&nbsp;       VARCHAR(50) google\_id

&nbsp;       TIMESTAMP created\_at

&nbsp;   }



&nbsp;   EMAILOTP {

&nbsp;       BIGINT id PK

&nbsp;       VARCHAR(255) email

&nbsp;       ENUM otp\_type

&nbsp;       VARCHAR(255) otp\_hash

&nbsp;       DATETIME expired\_at

&nbsp;       INT attempt\_count

&nbsp;       INT max\_attempts

&nbsp;       INT resend\_count

&nbsp;       DATETIME resend\_at

&nbsp;       VARCHAR(45) ip\_address

&nbsp;       VARCHAR(255) user\_agent

&nbsp;       VARCHAR(255) device\_fingerprint

&nbsp;       DATETIME created\_at

&nbsp;       DATETIME updated\_at

&nbsp;   }



&nbsp;   LOGIN\_LOGS {

&nbsp;       INT log\_id PK

&nbsp;       INT session\_id

&nbsp;       VARCHAR(30) account\_id

&nbsp;       VARCHAR(50) input\_username

&nbsp;       VARCHAR(50) username

&nbsp;       VARCHAR(45) ip\_address

&nbsp;       VARCHAR(255) user\_agent

&nbsp;       DATETIME login\_time

&nbsp;       DATETIME logout\_time

&nbsp;       ENUM status

&nbsp;       VARCHAR(255) error\_message

&nbsp;   }



&nbsp;   REFRESH\_TOKENS {

&nbsp;       INT session\_id PK

&nbsp;       VARCHAR(255) token\_hash

&nbsp;       VARCHAR(20) user\_id

&nbsp;       VARCHAR(255) device\_info

&nbsp;       VARCHAR(45) ip\_address

&nbsp;       DATETIME expires\_at

&nbsp;       TINYINT revoked

&nbsp;       DATETIME revoked\_at

&nbsp;       DATETIME last\_used\_at

&nbsp;       DATETIME created\_at

&nbsp;       DATETIME updated\_at

&nbsp;   }



&nbsp;   USER\_ADDRESS {

&nbsp;       INT address\_id PK

&nbsp;       VARCHAR(20) user\_id FK

&nbsp;       VARCHAR(255) address\_line

&nbsp;       VARCHAR(50) ward

&nbsp;       VARCHAR(50) district

&nbsp;       VARCHAR(50) province

&nbsp;       TINYINT is\_default

&nbsp;   }



&nbsp;   MANUFACTURERS {

&nbsp;       VARCHAR(10) manufacturer\_id PK

&nbsp;       VARCHAR(255) manufacturer\_name

&nbsp;       VARCHAR(255) address

&nbsp;       VARCHAR(100) province

&nbsp;       VARCHAR(50) phone

&nbsp;       VARCHAR(255) website

&nbsp;   }



&nbsp;   SPECIALTIES {

&nbsp;       VARCHAR(10) specialty\_id PK

&nbsp;       VARCHAR(100) province\_name

&nbsp;       TEXT description

&nbsp;   }



&nbsp;   PRODUCTS {

&nbsp;       VARCHAR(10) product\_id PK

&nbsp;       VARCHAR(255) product\_name

&nbsp;       DECIMAL alcohol\_content

&nbsp;       INT volume\_ml

&nbsp;       VARCHAR(100) packaging\_spec

&nbsp;       TEXT description

&nbsp;       DECIMAL cost\_price

&nbsp;       DECIMAL sale\_price

&nbsp;       VARCHAR(10) manufacturer\_id FK

&nbsp;       VARCHAR(10) specialty\_id FK

&nbsp;       DATETIME created\_at

&nbsp;       DATETIME updated\_at

&nbsp;   }



&nbsp;   PRODUCT\_IMAGES {

&nbsp;       INT image\_id PK

&nbsp;       VARCHAR(10) product\_id FK

&nbsp;       VARCHAR(255) image\_url

&nbsp;       TINYINT is\_primary

&nbsp;       DATETIME uploaded\_at

&nbsp;   }



&nbsp;   SHOPPING\_CART {

&nbsp;       INT cart\_id PK

&nbsp;       VARCHAR(20) user\_id FK

&nbsp;       DATETIME created\_at

&nbsp;       DATETIME updated\_at

&nbsp;   }



&nbsp;   SHOPPING\_CART\_ITEM {

&nbsp;       INT item\_id PK

&nbsp;       INT cart\_id FK

&nbsp;       VARCHAR(10) product\_id FK

&nbsp;       INT quantity

&nbsp;   }



&nbsp;   ORDERS {

&nbsp;       INT order\_id PK

&nbsp;       VARCHAR(20) order\_code

&nbsp;       VARCHAR(20) customer\_id FK

&nbsp;       VARCHAR(255) shipping\_address

&nbsp;       VARCHAR(50) shipping\_partner

&nbsp;       ENUM order\_status

&nbsp;       ENUM payment\_method

&nbsp;       ENUM payment\_status

&nbsp;       DECIMAL total\_amount

&nbsp;       DECIMAL final\_amount

&nbsp;       DATETIME created\_at

&nbsp;   }



&nbsp;   ORDER\_DETAILS {

&nbsp;       INT detail\_id PK

&nbsp;       INT order\_id FK

&nbsp;       VARCHAR(10) product\_id FK

&nbsp;       INT quantity

&nbsp;       DECIMAL unit\_price

&nbsp;       DECIMAL total\_price

&nbsp;   }



&nbsp;   PAYMENTS {

&nbsp;       INT payment\_id PK

&nbsp;       INT order\_id FK

&nbsp;       DECIMAL amount

&nbsp;       ENUM payment\_method

&nbsp;       ENUM payment\_status

&nbsp;       VARCHAR(100) transaction\_id

&nbsp;       DATETIME created\_at

&nbsp;   }



&nbsp;   %% =====================

&nbsp;   %% RELATIONSHIPS

&nbsp;   %% =====================



&nbsp;   CUSTOMERS ||--o{ CUSTOMERS\_ACCOUNT : "has"

&nbsp;   CUSTOMERS ||--o{ USER\_ADDRESS : "has"

&nbsp;   CUSTOMERS ||--o{ REFRESH\_TOKENS : "session"

&nbsp;   CUSTOMERS ||--|| SHOPPING\_CART : "owns"

&nbsp;   CUSTOMERS ||--o{ ORDERS : "places"



&nbsp;   ORDERS ||--o{ ORDER\_DETAILS : "includes"

&nbsp;   ORDERS ||--o{ PAYMENTS : "payment"



&nbsp;   PRODUCTS ||--o{ ORDER\_DETAILS : "ordered"

&nbsp;   PRODUCTS ||--o{ PRODUCT\_IMAGES : "image"

&nbsp;   PRODUCTS ||--o{ SHOPPING\_CART\_ITEM : "in\_cart"



&nbsp;   MANUFACTURERS ||--o{ PRODUCTS : "produces"

&nbsp;   SPECIALTIES ||--o{ PRODUCTS : "category"



&nbsp;   SHOPPING\_CART ||--o{ SHOPPING\_CART\_ITEM : "contains"

```



