import userModel from "../../models/User.js"

export const getDashboard=async (req,res) =>{                                                    //admin dashboard
  try{
    res.render('admin/dashboard')                                                                 //render dashboard
  }catch(error){
    console.log(error);
  }
}