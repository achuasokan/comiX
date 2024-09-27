import userModel from '../../models/User.js'
import bcrypt from 'bcrypt'
import { generateOTP, sendOTPEmail } from '../../utils/otp.js'


// //  //  //   //  //          getting Forgot Password page     //  //  //  //  //  //  //

export const getForgotPassword = async (req,res) => {
  try{
    const message = req.query.message || undefined
    res.render('user/forgotPassword',{message})
  } catch(error) {
    console.log(error);
    res.status(500).send("Internal server Error")
  }
}


// //  //  //   //  //          post Forgot Password page     //  //  //  //  //  //  //

export const postForgotPassword = async (req,res) => {
  try{
    const {email} = req.body
    const user = await userModel.findOne( {email} )
    if(!user) {
      return res.status(400).render('user/forgotPassword',{message:'User not found'})
    }
    if(user.isBlocked){
      return res.status(400).render('user/forgotPassword',{message: "your account has been blocked. Please Contact Support"})
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
    res.status(200).redirect('verifyPasswordOtp?message=OTP sent to your email.Please check your email')

  } catch(error) {
    console.log(error);
    res.status(500).render('user/forgotPassowrd',{message:"An Error occurred during password reset. Please try again"})

  }
}


// //  //  //   //  //        Get verify Forgot Password OTP page     //  //  //  //  //  //  //

export const getVerifyPasswordOTP =async (req,res) => {
  try{
    const message = req.query.message || undefined
    res.render('user/otpForgotPassword',{message})

  }catch(error){
    console.log(error);
    res.status(500).send("Internal server Error")
  }
}


// //  //  //   //  //          Post verify Forgot Password OTP page     //  //  //  //  //  //  //

export const postVerifyPasswordOTP =async (req,res) => {
  try{
    const {otp} = req.body

    // Retrieve OTP details from the session (stored during the forgot password request)
    const tempForgotPassword = req.session.tempForgotPassword 

    if(!tempForgotPassword){
      return res.status(400).render('user/otpForgotPassword',{message:'session expired. please try again'})
    }

    // Extract email, stored OTP, and OTP expiration time from session data
    const {email,otp:storedOTP,otpExpiresAt} = tempForgotPassword
    
    // Check if the entered OTP matches the stored OTP and is not expired
    if(otp ==! storedOTP && otpExpiresAt < new Date()) {
      return res.status(400).render('user/otpForgotPassword',{message:'invalid or expired otp'})
    }

    // Redirect to the reset password page with a success message
    res.redirect('/resetPassword?message=OTP verified successfully. Please reset your password')


  } catch(error) {

    console.log(error);
    res.status(500).render('user/otpForgotPassword',{message:"An Error occurred during verifying OTP. Please try again"})

  }
}


// //  //  //   //  //          resend OTP          //  //  //  //  //  //  //

export const postresendOTP =async (req,res) => {
  try{
    const tempForgotPassword =req.session.tempForgotPassword

    if(!tempForgotPassword){
      return res.status(400).redirect('/forgotPassword?message=session expired. please try again')
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
    res.redirect('/verifyPasswordOtp?message=New OTP has been sent to your email. Please check your email')

  } catch(error){
    console.log(error);
    res.redirect('/verifyPasswordOtp?message=Error sending OTP. Please try again')

  }
}


// //  //  //   //  //          Get reset Password page     //  //  //  //  //  //  //

export const getResetPassword =async (req,res) => {
  try{
    //get message for when user otp verified successfully
    const message = req.query.message || undefined
    res.render('user/resetPassword',{message})
    
  } catch(error) {
    console.log(error);
    res.status.send('Internal server Error')
  }
}


// //  //  //   //  //          post reset Password page         //  //  //  //  //  //  //

export const postResetPassword =async (req,res) => {
  try{
    const {newPassword,confirmPassword} = req.body
 // validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!passwordPattern.test(newPassword)) {
      return res.status(400).render('user/resetPassword', {
        message: 'Password must be at least 6 characters long, include upper and lower case letters, a digit, and a special character.'
      });
    }

 // Check if the new password and confirm password match
    if(newPassword !== confirmPassword){
      return res.status(400).redirect('/forgotPassword?message=session expired. please try again')
    }

 // Retrieve tempForgotPassword session data
    const tempForgotPassword = req.session.tempForgotPassword

    if(!tempForgotPassword){
      return res.status(400).render('user/resetPassword',{message:'session expired. please try again'})
    }
 // Extract email from session data
    const {email} = tempForgotPassword

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // await userModel.findOneAndUpdate({email},{password:hashedPassword})

    // Update the user's password in the database
    await userModel.updateOne({email},{$set:{password:hashedPassword}})

    // Remove temporary session data after resetting the password
    delete req.session.tempForgotPassword

    // res.render('user/userLogin',{message:'Password reset successfully. Please login with your new password'})
   
    // Redirect to the login page with a success message
    res.redirect('/login?message=Password reset successfully. Please login with your new password')


  } catch(error) {
    console.log(error);
    res.status(500).render('user/resetPassword',{message:"Error reseting password. Please try again"})

  }
}


