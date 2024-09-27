import categoryModel from '../../models/Category.js'
import fs from 'fs'
import cloudinary from '../../config/cloudinary.js'
import mongoose from 'mongoose'

// //  //  //   //  //          GET CATEGORY PAGE   //  //  //  //  //  //  //

export const getCategory=async (req,res) => {                                                //admin category page
  try{
    const categorylist=await categoryModel.find({})                                       //get all category from database
    res.render('admin/category',{categorylist})                                                        //render category page
  }catch(message){
    console.log(message);
    res.status(500)  
  }
}


// //  //  //   //  //          GET ADD CATEGORY PAGE   //  //  //  //  //  //  //

export const getAddCategory=async (req,res)=>{                                              //add category page rendering
  try{
   return  res.render("admin/addCategory")
  }catch(error){
    console.log(error);
    res.status(500)
  }
}


// //  //  //   //  //          POST ADD CATEGORY   //  //  //  //  //  //  //

export const postAddCategory=async (req,res)=>{                                                     //post add category
  try{

const name=req.body.name
    const categoryname=await categoryModel.findOne({name})

  
    if(name.length<2){
      return res.render('admin/addCategory',{message:"Category name must be at least 2 characters"})
    }

    if(!req.file){
      return res.render('admin/addCategory',{message:"Category image is required"})
    }
    if(categoryname){
      return res.render('admin/addCategory',{exists:"Category Name already exists"})
    }
  
const result=await cloudinary.uploader.upload(req.file.path,{
  folder:'Category Image',
  use_filename:true
})
console.log("cloudinary result",result)


 await categoryModel.create({
    name:req.body.name,
    image:result.secure_url
  })
  fs.unlinkSync(req.file.path)
  res.redirect('/admin/category')
;
  }catch(error){
    console.log(error);
    res.status(500)
  }
  }


// //  //  //   //  //          GET EDIT CATEGORY PAGE    //  //  //  //  //  //  //

export const getEditCategory=async(req,res)=>{ 
  try{
    const id=req.params.id              //Extract the category ID from the request parameters

    const category=await categoryModel.findById(id)     //find the category by id
    res.render('admin/editCategory',{category})      //render the edit category page with the  found category
  }catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error"); 
  }
}


// //  //  //   //  //          POST EDIT CATEGORY     //  //  //  //  //  //  //
export const postEditCategory = async (req, res) => {
  try {
    
   
    let id = req.params.id;

    // Trim any whitespace from the ID
    id = id.trim();
    // console.log("categoryId:", id);

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid category id format");
    }

    // Prepare the category data to be updated
    const categoryData = {
      name: req.body.name, // Get the category name from the request body
      image: req.file ? // Check if a new image file is provided
        (await cloudinary.uploader.upload(req.file.path, {
          folder: "Category Image", // Upload to the "Category Image" folder in Cloudinary
          use_filename: true 
        })).secure_url : req.body.image // If no new image, use the existing image URL from the request body
    };
    console.log(categoryData);

    // Find the category by ID and update it with the new data
    const updatedcategory = await categoryModel.findByIdAndUpdate(id, categoryData, { new: true });

   
    if (req.file) {
      fs.unlinkSync(req.file.path);            //deleting the imagefrom the local file if a new image is uploaded
    }

   
    res.redirect('/admin/category');
  } catch (error) {
   
    console.log(error);
    res.status(500);
  }
};


// //  //  //   //  //          DELETE CATEGORY    //  //  //  //  //  //  //

export const deleteCategory=async(req,res)=>{
  try{
    const id=req.query.id
    const categorydelete=await categoryModel.deleteOne({_id:id})
    res.redirect('/admin/category')
  }catch(error){
    console.log(error);
    
  }
}

// //  //  //   //  //          BLOCK CATEGORY    //  //  //  //  //  //  //

export const blockCategory=async(req,res)=>{
  try{
    const categoryId=req.params.id
    const category=await categoryModel.findById(categoryId)
    if(!category){
      return res.status(404).send("Category not found")
    }
    category.isBlocked=!category.isBlocked
    await category.save()
    res.redirect('/admin/category')
  }catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error")
  }
}


// //  //  //   //  //          SEARCH CATEGORY     //  //  //  //  //  //  //

export const searchCategory=async(req,res)=>{
  try{
    const {search=""}=req.query
    const categorylist=await categoryModel.find({name:{$regex:"^"+search,$options:"i"}})
    res.render("admin/category",{categorylist})
  }catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error")
  }
}