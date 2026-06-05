import userModel from '../../models/User.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //          GET USER LIST PAGE   //  //  //  //  //  //  //
export const getUserList=async (req,res)=> {
  try{
    const page=parseInt(req.query.page) || 1
    const limit=5
    const skip=(page -1) * limit
    const usersdata=await userModel.find({}).skip(skip).limit(limit)                                              

    const totalproducts=await userModel.countDocuments({})
    const totalPages=Math.ceil(totalproducts / limit)
    const startIndex = skip + 1;

    res.render('admin/userList',{
      usersdata,
      currentPage: page,
      totalPages,
      startIndex,
      title:"Customers"
    })                                                    
  }catch(message){
    console.log(message);
     res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)                                                                           
  }
}


//* //  //  //   //  //          BLOCK USER   //  //  //  //  //  //  //
export const blockUser=async (req,res)=>{                                                    
  try{
    const userId=req.params.id                                                                
    const user=await userModel.findById(userId)                                               

    if(!user){
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.COMMON.USER_NOT_FOUND)
    }
    user.isBlocked = !user.isBlocked;                                                         
    await user.save();
    res.redirect('/admin/users')

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //          SEARCH USER   //  //  //  //  //  //  //
export const searchUser=async(req,res)=>{
  try{
    const {search=""}=req.query
    const usersdata=await userModel.find({name:{$regex:"^"+search,$options:"i"}})
    res.render('admin/userList',{usersdata,title:"Customers"})
  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}
