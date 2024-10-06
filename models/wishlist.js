import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true,
    unique:true
  },
  productsId:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true
  }]
},{timestamps:true})

const wishlist = mongoose.model('wishlist',wishlistSchema)

export default wishlist