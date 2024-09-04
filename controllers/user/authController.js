import userModel from '../../models/User.js'
import bcrypt from 'bcrypt'
import { generateOTP,sendOTPEmail } from '../../utils/otp.js'                                //import otp utils



export const  getLogin=async(req,res)=>{                                   //login page
  if(req.session.userID){                                                  //if user is already logged in
    return res.redirect('/home')                                            //redirect to home page
  }else{                                                                    //if user is not logged in
    res.render('user/userLogin',{message:undefined})                        //render login page
  }
}


export const postLogin=async(req,res)=>{           //login
  try{
    const {email,password}=req.body                                                       //get email and password from request body
    const userFind=await userModel.findOne({email})                                 //find user in database
    if(!userFind){                                                                       //if user not found
      res.render("user/userLogin",{message:"Please enter a valid email address"})          //render login page
      return
    }
    if(userFind.isBlocked){                                                                  //if user is blocked                     
      res.render('user/userLogin',{message:'Your account has been blocked.Please contact Support'})
    }
    const passwordMatch=await bcrypt.compare(password,userFind.password)                  //compare password
    if(!passwordMatch){                                                                  //if password is incorrect
      res.render('user/userLogin',{message:"Please enter a valid password"})
      return
    }else{                                                                               //if password is correct
      req.session.userID=userFind._id                                                    //set user id in session
      // res.redirect('/home')
      res.send("Home Page")
    }


  }catch(error){
    console.log(error);
    return res.status(500).render('user/userLogin',{message:"Internal server error"})
    
  }
}


export const getHome=async (req,res)=> {                                     //home page
  try{
    res.render('user/userHome')
  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
    
  }
}


export const getSignup=async (req,res)=> {                                //register page
  try{
    res.render('user/userSignUp',{message:undefined})                        //render signup page

  }catch(error){
    console.log(error);
    
  }
}


export const postSignup=async(req,res)=>{                                           //register
  try{
    const {name,email,password}=req.body
    const userMatch=await userModel.findOne({email})
    if(userMatch){
      res.render('user/userSignUp',{message:"User Already Exist"})             
    }
    const hashedpassword=await bcrypt.hash(password,10)                                     //hash password

    const otp=generateOTP()                                                                 //generate otp
    const otpExpiresAt=new Date(Date.now()+2 * 60 * 1000)                                   //otp expires in 2 minutes

    
    const newuser=await userModel.create({                                                  //create new user
      name,
      email,
      password:hashedpassword,
      otp,
      otpExpiresAt
    })
    await sendOTPEmail(email,otp)                                                                //send otp to email
    res.render('user/otp',{message:'Otp Has been sent to email',email})                           //render otp page

  }catch(error){
    console.log(error);
    res.render('user/userSignUp',{message:"An error occurred during registration,Please try again"})
  }
}

export const verifyOTP=async (req,res)=>{                                                         //verify otp
  try{
    const {email,otp}=req.body                                                                    //get email and otp from request body
    const user=await userModel.findOne({email})
    if(!user){
      res.status(400).render('user/otp',{message:'User not found',email})
    }

    if(user.otp===otp && user.otpExpiresAt > new Date()){                                           //if otp is correct and not expired
      user.isVerified= true;                                                                        //set isVerified to true
      user.otp=undefined                                                                           //set otp to undefined
      user.otpExpiresAt=undefined                                                                  //set otpExpiresAt to undefined
      await user.save()                                                                           //save user
      return res.render('user/userLogin',{message:"Account verified! Please log in.",email})

    }else{
      return res.status(400).render('user/otp',{message:'Invalid Or Expired OTP',email})
    }

  }catch(error){
    console.log(error);
    res.status(500).render('user/otp',{message:"error verifying OTP",email})
  }
}


export const resendOTP=async (req,res)=>{                                                         //resend otp
  try{
    const {email}=req.body
    const user=await userModel.findOne({email})
    
    if(!user){
      res.status(400).render('user/otp',{message:'User not found',email})
    }

    const newOTP=generateOTP()                                                                    //generate new otp
    const otpExpiresAt=new Date(Date.now()+2 * 60 * 1000)                                         //otp expires in 2 minutes

    user.otp=newOTP                                                                               //set new otp
    user.otpExpiresAt=otpExpiresAt                                                                //set otpExpiresAt

    await user.save()                                                                             //save user

    await sendOTPEmail(email,newOTP)                                                              //send otp to email
    res.render('user/otp',{message:"new OTP has been sent to your email",email})                  //render otp page

  }catch(error){
    console.log('Error resending OTP',error);
    res.status(500).render('user/otp',{message:'Error resending OTP',email})
  }
}


export const postLogut=async (req,res) => {                                    //logout
  req.session.destroy((error)=>{                                               //destroy session
    if(error){
      console.log(error);
      
    }else{
      res.redirect('/')
    }
  })
}