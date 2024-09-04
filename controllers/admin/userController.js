import userModel from '../../models/User.js'

export const getUserList=async (req,res)=> {
  try{
    const usersdata=await userModel.find({})                                                //get all users from database
    res.render('admin/userList',{usersdata})                                                    //render customers page
  }catch(message){
    console.log(message);
     res.status(500).render('message', { message: 'Unable to load customers. Please try again later.' });//render message page
  }
}

export const blockUser=async (req,res)=>{
  try{
    const userId=req.params.id
    const user=await userModel.findById(userId)

    if(!user){
      return res.status(404).send("User not found")
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.redirect('/admin/users')

  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
  }
}