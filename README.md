# 📚 ComiX — Online Comic Book Store E-Commerce Platform

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-4.x-black.svg?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.style=for-the-badge&logo=mongodb)
![EJS](https://img.shields.io/badge/EJS-Templates-B52E31.svg?style=for-the-badge)
![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-0C2340.svg?style=for-the-badge)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20Storage-3448C5.svg?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)

**ComiX** is a feature-rich, full-stack MVC web application designed for comic book enthusiasts and online retailers. Built with **Node.js**, **Express.js**, **MongoDB**, and **EJS**, ComiX offers a modern shopping experience for purchasing comic books, graphic novels, and manga (Marvel, DC, Anime, etc.), accompanied by a powerful administrative control panel for store operations, inventory management, analytics, and sales reporting.

---

## 🌟 Table of Contents

- [Key Features](#-key-features)
  - [Customer Experience (User Side)](#1-customer-experience-user-side)
  - [Store Management (Admin Dashboard)](#2-store-management-admin-dashboard)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Environment Variables Setup](#-environment-variables-setup)
- [Getting Started & Installation](#-getting-started--installation)
- [Database Models Overview](#-database-models-overview)
- [Key API & Web Routes](#-key-api--web-routes)
- [Security & Architecture Highlights](#-security--architecture-highlights)
- [Scripts](#-scripts)
- [License & Author](#-license--author)

---

## 🌟 Key Features

### 1. Customer Experience (User Side)
* **Authentication & Authorization**:
  * Local Sign Up and Login with encrypted password storage (`bcrypt`).
  * **Google OAuth 2.0 Integration**: Quick one-click login via Google Passport strategy.
  * Password Reset & Email Verification powered by OTP notifications (`nodemailer`/`resend`).
* **Comic Storefront & Search**:
  * Browse comics by publishers & categories (e.g., Marvel, DC, Manga, Graphic Novels).
  * Advanced search, category filtering, price sorting, and detailed comic product pages.
* **Shopping Cart & Wishlist**:
  * Dynamic cart management (add, update quantities, real-time stock validation, remove items).
  * Wishlist functionality to save favorite comic issues for later.
* **Address Book & User Profile**:
  * Manage multiple shipping addresses (Add, Edit, Delete).
  * View past order history with real-time tracking statuses.
  * Personal wallet integration for instant refund credits and seamless checkouts.
* **Checkout & Payments**:
  * Secure checkout workflow with address selection.
  * Integrated **Razorpay Payment Gateway** for card, UPI, and online payments.
  * Cash on Delivery (COD) and Wallet payment options.
  * Apply discount coupons and promotional offers during checkout.
* **Order Management & Invoices**:
  * Download PDF invoices generated dynamically using `PDFKit`.
  * Order cancellation and return request management.

---

### 2. Store Management (Admin Dashboard)
* **Analytics & Sales Reports**:
  * Interactive dashboard with visual key performance indicators (KPIs).
  * Generate and export comprehensive sales reports in **PDF** (`PDFKit`) and **Excel** (`ExcelJS`) formats based on daily, weekly, or custom date ranges.
* **Product & Inventory Control**:
  * Complete CRUD for comic books (title, author, publisher, cover artwork, price, stock count, description).
  * Cloud-based image management using **Cloudinary** and `multer`.
* **Category & Offer Management**:
  * Categorize comics and manage category status (list/unlist).
  * Create category-wise and product-wise discount offers with promotional banners.
* **Coupon Management**:
  * Create, edit, and deactivate discount coupons with minimum purchase criteria and expiration dates.
* **Customer Management**:
  * View list of registered users.
  * Block or unblock users to control platform access.
* **Order Administration**:
  * Track all customer orders and update status (Pending, Processing, Shipped, Delivered, Cancelled, Returned).

---

## 🛠 Tech Stack & Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime Environment** | Node.js (ES Modules) | Server-side JavaScript execution runtime |
| **Web Framework** | Express.js | Web framework for routing and HTTP handling |
| **Database** | MongoDB & Mongoose ODM | NoSQL document database and schema modeling |
| **View Engine** | EJS & Express-EJS-Layouts | Server-rendered UI templating system |
| **Authentication** | Passport.js & Passport-Google-OAuth20 | Local authentication & Google OAuth login |
| **Cloud Storage** | Cloudinary & Multer | Image uploads and CDN media storage |
| **Payment Gateway** | Razorpay SDK | Payment processing and online transactions |
| **File Generation** | PDFKit & ExcelJS | PDF invoice generation & Excel report export |
| **Security & Utilities** | Bcrypt, Dotenv, Nocache, Morgan | Hashing, environment configs, cache control, logging |

---

## 📁 Project Architecture & Directory Structure

```
Comix/
│
├── config/                           # System Configuration Files
│   ├── db.js                         # MongoDB connection configuration
│   ├── cloudinary.js                 # Cloudinary API configuration
│   ├── passport.js                   # Passport Google OAuth & Local strategies
│   └── razorpay.js                   # Razorpay instance setup
│   
├── controllers/                      # MVC Request Controllers
│   ├── admin/                        # Admin Controllers
│   │   ├── adminAuthController.js    # Admin login & session management
│   │   ├── categoryController.js      # Category management logic
│   │   ├── couponController.js        # Discount coupon logic
│   │   ├── dashboardController.js     # Admin dashboard & analytics logic
│   │   ├── offerController.js         # Promotional offer logic
│   │   ├── productController.js       # Inventory & product CRUD
│   │   ├── salesReportController.js   # Sales report PDF/Excel generator
│   │   └── userController.js          # Customer account management
│   │
│   └── user/                          # User Controllers
│       ├── authController.js          # Registration, login, OTP & password reset
│       ├── cartController.js          # Shopping cart processing
│       ├── orderController.js         # Order processing & payment verification
│       ├── productController.js       # Store catalog browsing & details
│       └── profileController.js       # User profile, wallet, address & wishlist
│
├── middleware/                       # Custom Express Middleware
│   ├── adminMiddleware.js             # Admin authorization guard
│   ├── userMiddleware.js              # User authentication session guard
│   ├── checkUserSession.js            # Active session validator
│   ├── errorMiddleware.js             # Global error handler
│   └── multerMiddleware.js            # Multi-part image upload handling
│  
├── models/                           # Mongoose Schemas & Models
│   ├── address.js                     # User multi-address schema
│   ├── Admin.js                      # Admin schema
│   ├── Banner.js                     # Storefront banner schema
│   ├── Cart.js                       # User shopping cart schema
│   ├── Category.js                   # Product category schema
│   ├── Coupon.js                     # Discount coupon schema
│   ├── discount.js                   # Offer discount schema
│   ├── Order.js                      # Order details & tracking schema
│   ├── Product.js                    # Comic book product schema
│   ├── User.js                       # Customer profile schema
│   ├── wallet.js                     # Customer wallet & transaction schema
│   └── wishlist.js                   # User wishlist schema
│   
├── public/                           # Static Web Assets
│   ├── css/                          # Application stylesheet files
│   ├── js/                           # Front-end JavaScript logic
│   └── images/                       # Brand icons and placeholder assets
│   
├── routes/                           # Express Route Modules
│   ├── adminRoutes.js                # Administrative routes (`/admin/*`)
│   ├── googleAuthRoutes.js           # Google OAuth callback routes
│   └── userRoutes.js                 # Customer store routes (`/*`)
│   
├── utils/                            # Helper Utilities
│   ├── Otp.js                        # Email notification & OTP dispatch
│   └── ...                           # Additional helper scripts
│   
├── views/                            # Server-Rendered EJS Views
│   ├── admin/                        # Admin panel templates
│   ├── user/                         # User storefront templates
│   ├── layouts/                      # Core layout structures (`layout.ejs`)
│   └── partials/                     # Reusable layout partials (`header`, `footer`)
│   
├── uploads/                          # Temporary local directory for Multer uploads
├── .env                              # Environment variable configuration (Git ignored)
├── .gitignore                        # Git exclusion file
├── app.js                            # Express app configuration & middleware setup
├── server.js                         # Application entry point
├── package.json                      # Node project configuration & dependencies
└── README.md                         # Project documentation
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory of the project and populate it with the following configuration keys:

```env
# Application Configuration
PORT=8000
SESSION_SECRET=your_super_secret_session_key

# Database
MONGO_URI=mongodb://localhost:27017/comix_db

# Cloudinary Setup (For Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

# Razorpay Payment Gateway Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Nodemailer / Email Service Credentials
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

---

## 🚀 Getting Started & Installation

### Prerequisites
Make sure you have the following software installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or higher)
* [MongoDB](https://www.mongodb.com/) (Local server running or a MongoDB Atlas URI)
* Git

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/Comix.git
   cd Comix
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create your `.env` file in the root directory (refer to the [Environment Variables Setup](#-environment-variables-setup) section).

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:8000`.*

5. **Start in Production Mode**:
   ```bash
   npm start
   ```

---

## 🗄 Database Models Overview

The database uses Mongoose ORM with schemas designed for e-commerce transactions:

* **User**: Customer profile details, authentication credentials, status flags (blocked/unblocked), and Google ID.
* **Product**: Comic details (title, author, publisher, category, original price, offer price, stock quantity, Cloudinary image URLs).
* **Category**: Comic genres and publishers (e.g., Marvel, DC, Manga) with active status flags.
* **Cart**: User-specific items list with quantities and subtotal calculations.
* **Order**: Placed orders including shipping addresses, item snapshots, payment method, payment status, pricing breakdown, and fulfillment status logs.
* **Wishlist**: Saved comics linked to user accounts.
* **Wallet**: Digital wallet balance and transaction history (credits for refunds, debits for purchases).
* **Coupon**: Discount codes with percentage/fixed deductions, minimum spend limits, and validity period.
* **Banner**: Promotional dashboard banners for storefront highlight.

---

## 🛣 Key API & Web Routes

### User Routes (`/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Storefront Homepage |
| `GET` | `/login` / `/signup` | User login and registration forms |
| `GET` | `/auth/google` | Trigger Google OAuth 2.0 login flow |
| `GET` | `/shop` | Comic catalog with filter, search, and sort options |
| `GET` | `/product/:id` | Individual comic details page |
| `GET` / `POST` | `/cart` | View and add items to cart |
| `GET` / `POST` | `/checkout` | Checkout interface and order placement |
| `POST` | `/verify-payment` | Razorpay payment signature verification |
| `GET` | `/profile` | User account control, order history, and wallet |

### Admin Routes (`/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/login` | Admin portal login |
| `GET` | `/admin/dashboard` | Main analytics dashboard |
| `GET` / `POST` | `/admin/products` | Manage and add new comic book inventory |
| `GET` / `POST` | `/admin/category` | Category management |
| `GET` / `POST` | `/admin/coupons` | Discount coupon creation and control |
| `GET` | `/admin/salesReport` | Sales reports generator (PDF / Excel export) |
| `GET` / `POST` | `/admin/users` | Customer management (Block / Unblock users) |

---

## 🛡 Security & Architecture Highlights

* **ES Modules (`import`/`export`)**: Modern modular codebase structured around clean ES Module standards.
* **Password Hashing**: `bcrypt` encryption ensures passwords are never stored in plain text.
* **Session Guarding & Auth Middleware**: `adminMiddleware` and `userMiddleware` prevent unauthorized access to restricted routes.
* **No-Cache Policy**: `nocache` middleware prevents sensitive account pages from being stored in client browser history.
* **Image Cloud Storage Integration**: Client file uploads are captured temporarily via `multer` and streamed to **Cloudinary** CDN, keeping local server storage lean.
* **Robust Layout System**: `express-ejs-layouts` maintains consistent header, footer, and sidebar partials across user and admin views.

---

## 📜 Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `nodemon server.js` | Starts server with live-reloading for development |
| `npm start` | `node server.js` | Starts application server for production |

---

## 👤 Author & License

* **Author**: Achu
* **License**: [ISC License](https://opensource.org/licenses/ISC)

---
*Created with ❤️ for Comic Book & Graphic Novel Lovers everywhere!*



