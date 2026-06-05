import userModel from '../../models/User.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //          GET LOGIN Page    //  //  //  //  //  //  //
export const getAdminLogin = async (req,res) => {                                                      
  if(req.session.adminID) {                                                                          //if admin is already logged in
    res.redirect( '/admin/dashboard' )                                                                 //redirect to dashboard
  }else {
    res.render('admin/adminLogin',{title:"Admin Login"})
  }
}

//* //  //  //   //  //          POST LOGIN     //  //  //  //  //  //  //

export const postAdminLogin = async (req,res)=>{                                                       
 
  const {email,password}=req.body                                                                 //get email and password from request body  
  if(email===process.env.admin_Email && password === process.env.admin_Password){                   //if email and password are correct
    req.session.adminID=email                                                                      //set admin id in session  
    res.redirect('/admin/dashboard')                                                                //redirect to dashboard
  }else{                                                                                            //if email and password are incorrect
    req.flash('error',[MESSAGES.ADMIN.INVALID_CREDENTIALS])
    res.redirect('/admin/login')
  }
}



//* //  //  //   //  //            LOGOUT       //  //  //  //  //  //  // 

export const getLogout=async (req,res) => {                                                   
  req.session.destroy((error)=>{
    if(error){
      console.log(error);    
    }else{
      res.redirect('/admin/login')
    }
  })
}



