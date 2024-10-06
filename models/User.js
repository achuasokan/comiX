import mongoose from "mongoose";

const userSchema=mongoose.Schema({
  name: {
    type:String,
    required:true
  },
  email: {
    type:String,
    required:true,
    unique:true
  },
  password: {
    type:String,
    minlength:6
  },
  googleId:{
    type:String
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  otp:{
    type:String
  },
  otpExpiresAt:{
    type:Date
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  mobile:{
    type:Number
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Cart'
  }
},{timestamps:true})

const User= mongoose.model('User',userSchema)

export default User