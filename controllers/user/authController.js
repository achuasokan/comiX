import userModel from '../../models/User.js'
import bcrypt from 'bcrypt'
import { generateOTP,sendOTPEmail } from '../../utils/otp.js'                                //import otp utils
import categoryModel from '../../models/Category.js'
import productModel from '../../models/Product.js'
import bannerModel from '../../models/Banner.js'
import  {calculateDiscountPrice  } from '../../utils/discountprice.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'


//* //  //  //   //  //          getting Login pagessss     //  //  //  //  //  //  //

export const  getLogin=async(req,res)=>{  
 
     //if user is logged in                                                  
  if(req.session.userID){                                                                       
    return res.redirect('/home')                                                                 
  }else{                                                                                         
    res.render('user/userLogin',{title:"Login"})                                             
  }
}

//* //  //  //   //  //          POST LOGIN     //  //  //  //  //  //  //

export const postLogin=async(req,res)=>{                                                     
  try{


    const {email,password}=req.body                                                       

   

    
    const userFind=await userModel.findOne({email})  

                               
    if(!userFind){                                                                       
      req.flash('error',MESSAGES.AUTH.INVALID_EMAIL)
      return res.redirect('/login')
    }
 
    if(userFind.isBlocked){                                                                                    
      req.flash('error',MESSAGES.COMMON.ACCOUNT_BLOCKED)
      return res.redirect('/login')
    }

   
    if(!userFind.isVerified){
      req.flash('error',MESSAGES.AUTH.UNVERIFIED_ACCOUNT)
      return res.redirect('/login')
    }

  
    const passwordMatch=await bcrypt.compare(password,userFind.password) 

   
    if(!passwordMatch) {                                                                  
      req.flash('error',MESSAGES.AUTH.INVALID_PASSWORD)
      return res.redirect('/login')
    } else {   

   
   req.session.userID = userFind._id; 
   req.session.name = userFind.name.length > 10 ? userFind.name.substring(0, 10) + '...' : userFind.name;  
   
   
res.redirect('/home') 
    }
  }catch(error){
    console.log(error);
    req.flash('error',MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
    return res.redirect('/login') 
  }
}

  //* //  //  //   //  //      GET user Home Page            //  //  //  //  //  //  //

export const getHome=async (req,res)=> {                                     
  try{
    res.redirect("/")
  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
    
  }
}

//* //  //  //   //  //          getting Signup page     //  //  //  //  //  //  //

export const getSignup=async (req,res)=> {                                
  try{
    
    res.render('user/userSignUp',{title:"Signup"})                        
  }catch(error){
    console.log(error);  
  }
}

//* //  //  //   //  //          POST SIGNUP          //  //  //  //  //  //  //

export const postSignup=async(req,res)=>{                                           
  try{
    
    const {name,email,password,confirmPassword}=req.body

   
    let error='';
     const namepattern = /^(?! )[A-Za-z ]{3,20}$/;
    const emailpattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordpattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    if(!namepattern.test(name)){
      error=MESSAGES.AUTH.INVALID_NAME_FORMAT
    }else if(!emailpattern.test(email)){
      error=MESSAGES.AUTH.INVALID_EMAIL
    }else if(!passwordpattern.test(password)){
      error=MESSAGES.AUTH.INVALID_PASSWORD_FORMAT
    }else if(password !== confirmPassword){
      error=MESSAGES.AUTH.PASSWORD_MISMATCH
    }

    if(error){
      req.flash('error',error)
      return res.redirect('/signup')
    }

  
    const userMatch=await userModel.findOne({email})
    if(userMatch){
      req.flash('error',MESSAGES.AUTH.USER_ALREADY_EXISTS)
      return res.redirect('/signup')
    }

  
    const otp=generateOTP()                                                                
    const otpExpiresAt=new Date(Date.now()+2 * 60 * 1000)                                   
    
   
   req.session.tempUser = {
    name,
    email,
    password,
    otp,
    otpExpiresAt:otpExpiresAt.toISOString()
   }

   
    //send otp to email
    await sendOTPEmail(email,otp)  

   req.flash('success',MESSAGES.AUTH.OTP_SENT)                         
   return res.redirect('/otp/verify')

  }catch(error){
    console.log(error);
    req.flash('error',MESSAGES.AUTH.REGISTRATION_ERROR)
    return res.redirect('/signup')
  }
}

//* //  //  //   //  //        Get  VERIFY OTP          //  //  //  //  //  //  //

export const getVerifyOTP=(req,res)=>{
  try{
    
    res.render('user/otpSignup',{title:"Verify OTP", session: req.session})
  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.AUTH.VERIFY_OTP_ERROR)
  }
 
}


