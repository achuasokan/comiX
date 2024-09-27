const isUser=(req,res,next)=>{
  if(req.session.userID){
    next()
  }else{
    res.redirect('/login')
  }
}


export default  isUser



