// import Category from '../../models/Category.js'


export const getCategory=async (req,res) => {                                                //admin category page
  try{
    res.render('admin/category')                                                        //render category page
  }catch(message){
    console.log(message);
    res.status(500).render('message', { message: 'Unable to load category. Please try again later.' });    
  }
}