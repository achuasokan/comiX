
import userModel from '../../models/User.js'
import bcrypt from 'bcrypt'
import { generateOTP,sendOTPEmail } from '../../utils/otp.js'                                //import otp utils
import categoryModel from '../../models/Category.js'
import productModel from '../../models/Product.js'
import  {calculateDiscountPrice  } from '../../utils/discountprice.js'


//* //  //  //   //  //          getting Login page     //  //  //  //  //  //  //

export const  getLogin=async(req,res)=>{  
 
     //if user is logged in                                                  
  if(req.session.userID){                                                                       
    return res.redirect('/home')                                                                 
  }else{                                                                                         
    res.render('user/userLogin')                                             
  }
}

//* //  //  //   //  //          POST LOGIN     //  //  //  //  //  //  //

export const postLogin=async(req,res)=>{                                                     
  try{

  //get email and password from request body
    const {email,password}=req.body                                                       

   

      //find user in database
    const userFind=await userModel.findOne({email})  

    //if user not found                               
    if(!userFind){                                                                       
      req.flash('error',"Please enter a valid email address")
      return res.redirect('/login')
    }
    //if user is blocked
    if(userFind.isBlocked){                                                                  //if user is blocked                     
      req.flash('error','Your account has been blocked.Please contact Support')
      return res.redirect('/login')
    }

    //if user is not verified
    if(!userFind.isVerified){
      req.flash('error',"Please verify your account before login")
      return res.redirect('/login')
    }

    // compare password
    const passwordMatch=await bcrypt.compare(password,userFind.password) 

    //if password is incorrect
    if(!passwordMatch) {                                                                  
      req.flash('error',"Please enter a valid password")
      return res.redirect('/login')
    } else {   

   // If password is correct, store only the user ID in the session
   req.session.userID = userFind._id; // Only store the user ID (ObjectId)
   req.session.name = userFind.name;  // Store user name if needed
   
res.redirect('/home') 
    }
  }catch(error){
    console.log(error);
    req.flash('error',"Internal server error")
    return res.redirect('/login') 
  }
}

  //* //  //  //   //  //      GET user Home Page            //  //  //  //  //  //  //

export const getHome=async (req,res)=> {                                     
  try{
    res.redirect("/")
  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
    
  }
}

//* //  //  //   //  //          getting Signup page     //  //  //  //  //  //  //

export const getSignup=async (req,res)=> {                                
  try{
    
    res.render('user/userSignUp')                        
  }catch(error){
    console.log(error);  
  }
}

//* //  //  //   //  //          POST SIGNUP          //  //  //  //  //  //  //

export const postSignup=async(req,res)=>{                                           
  try{
    
    const {name,email,password,confirmPassword}=req.body

    //    validation    //
    let error='';
     const namepattern = /^(?! )[A-Za-z ]{4,}$/;
    const emailpattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordpattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    if(!namepattern.test(name)){
      error="Name must be at least 4 characters long and contain only letters"
    }else if(!emailpattern.test(email)){
      error="Please enter a valid email address"
    }else if(!passwordpattern.test(password)){
      error="Password must be at least 6 characters long, include upper and lower case letters, a digit and a special character."
    }else if(password !== confirmPassword){
      error="The passwords you entered do not match. Please try again."
    }

    if(error){
      req.flash('error',error)
      return res.redirect('/signup')
    }

   // check if user already exist
    const userMatch=await userModel.findOne({email})
    if(userMatch){
      req.flash('error',"User Already Exist")
      return res.redirect('/signup')
    }

    //generate otp
    const otp=generateOTP()                                                                
    const otpExpiresAt=new Date(Date.now()+2 * 60 * 1000)                                   //otp expires in 2 minutes
    
    // Store user details and OTP in the session temporarily until verification
   req.session.tempUser = {
    name,
    email,
    password,
    otp,
    otpExpiresAt
   }
   
    //send otp to email
    await sendOTPEmail(email,otp)  

   req.flash('success','OTP sent to your email. Please check your email')                          //render otp page
   return res.redirect('/verify-otp')

  }catch(error){
    console.log(error);
    req.flash('error',`An error occurred during registration,Please try again`)
    return res.redirect('/signup')
  }
}

