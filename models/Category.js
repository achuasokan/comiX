import mongoose from "mongoose";

const categorySchema =mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  image:{
    type:String,
    required:true
  },
  isBlocked:{
    type:Boolean,
    default:false
  }
 
},{timestamps:true})

const category =mongoose.model('Category',categorySchema)

export default category