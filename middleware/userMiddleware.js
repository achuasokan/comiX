const isUser=(req,res,next)=>{
  if(req.session.userID){
    next()
  }else{
    res.redirect('/login')
  }
}

const isUserLogout=(req,res,next)=>{
  if(req.session.userID){
    // res.redirect('/user/dashboard')
    res.redirect('/')
  }else{
    next()
  }
}
export default {
  isUser,
  isUserLogout
}