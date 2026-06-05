export const MESSAGES = {
    COMMON: {
        INTERNAL_SERVER_ERROR: "Internal server error",
        PRODUCT_NOT_FOUND: "Product not found",
        CATEGORY_NOT_FOUND: "Category not found",
        ACCOUNT_BLOCKED: "Your account has been blocked. Please contact Support",
        USER_NOT_FOUND: "User not found"
    },
    ADMIN: {
        INVALID_CREDENTIALS: "Invalid Email or Password"
    },
    AUTH: {
        INVALID_EMAIL: "Please enter a valid email address",
        UNVERIFIED_ACCOUNT: "Please verify your account before login",
        INVALID_PASSWORD: "Please enter a valid password",
        INVALID_NAME_FORMAT: "Name must be between 3 to 20 characters long and contain only alphabets.",
        INVALID_PASSWORD_FORMAT: "Password must be at least 6 characters long, include upper and lower case letters, a digit and a special character.",
        PASSWORD_MISMATCH: "The passwords you entered do not match. Please try again.",
        USER_ALREADY_EXISTS: "User Already Exist",
        OTP_SENT: "OTP sent to your email. Please check your email",
        REGISTRATION_ERROR: "An error occurred during registration,Please try again",
        SESSION_EXPIRED: "session expired. please signup again",
        INVALID_OR_EXPIRED_OTP: "invalid or Expired otp",
        SIGNUP_SUCCESS: "Signup Successful.Please login",
        NEW_OTP_SENT: "New OTP has been sent to your email",
        VERIFY_OTP_ERROR: "Internal server error in verify OTP",
        RESEND_OTP_ERROR: "Internal server error in resend OTP",
        NOT_LOGGED_IN: "User not logged in"
    },
    PASSWORD: {
        RESET_ERROR: "An Error occurred during password reset. Please try again",
        SESSION_EXPIRED: "session expired. please try again",
        OTP_VERIFIED: "OTP verified successfully. Please reset your password",
        VERIFY_OTP_ERROR: "An Error occurred during verifying OTP. Please try again",
        NEW_OTP_SENT: "New OTP has been sent to your email. Please check your email",
        SEND_OTP_ERROR: "Error sending OTP. Please try again",
        PASSWORD_MISMATCH: "The password you entered do not match.Please try again",
        RESET_SUCCESS: "Password reset successfully. Please login with your new password",
        RESET_FAILED: "Error reseting password. Please try again"
    },
    CART: {
        OUT_OF_STOCK: "Not enough stock available",
        MAX_QUANTITY_REACHED: "You cannot add more than 5 of the same item to your cart.",
        ADD_SUCCESS: "Product added to cart successfully",
        CART_NOT_FOUND: "Cart not found",
        INVALID_QUANTITY: "Invalid quantity",
        UPDATE_ERROR: "Error updating cart item quantity",
        REMOVE_ERROR: "Error removing cart item",
        GENERAL_ERROR: "Something went wrong.Please try again later."
    },
    PRODUCT: {
        INVALID_NAME_LENGTH: "Product name must be between 3 and 50 characters.",
        INVALID_DESCRIPTION_LENGTH: "Description must be between 10 and 1000 characters.",
        CATEGORY_REQUIRED: "Please select a category.",
        INVALID_PRICE: "Product Price must be a valid number greater than zero and can have up to two decimal places.",
        INVALID_STOCK: "Stock must be a whole number and zero or greater.",
        INVALID_SKU: "Invalid SKU format. Only letters, numbers, and dashes are allowed.",
        IMAGE_REQUIRED: "Please upload at least one image.",
        MAX_IMAGES_EXCEEDED: "You can upload up to 3 images.",
        INVALID_IMAGE_TYPE: "Invalid file type. Only jpeg, png, jpg, gif, webp, and svg are allowed.",
        IMAGE_SIZE_EXCEEDED: "File is too large. Maximum size is 10 MB.",
        ALREADY_EXISTS: "A product already exists with this name or SKU.",
        ADD_SUCCESS: "Product added successfully."
    },
    CATEGORY: {
        INVALID_NAME_LENGTH: "Category name must be at least 2 and maximum 30 characters",
        IMAGE_REQUIRED: "Please upload at least one image",
        INVALID_IMAGE_TYPE: "Invalid file Type.please upload a valid image file",
        IMAGE_SIZE_EXCEEDED: "File size exceeds the limit of 10 MB",
        ALREADY_EXISTS: "Category name already exists",
        INVALID_ID: "Invalid category ID format",
        INVALID_NAME_FORMAT: "Category name must be between 2 and 30 characters and can include letters, numbers, spaces, and special characters. It must start with a letter."
    },
    COUPON: {
        INVALID_CODE: "Coupon code must be uppercase letters.",
        INVALID_FIXED_DISCOUNT: "Discount value for fixed type must be a whole number greater than zero.",
        INVALID_PERCENTAGE_DISCOUNT: "Discount value for percentage type must be a whole number between 1 and 100.",
        INVALID_MIN_SPEND: "Minimum spend must be a whole number greater than zero.",
        INVALID_USAGE_LIMIT: "Usage limit must be a whole number greater than zero.",
        INVALID_START_DATE: "Start date must be today or a future date.",
        INVALID_EXPIRY_DATE: "Expiry date must be a valid date.",
        EXPIRY_BEFORE_START: "Expiry date must be same or after start date.",
        APPLICABLE_TYPE_REQUIRED: "Applicable type is required.",
        PRODUCT_EXISTS: "A coupon already exists for this product.",
        CATEGORY_EXISTS: "A coupon already exists for this category.",
        ALL_EXISTS: "A coupon already exists for all products.",
        CODE_EXISTS: "A coupon already exists with this coupon code."
    },
    ORDER: {
        NOT_FOUND: "Order or item not found",
        STATUS_CHANGE_ERROR: "Cannot change item status anymore",
        ITEM_NOT_FOUND: "Item not found",
        INVALID_ID: "Invalid Order ID or Item ID",
        CANCELLED: "Order cancelled successfully",
        RETURN_REQUESTED: "Return request submitted successfully"
    },
    BANNER: {
        INVALID_TITLE_LENGTH: "Banner title must be between 3 and 50 characters",
        INVALID_DESCRIPTION_LENGTH: "Description must be between 10 to 50 characters",
        IMAGE_REQUIRED: "Please upload at least one image",
        MAX_IMAGES_EXCEEDED: "You can upload up to 3 images",
        INVALID_IMAGE_TYPE: "Invalid file type. Only jpeg, png, jpg, gif, webp and svg are allowed",
        IMAGE_SIZE_EXCEEDED: "File is too large. Maximum size is 10 MB",
        ALREADY_EXISTS: "A banner already exists with this title",
        ADD_SUCCESS: "Banner added successfully",
        NOT_FOUND: "Banner not found"
    },
    DASHBOARD: {
        LOAD_ERROR: "Error loading dashboard"
    },
    DISCOUNT: {
        INVALID_VALUE: "Discount value must be a number between 1 to 90.",
        PRODUCT_EXISTS: "A discount already exists for this product.",
        CATEGORY_EXISTS: "A discount already exists for this category.",
        NOT_FOUND: "Discount not found"
    },
    CHECKOUT: {
        OUT_OF_STOCK: "Some of the items in your cart are out of stock. Please update your cart before proceeding to checkout.",
        INVALID_ADDRESS: "Invalid address",
        COD_LIMIT_EXCEEDED: "COD is not available for orders above ₹1000",
        INSUFFICIENT_WALLET_BALANCE: "Insufficient balance in wallet",
        ORDER_PLACED: "Order placed successfully",
        INVALID_PAYMENT_METHOD: "Invalid payment method",
        PAYMENT_VERIFIED: "Payment verified successfully",
        PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
        INVALID_COUPON: "Invalid coupon code",
        COUPON_EXPIRED: "Coupon is not valid for the current date",
        COUPON_NOT_APPLICABLE: "Coupon not applicable to the current products",
        COUPON_CANNOT_BE_APPLIED: "This coupon cannot be applied right now. Please select a different one.",
        COUPON_LIMIT_REACHED: "Coupon limit reached",
        COUPON_APPLIED: "Coupon applied successfully",
        NO_COUPON_APPLIED: "No coupon applied",
        COUPON_REMOVED: "Coupon removed successfully",
        NO_ORDERS_FOUND: "No orders found",
        ADDRESS_SELECTED: "Address selected successfully",
        PAYMENT_METHOD_SELECTED: "Payment method selected successfully"
    },
    PROFILE: {
        PROFILE_UPDATED: "Profile updated successfully",
        MAX_ADDRESS: "You can only add up to 3 addresses",
        ADDRESS_ADDED: "Address added successfully",
        ADDRESS_UPDATED: "Address updated successfully",
        ADDRESS_DELETED: "Address deleted successfully",
        INVALID_PASSWORD: "Password must be at least 6 characters long, include upper and lower case letters, a digit, and a special character.",
        PASSWORD_MISMATCH: "The passwords you entered do not match. Please try again.",
        CURRENT_PASSWORD_INCORRECT: "The current password you entered is incorrect. Please try again.",
        PASSWORD_UPDATED: "Password updated successfully"
    },
    WISHLIST: {
        ADDED: "Added to your wishlist",
        ADD_ERROR: "Error adding product to wishlist",
        REMOVED: "Removed from your wishlist",
        REMOVE_ERROR: "Error removing product from wishlist"
    }
};
