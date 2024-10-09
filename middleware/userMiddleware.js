const isUser=(req,res,next)=>{
  console.log("user id",req.session.userID);
  if(req.session.userID){
    next()
  }else{
    res.redirect('/login')
  }
}


export default  isUser



