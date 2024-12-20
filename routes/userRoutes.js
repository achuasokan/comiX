import express from "express";

import isUser  from "../middleware/userMiddleware.js";                                      
import checkUserSession from '../middleware/checkUserSession.js'                                                         
import * as userControl from '../controllers/user/authController.js'                         
import * as productControl from '../controllers/user/productController.js'
import * as passwordControl from '../controllers/user/passwordController.js'
import * as profileControl from '../controllers/user/profileController.js'
import * as wishlistControl from '../controllers/user/wishlistController.js'
import * as cartControl from '../controllers/user/cartController.js'
import * as checkOutControl from '../controllers/user/checkOutController.js'
import * as orderControl from '../controllers/user/orderController.js'
import * as walletControl from '../controllers/user/walletController.js'
const router=express.Router()

router.use(checkUserSession)

//^  //  //  //  //  //  //                Users Auth routes                //  //  //  //  //  //  //

router.route('/login') 
    .get(userControl.getLogin) 
    .post(userControl.postLogin); 

router.route('/signup') 
    .get(userControl.getSignup) 
    .post(userControl.postSignup); 

router.get('/home',isUser,userControl.getHome)      //get user home                                           

router.post('/logout',userControl.postLogout)                                                 

//^  //  //  //  //  //  //               OtP verifying Routes             //  //  //  //  //  //  //

router.route('/otp/verify')
    .get(userControl.getVerifyOTP)
    .post(userControl.postVerifyOTP)

router.post('/otp/resend',userControl.resendOTP)                                               

//^  //  //  //  //  //  //               Forgot Password Routes             //  //  //  //  //  //  //

router.route('/password/forgot')
    .get(passwordControl.getForgotPassword)
    .post(passwordControl.postForgotPassword)

router.route('/password/verify-otp')
    .get(passwordControl.getVerifyPasswordOTP)
    .post(passwordControl.postVerifyPasswordOTP)                                               

router.post('/password/resend-otp',passwordControl.postResendOTP)                                        

router.route('/password/reset')
    .get(passwordControl.getResetPassword)
    .post(passwordControl.postResetPassword)


//^  //  //  //  //  //  //               Landing page Routes              //  //  //  //  //  //  //

router.get('/',userControl.getLandingPage)

router.get('/shop/allProducts',productControl.getAllProductPage)

router.get('/shop/category/:id',productControl.getProductsByCategory)

router.get('/product/:id',productControl.getProductDetail)

//^  //  //  //  //  //  //             Product  review Adding Route         //  //  //  //  //  //  //

router.post('/product/:id/review',isUser,productControl.addReview)

//^  //  //  //  //  //  //               Profile  Routes                    //  //  //  //  //  //  //


router.route('/profile/personal-info')
    .get(isUser,profileControl.getProfilePage)
    .post(isUser,profileControl.editProfile)

router.get('/profile/address',isUser,profileControl.getAddressPage)

router.route('/profile/add-address')
    .get(isUser,profileControl.getAddAddressPage)
    .post(isUser,profileControl.postAddAddress)

router.route("/profile/edit-address/:id")
    .get(isUser,profileControl.getEditAddressPage)
    .post(isUser,profileControl.postEditAddress)

router.delete("/profile/delete-address/:id",isUser,profileControl.deleteAddress)

router.route('/profile/change-password')
    .get(isUser,profileControl.getChangePasswordPage)
    .post(isUser,profileControl.postChangePassword)

router.get('/profile/coupons',isUser,profileControl.getCouponPage)


//^  //  //  //  //  //  //               Wallet Routes               //  //  //  //  //  //  //

router.get('/profile/wallet',isUser,walletControl.getWalletPage)



//^  //  //  //  //  //  //               Wishlist Routes             //  //  //  //  //  //  //

router.get('/wishlist',isUser,wishlistControl.getWishListPage)

router.post('/wishlist/:productId',isUser,wishlistControl.addToWishlist)

router.delete('/wishlist/:productId/delete',isUser,wishlistControl.removeFromWishlist)

//^  //  //  //  //  //  //               Cart Routes               //  //  //  //  //  //  //

router.get('/cart',isUser,cartControl.getCartPage)

router.post('/cart/:productId/add',isUser,cartControl.addToCart)

router.patch('/cart/:productId/update',isUser,cartControl.updateCartItemQuantity)

router.delete('/cart/:productId',isUser,cartControl.removeCartItem)

//^  //  //  //  //  //  //               Checkout Routes              //  //  //  //  //  //  //

router.get('/checkout',isUser,checkOutControl.getCheckoutPage)

router.post('/checkout/add-address',isUser,checkOutControl.addNewAddress)

router.post('/checkout/place-order',isUser,checkOutControl.postOrder)

router.post('/checkout/coupons/apply',isUser,checkOutControl.applyCoupon)

router.post('/checkout/coupons/remove',isUser,checkOutControl.removeCoupon)

router.get('/checkout/order-confirmation',isUser,checkOutControl.orderConfirmation)

router.post('/checkout/address/update',isUser,checkOutControl.updateSelectedAddress)

router.post('/checkout/payment-methods/update',isUser,checkOutControl.updatePaymentMethod)

router.post('/checkout/payment/verify',isUser,checkOutControl.verifyPayment)

router.post('/checkout/payment/repay/:orderId',isUser,checkOutControl.repayOrder)

router.get('/checkout/order-failed',isUser,checkOutControl.failedOrderPage)

//^  //  //  //  //  //  //               Order History Routes             //  //  //  //  //  //  //

router.get('/profile/orders',isUser,orderControl.getOrderHistoryPage)

router.get('/order/:orderID/details/:itemId',isUser,orderControl.getOrderDetailPage)

router.post('/order/:orderID/item/:itemId/product/:productId/cancel',isUser,orderControl.orderCancel)

router.post('/order/:orderID/item/:itemId/return',orderControl.requestReturn);

router.get('/order/:orderID/invoice',isUser,orderControl.downloadInvoice)



    export default router