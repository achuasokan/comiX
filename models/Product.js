import mongoose from "mongoose";

const productSchema=mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  image:[{
    type:String,
    required:true
  }],
  SKU:{
    type:String,
    required:true
  },
  price:{
    type:Number,
    required:true
  },
  stock:{
    type:Number,
    default:0,
    required:true
  },
  sold:{
    type:Number,
    default:0,
    min:0
  },
  discount:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Discount',
    default:null
  },
  rating:{
    type:Number,
    min:0,
    max:5,
    default:0
  },
  category:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Category',
    required:true
  },
  isDeleted:{type:Boolean,default:false},
  
  reviews:[{
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    comment:{type:String},
    rating:{type:Number, min:1,max:5}
  }]
},{timestamps:true})

const product=mongoose.model('Product',productSchema)

export default product