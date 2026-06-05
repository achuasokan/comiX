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

    
    const otp =generateOTP()
    const otpExpiresAt =new Date(Date.now()+ 2 * 60 * 1000)

    req.session.tempForgotPassword = {
      email,
      otp,
      otpExpiresAt
    }

    
    await sendOTPEmail(email,otp)
   

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

   
    const tempForgotPassword = req.session.tempForgotPassword 

    if(!tempForgotPassword){
      req.flash('error', MESSAGES.PASSWORD.SESSION_EXPIRED)
      return res.redirect('/password/verify-otp')
    }

  
    const {email,otp:storedOTP,otpExpiresAt} = tempForgotPassword
    
  
    if(otp !== storedOTP || otpExpiresAt < new Date()) {
      req.flash('error', MESSAGES.AUTH.INVALID_OR_EXPIRED_OTP)
      return res.redirect('/password/verify-otp')
    }

  
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

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!passwordPattern.test(newPassword)) {
      req.flash('error', MESSAGES.AUTH.INVALID_PASSWORD_FORMAT);
      return res.redirect('/password/reset')
    }


    if(newPassword !== confirmPassword){
      req.flash('error', MESSAGES.PASSWORD.PASSWORD_MISMATCH)
      return res.redirect('/password/reset')
    }


    const tempForgotPassword = req.session.tempForgotPassword

    if(!tempForgotPassword){
      req.flash('error', MESSAGES.PASSWORD.SESSION_EXPIRED)
      return res.redirect('/password/reset')
    }

    const {email} = tempForgotPassword

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await userModel.updateOne({email},{$set:{password:hashedPassword}})


    delete req.session.tempForgotPassword


    req.flash('success', MESSAGES.PASSWORD.RESET_SUCCESS)
    res.redirect('/login')


  } catch(error) {
    console.log(error);
    req.flash('error', MESSAGES.PASSWORD.RESET_FAILED)
    res.redirect('/password/reset')

  }
}


