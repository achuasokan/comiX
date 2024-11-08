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

//^  //  //  //  //  //  //                User Auth routes                //  //  //  //  //  //  //

router.route('/login') 
    .get(userControl.getLogin) 
    .post(userControl.postLogin); 

router.route('/signup') 
    .get(userControl.getSignup) 
    .post(userControl.postSignup); 

router.get('/home',isUser,userControl.getHome)      //get user home                                           

router.post('/logout',userControl.postLogout)                                                 

//^  //  //  //  //  //  //               OtP verifying Routes             //  //  //  //  //  //  //

router.route('/verify-otp')
    .get(userControl.getverifyOTP)
    .post(userControl.postverifyOTP)
router.post('/resend-otp',userControl.resendOTP)                                               

//^  //  //  //  //  //  //               Forgot Password Routes             //  //  //  //  //  //  //

router.route('/forgotPassword')
    .get(passwordControl.getForgotPassword)
    .post(passwordControl.postForgotPassword)

router.route('/verifyPasswordOtp')
    .get(passwordControl.getVerifyPasswordOTP)
    .post(passwordControl.postVerifyPasswordOTP)                                               

router.post('/resendOTP',passwordControl.postresendOTP)                                        

router.route('/resetPassword')
    .get(passwordControl.getResetPassword)
    .post(passwordControl.postResetPassword)


//^  //  //  //  //  //  //               Landing page Routes              //  //  //  //  //  //  //

router.get('/',userControl.getlandingPage)

router.get('/shop/allProducts',productControl.getAllProductPage)

router.get('/Category/:id',productControl.getProductsByCategory)

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

router.delete('/wishlist/delete/:productId',isUser,wishlistControl.removeFromWishlist)

//^  //  //  //  //  //  //               Cart Routes               //  //  //  //  //  //  //

router.get('/cart',isUser,cartControl.getCartPage)

router.post('/cart/:productId/add',isUser,cartControl.addToCart)

router.post('/cart/:productId/update',isUser,cartControl.updateCartItemQuantity)


router.post('/cart/delete/:productId',isUser,cartControl.removeCartItem)

//^  //  //  //  //  //  //               Checkout Routes              //  //  //  //  //  //  //

router.get('/checkout',isUser,checkOutControl.getCheckoutPage)

router.post('/checkout/add-address',isUser,checkOutControl.addNewAddress)

router.post('/checkout/place-order',isUser,checkOutControl.postOrder)

router.post('/checkout/apply-coupon',isUser,checkOutControl.applyCoupon)

router.post('/checkout/remove-coupon',isUser,checkOutControl.removeCoupon)

router.get('/checkout/order-confirmation',isUser,checkOutControl.orderConfirmation)

router.post('/checkout/update-address',isUser,checkOutControl.updateSelectedAddress)

router.post('/checkout/update-payment-method',isUser,checkOutControl.updatePaymentMethod)

router.post('/checkout/verify-payment',isUser,checkOutControl.verifyPayment)

//^  //  //  //  //  //  //               Order History Routes             //  //  //  //  //  //  //

router.get('/profile/order',isUser,orderControl.getOrderHistoryPage)

router.get('/order-detail/:orderID/:itemId',isUser,orderControl.getOrderDetailPage)

router.post('/order/cancel-item/:orderID/:itemId/:productId',isUser,orderControl.orderCancel)

router.post('/order/return-item/:orderID/:itemId',orderControl.requestReturn);



    export default router