import userModel from '../../models/User.js'
import addressModel from "../../models/address.js"
import bcrypt from 'bcrypt'
import couponModel from '../../models/Coupon.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //          GET PROFILE PAGE   //  //  //  //  //  //  //

export const getProfilePage=async(req,res)=>{
  try{
    // get user from database
    const userID = req.session.userID
    const user=await userModel.findById(userID)
    console.log("user",user);
    
    res.render('profile/personal-Info',{user, title:"Personal Information"})
  }catch(error){
    console.log(error);
  }
} 


//* //  //  //   //  //          EDIT PROFILE   //  //  //  //  //  //  //

export const editProfile=async(req,res)=>{
  try{
    
    const userID=req.session.userID
    
    const {name,email,mobile} = req.body
  
    // Update the user's profile information in the database
    // Using updateOne to find the user by their ID and set new values for name, email, and mobile
    await userModel.updateOne({ _id:userID }, { $set:{ name:name,email:email,mobile:mobile } } )
    
    // Update the session variable to reflect the new name
    req.session.name=name.length > 10 ?name.substring(0,10) + '...' : name;
    req.flash('success', MESSAGES.PROFILE.PROFILE_UPDATED)
    res.redirect('/profile/personal-info')

  }catch(error){
    console.log("error in edit profile",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          GET ADDRESS PAGE   //  //  //  //  //  //  //

export const getAddressPage = async(req,res) => {
  try{
    // get user id from session
    const userID= req.session.userID
    // get addresses from database
    const addresses=await addressModel.find({userId:userID})
    // render address page with addresses
    res.render('profile/address',{addresses,title:"Address"})
  }catch(error) {
    console.log("error in get address page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          GET Add ADDRESS PAGE   //  //  //  //  //  //  //

export const getAddAddressPage = async(req,res) => {
  try{
    res.render('profile/addAddress',{title:"Add Address"})
  }catch(error){
    console.log("error in get add address page",error);
  }
}

//* //  //  //   //  //              ADD ADDRESS       //  //  //  //  //  //  // 

export const postAddAddress = async(req,res) => {
  try{
    const userID= req.session.userID
    const {name,mobile,buildingName,street,city,state,country,pincode,isDefault} = req.body
    
    // max address limit
    const maxAddress = 3

    // get user address count
    const userAddresses = await addressModel.countDocuments({userId:userID})
    
    // check if user address count is greater than or equal to max address
    if(userAddresses >= maxAddress) {
      req.flash('error', MESSAGES.PROFILE.MAX_ADDRESS)
      return res.redirect('/profile/address')
    }

    // create address
    const newAddress = new addressModel( {
      userId:userID,
      name:name,
      mobile:mobile.trim(),
      buildingName:buildingName,
      street:street,
      city:city,
      state:state,
      country:country,
      pincode:pincode,
      isDefault: isDefault ? true :false
    })

   // If the new address is set as default, remove the default status from other addresses
    if(newAddress.isDefault) {
      await addressModel.updateMany({userId:userID},{$set:{isDefault:false}})
    }

    await addressModel.create(newAddress)
    req.flash('success', MESSAGES.PROFILE.ADDRESS_ADDED)
    res.redirect('/profile/address') 
  }catch(error) {
    console.log("error in add address",error);
    req.flash('error', MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
    res.redirect('/profile/address')
  }
}


//* //  //  //   //  //          EDIT ADDRESS   //  //  //  //  //  //  //

export const getEditAddressPage = async(req,res) => {
  try{
    // get address id from params
    const addressID = req.params.id
    // get address from database
    const address = await addressModel.findById(addressID)

    // render edit address page with address data
    res.render('profile/editAddress',{address, title:"Edit Address"})
  }catch(error) {
    console.log("error in get edit address page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //         POST EDIT ADDRESS   //  //  //  //  //  //  //

export const postEditAddress = async (req,res) => {
  try {
    const userID = req.session.userID
  // get address id from params
    const addressID = req.params.id
  // get address data from body
    const {name,mobile,buildingName,street,city,state,country,pincode,isDefault}  = req.body

    // create update address object
    const updateAddress =  {
      name:name,
      mobile:mobile.trim(),
      buildingName:buildingName,
      street:street ,
      city:city,
      state:state,
      country:country,
      pincode:pincode,
      isDefault:isDefault ? true : false
    }

    // if the new address is set as default, remove the default status from other addresses
    if(updateAddress.isDefault) {
      await addressModel.updateMany({userId:userID},{$set:{isDefault:false}})
    }

    // update address
    await addressModel.updateOne({_id:addressID},{$set:updateAddress})

    req.flash('success', MESSAGES.PROFILE.ADDRESS_UPDATED)
    res.redirect('/profile/address')
    
  }catch(error) {
    console.log("error in patch edit address",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          DELETE ADDRESS   //  //  //  //  //  //  //

export const deleteAddress = async (req,res) => {
try{
  // get user id from session
  const userID = req.session.userID
  // get address id from params
  const addressID = req.params.id
  // delete address
  await addressModel.deleteOne({_id:addressID,userId:userID})
  req.flash('success', MESSAGES.PROFILE.ADDRESS_DELETED)
  res.status(STATUS_CODES.OK).json({message: MESSAGES.PROFILE.ADDRESS_DELETED})
}catch(error) {
  console.log("error in delete address",error);
  res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
}
  
}
//* //  //  //   //  //          CHANGE PASSWORD   //  //  //  //  //  //  //

export const getChangePasswordPage = async(req,res) => {
  try{
    // get message from query
   
    res.render('profile/changePassword',{title:"Change Password"})
  }catch (error) {
    console.log("error in get change password page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR) 
  }
}


//* //  //  //   //  //          POST CHANGE PASSWORD      //  //  //  //  //  //  //

export const postChangePassword = async (req,res) => {
  try{
    // get user id from session
    const userID = req.session.userID
    const {confirmPassword,newPassword,currentPassword}  = req.body

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    // check if new password is valid
    if(!passwordPattern.test(newPassword)) {
      req.flash('error', MESSAGES.PROFILE.INVALID_PASSWORD) 
      return res.redirect('/profile/change-password')
    }

    // check if new password and confirm password match
    if(newPassword !== confirmPassword) {
      req.flash('error', MESSAGES.PROFILE.PASSWORD_MISMATCH) 
      return res.redirect('/profile/change-password')
    }

    // get user from database
    const user = await userModel.findById(userID)

    // compare current password with user password
    const isMatch = await bcrypt.compare(currentPassword,user.password)

    // if current password is incorrect
    if(!isMatch) {
      req.flash('error', MESSAGES.PROFILE.CURRENT_PASSWORD_INCORRECT) 
      return res.redirect('/profile/change-password')
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword,10)
  
    // update user password
    await userModel.updateOne({_id:userID},{$set:{password:hashedPassword}})

    // redirect to change password page with success message
    req.flash('success', MESSAGES.PROFILE.PASSWORD_UPDATED)
    res.redirect('/profile/change-password')

  }catch(error)  {
    console.log("error in post change password",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //          GET Coupon Page    //  //  //  //  //  //  //

export const getCouponPage = async (req,res) => {
  try {
    const couponsList = await couponModel.find({}).populate('applicableCategory').populate('applicableProduct')
    res.render('profile/coupons',{couponsList,title:"Coupons"})
  }catch (error) {
    console.error("error in get coupon page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


