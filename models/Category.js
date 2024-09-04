import mongoose from "mongoose";

const categorySchema=mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  image:{
    type:String,
    required:true
  }
 
},{timestamps:true})

const category=mongoose.model('Category',categorySchema)

export default category