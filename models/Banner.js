import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  image:[{
    type:String,
    required:true
  }],
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
})

const banner = mongoose.model('Banner', bannerSchema)

export default banner