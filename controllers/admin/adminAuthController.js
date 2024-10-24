import userModel from '../../models/User.js'


//* //  //  //   //  //          GET LOGIN Page    //  //  //  //  //  //  //
export const getAdminLogin = async (req,res) => {                                                      
  if(req.session.adminID) {                                                                          //if admin is already logged in
    res.redirect( '/admin/dashboard' )                                                                 //redirect to dashboard
  }else {
    res.render('admin/adminLogin',{message:undefined})
  }
}

//* //  //  //   //  //          POST LOGIN     //  //  //  //  //  //  //

export const postAdminLogin = async (req,res)=>{                                                       
 
  const {email,password}=req.body                                                                 //get email and password from request body  
  if(email===process.env.admin_Email && password === process.env.admin_Password){                   //if email and password are correct
    req.session.adminID=email                                                                      //set admin id in session  
    res.redirect('/admin/dashboard')                                                                //redirect to dashboard
  }else{                                                                                            //if email and password are incorrect
    res.render('admin/adminLogin',{message:"Invalid Email or Password"})
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



