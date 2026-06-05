import userModel from '../../models/User.js'
import addressModel from "../../models/address.js"
import bcrypt from 'bcrypt'
import couponModel from '../../models/Coupon.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //          GET PROFILE PAGE   //  //  //  //  //  //  //

export const getProfilePage=async(req,res)=>{
  try{

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
  

    await userModel.updateOne({ _id:userID }, { $set:{ name:name,email:email,mobile:mobile } } )
    
    
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

    const userID= req.session.userID
    const addresses=await addressModel.find({userId:userID})

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
    
    
    const maxAddress = 3


    const userAddresses = await addressModel.countDocuments({userId:userID})
    

    if(userAddresses >= maxAddress) {
      req.flash('error', MESSAGES.PROFILE.MAX_ADDRESS)
      return res.redirect('/profile/address')
    }


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
    const addressID = req.params.id
    const address = await addressModel.findById(addressID)
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
  
    const addressID = req.params.id
  
    const {name,mobile,buildingName,street,city,state,country,pincode,isDefault}  = req.body


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


    if(updateAddress.isDefault) {
      await addressModel.updateMany({userId:userID},{$set:{isDefault:false}})
    }
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
  
  const userID = req.session.userID
  const addressID = req.params.id
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
    
   
    res.render('profile/changePassword',{title:"Change Password"})
  }catch (error) {
    console.log("error in get change password page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR) 
  }
}


//* //  //  //   //  //          POST CHANGE PASSWORD      //  //  //  //  //  //  //

export const postChangePassword = async (req,res) => {
  try{
    
    const userID = req.session.userID
    const {confirmPassword,newPassword,currentPassword}  = req.body

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    
    if(!passwordPattern.test(newPassword)) {
      req.flash('error', MESSAGES.PROFILE.INVALID_PASSWORD) 
      return res.redirect('/profile/change-password')
    }

   
    if(newPassword !== confirmPassword) {
      req.flash('error', MESSAGES.PROFILE.PASSWORD_MISMATCH) 
      return res.redirect('/profile/change-password')
    }


    const user = await userModel.findById(userID)

    
    const isMatch = await bcrypt.compare(currentPassword,user.password)

   
    if(!isMatch) {
      req.flash('error', MESSAGES.PROFILE.CURRENT_PASSWORD_INCORRECT) 
      return res.redirect('/profile/change-password')
    }

   
    const hashedPassword = await bcrypt.hash(newPassword,10)
  
   
    await userModel.updateOne({_id:userID},{$set:{password:hashedPassword}})


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


