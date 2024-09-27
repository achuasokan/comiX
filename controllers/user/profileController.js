import userModel from '../../models/User.js'
import addressModel from "../../models/address.js"

// //  //  //   //  //          GET PROFILE PAGE   //  //  //  //  //  //  //

export const getProfilePage=async(req,res)=>{
  try{
    const user=await userModel.findById(req.session.userID)
    res.render('profile/personal-Info',{user})
  }catch(error){
    console.log(error);
  }
} 


// //  //  //   //  //          EDIT PROFILE   //  //  //  //  //  //  //

export const editProfile=async(req,res)=>{
  try{
    
    const userID=req.session.userID
    
    const {name,email,mobile} = req.body
  
    // Update the user's profile information in the database
    // Using updateOne to find the user by their ID and set new values for name, email, and mobile
    await userModel.updateOne({ _id:userID }, { $set:{ name:name,email:email,mobile:mobile } } )
    
    // Update the session variable to reflect the new name
    req.session.name=name
    res.redirect('/profile/personal-info')

  }catch(error){
    console.log("error in edit profile",error);
    res.status(500).send("internal server error")
  }
}


// //  //  //   //  //          GET ADDRESS PAGE   //  //  //  //  //  //  //

export const getAddressPage = async(req,res) => {
  try{
    const userID= req.session.userID
    const addresses=await addressModel.find({userId:userID})
    res.render('profile/address',{addresses})
  }catch(error) {
    console.log("error in get address page",error);
    res.status(500).send("internal server error in get address page")
  }
}


// //  //  //   //  //          GET ADDRESS PAGE   //  //  //  //  //  //  //

export const getAddAddressPage = async(req,res) => {
  try{
    res.render('profile/addAddress')
  }catch(error){
    console.log("error in get add address page",error);
  }
}

