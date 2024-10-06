import express from "express";

import isUser  from "../middleware/userMiddleware.js";                                      //  import user middleware
import checkUserSession from '../middleware/checkUserSession.js'
import passport from "passport";                                                          //  import passport
import * as userControl from '../controllers/user/authController.js'                         //import auth controller
import * as productControl from '../controllers/user/productController.js'
import * as passwordControl from '../controllers/user/passwordController.js'
import * as profileControl from '../controllers/user/profileController.js'
import * as wishlistControl from '../controllers/user/wishlistController.js'
import * as cartControl from '../controllers/user/cartController.js'
const router=express.Router()

router.use(checkUserSession)

// //  //  //      User Auth routes  //  //  //  //  //

router.route('/login') 
    .get(userControl.getLogin) // Get login page
    .post(userControl.postLogin); // Post login

router.route('/signup') 
    .get(userControl.getSignup) // Get signup page
    .post(userControl.postSignup); // Post signup

router.get('/home',isUser,userControl.getHome)      //get user home                                           

router.post('/logout',userControl.postLogout)                                                 

// //  //  //      OTP verifying routes  //  //  //  //  //

router.route('/verify-otp')
    .get(userControl.getverifyOTP)
    .post(userControl.postverifyOTP)
router.post('/resend-otp',userControl.resendOTP)                                               //post resend otp

// //  //  //       Forgot Password routes    //  //  //  //  //

router.route('/forgotPassword')
    .get(passwordControl.getForgotPassword)
    .post(passwordControl.postForgotPassword)

router.route('/verifyPasswordOtp')
    .get(passwordControl.getVerifyPasswordOTP)
    .post(passwordControl.postVerifyPasswordOTP)                                               //post verify otp for reset/forgot password

router.post('/resendOTP',passwordControl.postresendOTP)                                        //post resend otp for reset/forgot password

router.route('/resetPassword')
    .get(passwordControl.getResetPassword)
    .post(passwordControl.postResetPassword)


// //  //  //      Google Auth routes  //  //  //  //  //

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email'] } ) )                 //google login

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),    
(req,res)=>{
  res.redirect('/home')
})




// //  //  //      Landing page routes  //  //  //  //  //

router.get('/',userControl.getlandingPage)

router.get('/shop/allProducts',productControl.getAllProductPage)

router.get('/Category/:id',productControl.getProductsByCategory)

router.get('/product/:id',productControl.getProductDetail)

// //  //  //      Product  review Adding routes  //  //  //  //  //
router.post('/product/:id/review',isUser,productControl.addReview)

// //  //  //      Profile routes  //  //  //  //  //


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

router.post("/profile/delete-address/:id",isUser,profileControl.deleteAddress)

router.route('/profile/change-password')
    .get(isUser,profileControl.getChangePasswordPage)
    .post(isUser,profileControl.postChangePassword)


// //  //  //      Wishlist routes  //  //  //  //  //

router.get('/wishlist',isUser,wishlistControl.getWishListPage)

router.post('/wishlist/:productId',isUser,wishlistControl.addToWishlist)

router.post('/wishlist/delete/:id',isUser,wishlistControl.removeFromWishlist)

// //  //  //      Cart routes  //  //  //  //  //

router.get('/cart',isUser,cartControl.getCartPage)

router.post('/cart/:productId/add',isUser,cartControl.addToCart)

router.post('/cart/:productId/update',isUser,cartControl.updateCartItemQuantity)


router.post('/cart/delete/:productId',isUser,cartControl.removeCartItem)

    export default router