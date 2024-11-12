import userModel from "../../models/User.js"

//* //  //  //   //  //          GET DASHBOARD PAGE    //  //  //  //  //  //  // 

export const getDashboard=async (req,res) =>{  
                                                   
  try{
    res.render('admin/dashboard',{title:"Dashboard"})                                                                 
  }catch(error){
    console.log(error);
  }
}