//* //  //  //   //  //        Post   VERIFY OTP          //  //  //  //  //  //  //

export const postVerifyOTP=async (req,res)=>{                                                         
  try{
    

    const {otp}=req.body


  const tempUser=req.session.tempUser
   
  if(!tempUser){
    req.flash('error',MESSAGES.AUTH.SESSION_EXPIRED)
    return res.redirect('/signup')
  }


  const {name,email,password,otp:storedOtp,otpExpiresAt} =tempUser


  if(otp !== storedOtp || otpExpiresAt < new Date()){
    req.flash('error',MESSAGES.AUTH.INVALID_OR_EXPIRED_OTP)
    return res.redirect('/otp/verify')
  }


  const hashedPassword = await bcrypt.hash(password, 10)


  await userModel.create({
    name,
    email,
    password:hashedPassword,
    isVerified:true
  })

  delete req.session.tempUser


  req.flash('success',MESSAGES.AUTH.SIGNUP_SUCCESS)
  return res.redirect('/login')

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.AUTH.VERIFY_OTP_ERROR)
  }
}

//* //  //  //   //  //          resend OTP          //  //  //  //  //  //  //

export const resendOTP=async (req,res)=>{                                                         
  try{  
    const tempUser = req.session.tempUser

  if(!tempUser || !tempUser.email){
    req.flash('error',MESSAGES.AUTH.SESSION_EXPIRED)
    return res.redirect('/signup')
  }
  const {name,email,password} = tempUser

    const newOTP=generateOTP()                                                                    
    const otpExpiresAt=new Date(Date.now()+2 * 60 * 1000)                                        

    req.session.tempUser = {
      name,
      email,
      password,
      otp: newOTP,
      otpExpiresAt:otpExpiresAt.toISOString()
    }


     await sendOTPEmail(email,newOTP)   
                                                          
   req.flash('success',MESSAGES.AUTH.NEW_OTP_SENT)                
   return res.redirect('/otp/verify')

  }catch(error){
    console.log('Error resending OTP',error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.AUTH.RESEND_OTP_ERROR)
  }
}

//* //  //  //   //  //          logout          //  //  //  //  //  //  //

export const postLogout=async (req,res) => {                                
  req.session.destroy((error)=>{                                             
    if(error){
      console.log(error);
      
    }else{
      res.redirect('/')
    }
  })
}


//* //  //  //   //  //          get home pagesss          //  //  //  //  //  //  //

export const getLandingPage=async(req,res)=>{

  try{

 
    const categoryList=await categoryModel.find({isBlocked:false}).sort({createdAt:-1})

    const banner = await bannerModel.findOne({title:'Home Page', isActive:true})
    let latestProduct=await productModel.find({isDeleted:false}).populate('category').sort({createdAt:-1}).limit(12)

    latestProduct = latestProduct.filter(document => !document.category.isBlocked);

    for (let product of latestProduct) {
      product.discountedPrice = await calculateDiscountPrice(product);
    }


    res.render("user/home",{categoryList,latestProduct,banner, title:"comiX"})

  }catch(error){

    console.log(error); 
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}
