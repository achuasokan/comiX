import express from "express";
import * as userControl from '../controllers/user/authController.js'                                //import auth controller
import userMiddleware  from "../middleware/userMiddleware.js";                                      //  import user middleware
import passport from "passport";                                                                    //  import passport

const router=express.Router()


router.get('/login',userControl.getLogin)                                              //get login

router.post('/login',userControl.postLogin)                                             //post login

router.get('/home',userMiddleware.isUser,userControl.getHome)                           //get home

router.get('/signup',userControl.getSignup)                                             //get register

router.post("/signup",userControl.postSignup)                                            //post register

router.post('/logout',userControl.postLogut)                                                //post logout


router.post('/verify-otp',userControl.verifyOTP)                                            //post verify otp

router.post('/resend-otp',userControl.resendOTP)                                              //post resend otp



router.get('/auth/google',passport.authenticate('google',{scope:['profile','email'] } ) )                 //google login

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'user/userLogin'}),    
(req,res)=>{
  res.render('user/userHome')
})



export default router