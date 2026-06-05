import userModel from '../../models/User.js'
import bcrypt from 'bcrypt'
import { generateOTP, sendOTPEmail } from '../../utils/otp.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'


//* //  //  //   //  //          getting Forgot Password page     //  //  //  //  //  //  //

export const getForgotPassword = async (req,res) => {
  try{
   
    res.render('user/forgotPassword',{title:"Forgot Password"})
  } catch(error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          post Forgot Password page     //  //  //  //  //  //  //

export const postForgotPassword = async (req,res) => {
  try{
    const {email} = req.body
    const user = await userModel.findOne( {email} )
    if(!user) {
      req.flash('error', MESSAGES.COMMON.USER_NOT_FOUND)
      return res.redirect('/password/forgot')
    }
    if(user.isBlocked){
      req.flash('error', MESSAGES.COMMON.ACCOUNT_BLOCKED)
      return res.redirect('/password/forgot')
    }

    // Generate a new OTP
    const otp =generateOTP()
    const otpExpiresAt =new Date(Date.now()+ 2 * 60 * 1000)

    // Store the email, OTP, and OTP expiration time in the session
    req.session.tempForgotPassword = {
      email,
      otp,
      otpExpiresAt
    }

    // Send the OTP to the user's email
    await sendOTPEmail(email,otp)
   
    // Redirect the user to the OTP verification page
    req.flash('success', MESSAGES.AUTH.OTP_SENT)
    res.redirect('/password/verify-otp')

  } catch(error) {
    console.log(error);
    req.flash('error', MESSAGES.PASSWORD.RESET_ERROR)
    res.redirect('/password/forgot')

  }
}


//* //  //  //   //  //        Get verify Forgot Password OTP page     //  //  //  //  //  //  //

export const getVerifyPasswordOTP =async (req,res) => {
  try{
   
    res.render('user/otpForgotPassword',{title:"Verify OTP"})

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          Post verify Forgot Password OTP page     //  //  //  //  //  //  //

export const postVerifyPasswordOTP =async (req,res) => {
  try{
    const {otp} = req.body

    // Retrieve OTP details from the session (stored during the forgot password request)
    const tempForgotPassword = req.session.tempForgotPassword 

    if(!tempForgotPassword){
      req.flash('error', MESSAGES.PASSWORD.SESSION_EXPIRED)
      return res.redirect('/password/verify-otp')
    }

    // Extract email, stored OTP, and OTP expiration time from session data
    const {email,otp:storedOTP,otpExpiresAt} = tempForgotPassword
    
    // Check if the entered OTP matches the stored OTP and is not expired
    if(otp !== storedOTP || otpExpiresAt < new Date()) {
      req.flash('error', MESSAGES.AUTH.INVALID_OR_EXPIRED_OTP)
      return res.redirect('/password/verify-otp')
    }

    // Redirect to the reset password page with a success message
    req.flash('success', MESSAGES.PASSWORD.OTP_VERIFIED)
    res.redirect('/password/reset')


  } catch(error) {

    console.log(error);
    req.flash('error', MESSAGES.PASSWORD.VERIFY_OTP_ERROR)
    res.redirect('/password/verify-otp')

  }
}


//* //  //  //   //  //          resend OTP          //  //  //  //  //  //  //

export const postResendOTP =async (req,res) => {
  try{
    const tempForgotPassword =req.session.tempForgotPassword

    if(!tempForgotPassword){
      req.flash('error', MESSAGES.PASSWORD.SESSION_EXPIRED)
      return res.redirect('/password/forgot')
    }

    const {email} = tempForgotPassword

    const newOTP = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000)

    req.session.tempForgotPassword = {
      email,
      otp: newOTP,
      otpExpiresAt
    }

    await sendOTPEmail(email, newOTP)
    req.flash('success', MESSAGES.PASSWORD.NEW_OTP_SENT)
    res.redirect('/password/verify-otp')

  } catch(error){
    console.log(error);
    req.flash('error', MESSAGES.PASSWORD.SEND_OTP_ERROR)
    res.redirect('/password/verify-otp')

  }
}


//* //  //  //   //  //          Get reset Password page     //  //  //  //  //  //  //

export const getResetPassword =async (req,res) => {
  try{
  
    res.render('user/resetPassword',{title:"Reset Password"})
    
  } catch(error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          post reset Password page         //  //  //  //  //  //  //

export const postResetPassword =async (req,res) => {
  try{
    const {newPassword,confirmPassword} = req.body
 // validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!passwordPattern.test(newPassword)) {
      req.flash('error', MESSAGES.AUTH.INVALID_PASSWORD_FORMAT);
      return res.redirect('/password/reset')
    }

 // Check if the new password and confirm password match
    if(newPassword !== confirmPassword){
      req.flash('error', MESSAGES.PASSWORD.PASSWORD_MISMATCH)
      return res.redirect('/password/reset')
    }

 // Retrieve tempForgotPassword session data
    const tempForgotPassword = req.session.tempForgotPassword

    if(!tempForgotPassword){
      req.flash('error', MESSAGES.PASSWORD.SESSION_EXPIRED)
      return res.redirect('/password/reset')
    }
 // Extract email from session data
    const {email} = tempForgotPassword

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user's password in the database
    await userModel.updateOne({email},{$set:{password:hashedPassword}})

    // Remove temporary session data after resetting the password
    delete req.session.tempForgotPassword

  
    // Redirect to the login page with a success message
    req.flash('success', MESSAGES.PASSWORD.RESET_SUCCESS)
    res.redirect('/login')


  } catch(error) {
    console.log(error);
    req.flash('error', MESSAGES.PASSWORD.RESET_FAILED)
    res.redirect('/password/reset')

  }
}


