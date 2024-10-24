import userModel from "../../models/User.js"

//* //  //  //   //  //          GET DASHBOARD PAGE    //  //  //  //  //  //  // 

export const getDashboard=async (req,res) =>{  
                                                   
  try{
    res.render('admin/dashboard')                                                                 
  }catch(error){
    console.log(error);
  }
}