# ComiX Book Store E-commerce App

This is a full-stack web application for an online comic book store.
It allows users to browse, purchase, and review comics while providing an admin dashboard for managing products, categories, users, sales reports, and more.

## Features

- **User Side:**
  - Browse and search for comics by category (Marvel, DC, Manga).
  - User authentication (sign up, log in, reset password).
  - Manage user profile, orders, and wishlist.
  - Add comics to the shopping cart and proceed with secure checkout.
  - Apply discount coupons during checkout.

- **Admin Side:**
  - Manage products (add, edit, delete).
  - Manage categories, coupons, and sales reports.
  - View and manage user list.
  - Access detailed sales analytics and reports.


## Project Structure
comic-book-store/
│
├── app.js                            # Main application configuration
├── server.js                         # Starts the Express server
│   
├── config/                           # Configuration files
│   ├── db.js                         # MongoDB connection configuration
│   └── ...                           # Other configurations (e.g., for third-party services)
│   
├── controllers/                      # Logic for handling routes
│   ├── admin/                        # Admin-specific controllers
│   │   ├── adminAuthController.js      # Admin authentication logic
│   │   ├── dashboardController.js      # Admin dashboard logic
│   │   ├── productController.js        # Product management logic
│   │   ├── categoryController.js       # Category management logic
│   │   ├── couponController.js         # Coupon management logic
│   │   ├── offerController.js          # Offer management logic
│   │   ├── salesReportController.js    # Sales report generation logic
│   │   └── userController.js           # User management logic from admin side
│   │
│   ├── user/                           # User-specific controllers
│   │   ├── authController.js          # User authentication logic
│   │   ├── productController.js       # Product-related logic for users
│   │   ├── cartController.js          # Cart management logic
│   │   ├── orderController.js         # Order processing logic
│   │   └── profileController.js       # User profile management logic
│
├── middleware/                         # Middleware for authentication, error handling, etc.
│   ├── adminMiddleware.js              # Handles authentication and authorization for Admin
│   ├── userMiddleware.js              # Handles authentication and authorization for user
│   └── errorMiddleware.js             # Error handling middleware
│   
├── models/                           # MongoDB schemas
│   ├── User.js                       # User schema
│   ├── Admin.js                      # Admin schema
│   ├── Product.js                    # Product schema
│   ├── Category.js                   # Category schema
│   ├── Coupon.js                     # Coupon schema
│   ├── Order.js                      # Order schema
│   ├── Cart.js                       # Cart schema
│   └── ...                           # Other schemas as needed
│   
├── public/                           # Publicly accessible files (e.g., CSS, JS, images)
│   ├── css/                          # CSS files
│   ├── js/                           # JavaScript files
│   └── images/                       # Image assets
│   
├── routes/                           # Route definitions
│   ├── adminRoutes.js                # Admin-specific routes
│   ├── userRoutes.js                 # User-specific routes
│   └── ...                           # Other routes as needed
│   
├── utils/                            # Utility functions
│   ├── emailService.js               # Email utilities for OTP and notifications
│   └── ...                           # Other utility functions
│   
├── views/                            # EJS templates
│   ├── admin/                        # Admin-specific views
│   │   ├── adminLogin.ejs            # Admin login page
│   │   ├── dashboard.ejs             # Admin dashboard
│   │   ├── products.ejs              # Product management view
│   │   ├── categories.ejs            # Category management view
│   │   ├── coupons.ejs               # Coupon management view
│   │   ├── salesReport.ejs           # Sales report view
│   │   ├── offers.ejs                # Offer management view
│   │   └── userList.ejs              # User list management view
│   │   
│   ├── user/                         # User-specific views
│   │   ├── userLogin.ejs             # User login page
│   │   ├── userSignUp.ejs            # User signup page
│   │   ├── otp.ejs                   # OTP verification page
│   │   ├── forgetPassword.ejs        # Forgot password page
│   │   ├── resetPassword.ejs         # Reset password page
│   │   ├── home.ejs                  # Homepage
│   │   ├── productDetails.ejs        # Product details page
│   │   ├── cart.ejs                  # Cart view
│   │   └── profile.ejs               # User profile view
│   │   
│   └── partials/                     # Reusable EJS partials (e.g., header, footer)
│       ├── header.ejs    
│       └── footer.ejs    
│   
├── .env                              # Environment variables
├── .gitignore                        # Git ignore file
├── README.md                         # Project documentation
└── package.json                      # NPM dependencies and scripts