//* //  //  //   //  //        Get  VERIFY OTP          //  //  //  //  //  //  //

export const getverifyOTP=(req,res)=>{
  try{
    
    res.render('user/otpSignup')
  }catch(error){
    console.log(error);

  }
 
}


//* //  //  //   //  //        Post   VERIFY OTP          //  //  //  //  //  //  //

export const postverifyOTP=async (req,res)=>{                                                         
  try{
    
//get otp from request body
    const {otp}=req.body

// Retrieve the temporary user data from the session
  const tempUser=req.session.tempUser
   
  if(!tempUser){
    req.flash('error',"session expired. please signup again")
    return res.redirect('/signup')
  }

// Destructure tempUser data
  const {name,email,password,otp:storedOtp,otpExpiresAt} =tempUser

// Check if the provided OTP matches and whether it is expired
  if(otp !== storedOtp || otpExpiresAt < new Date()){
    req.flash('error','invalid or Expired otp')
    return res.redirect('/verify-otp')
  }

// Hash the password 
  const hashedPassword = await bcrypt.hash(password, 10)

// Create the user in the database with the hashed password
  await userModel.create({
    name,
    email,
    password:hashedPassword,
    isVerified:true
  })
// Removing temporary user session data after successful signup
  delete req.session.tempUser

// Render login page with after successful signup
  req.flash('success','Signup Successful.Please login')
  return res.redirect('/login')

  }catch(error){
    console.log(error);
    req.flash('error',"error verifying OTP")
    return res.redirect('/verify-otp')
  }
}

//* //  //  //   //  //          resend OTP          //  //  //  //  //  //  //

export const resendOTP=async (req,res)=>{                                                         
  try{

// Retrieve the temporary user data from the session   
    const tempUser = req.session.tempUser

// If tempUser doesn't exist, prompt the user to sign up again    
  if(!tempUser || !tempUser.email){
    req.flash('error',"session expired. please signup again")
    return res.redirect('/signup')
  }
// Destructure tempUser data
  const {name,email,password} = tempUser

//generate new otp and set expiration time
    const newOTP=generateOTP()                                                                    
    const otpExpiresAt=new Date(Date.now()+2 * 60 * 1000)                                         //otp expires in 2 minutes

// Update the session with new OTP
    req.session.tempUser = {
      name,
      email,
      password,
      otp: newOTP,
      otpExpiresAt
    }

// Send the new OTP to the email
     await sendOTPEmail(email,newOTP)   

// Render OTP page with a success message                                                           
   req.flash('success','New OTP has been sent to your email')                 //render otp page
   return res.redirect('/verify-otp')

  }catch(error){
    console.log('Error resending OTP',error);
    req.flash('error',"Error sending OTP. Please try again")
    return res.redirect('/verify-otp')
  }
}

//* //  //  //   //  //          logout          //  //  //  //  //  //  //

export const postLogout=async (req,res) => {                                    //logout
  req.session.destroy((error)=>{                                               //destroy session
    if(error){
      console.log(error);
      
    }else{
      res.redirect('/')
    }
  })
}


//* //  //  //   //  //          get home page          //  //  //  //  //  //  //

export const getlandingPage=async(req,res)=>{

  try{

   //find the category list and sort them by createdAt in descending order
    const categorylist=await categoryModel.find({isBlocked:false}).sort({createdAt:-1})

    //find the latest product and populate the category details and sort them by createdAt in descending order and limit the result to 12
    let latestproduct=await productModel.find({isDeleted:false}).populate('category').sort({createdAt:-1}).limit(12)

    latestproduct = latestproduct.filter(document => !document.category.isBlocked);

    for (let product of latestproduct) {
      product.discountedPrice = await calculateDiscountPrice(product);
    }

    //render the home page with the category list and latest product
    res.render("user/home",{categorylist,latestproduct})

  }catch(error){

    console.log(error); 
    res.status(500).send("Internal server error")
  }
}






