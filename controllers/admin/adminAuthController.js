import userModel from '../../models/User.js'



export const getAdminLogin=async (req,res) => {                                                      //admin login page
  if(req.session.adminID){                                                                          //if admin is already logged in
    res.redirect('/admin/dashboard')                                                                 //redirect to dashboard
  }else{
    res.render('admin/adminLogin',{message:undefined})
  }
}

export const postAdminLogin=async (req,res)=>{                                                       //admin login
 
  const {email,password}=req.body                                                                 //get email and password from request body  
  if(email===process.env.admin_Email && password===process.env.admin_Password){                   //if email and password are correct
    req.session.adminID=email                                                                      //set admin id in session  
    res.redirect('/admin/dashboard')                                                                //redirect to dashboard
  }else{                                                                                            //if email and password are incorrect
    res.render('admin/adminLogin',{message:"Invalid Email or Password"})
  }
}




export const getLogout=async (req,res) => {                                                    //admin logout 
  req.session.destroy((message)=>{
    if(message){
      console.log(message);
      
    }else{
      res.redirect('/admin/login')
    }
  })
}

