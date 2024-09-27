import productModel from "../../models/Product.js"
import categoryModel from "../../models/Category.js"
import cloudinary from "../../config/cloudinary.js"
import fs from "fs"

// //  //  //   //  //          GET PRODUCT LIST PAGE  //  //  //  //  //  //  //
export const getProduct=async(req,res)=>{
  try{
    const page=parseInt(req.query.page) || 1;
    const limit=10;
    const skip=(page -1) * limit

    const productList=await productModel.find({isDeleted:false})
    .populate('category', 'name')
    .skip(skip)
    .limit(limit)

    const totalproducts=await productModel.countDocuments({isDeleted:false})
    const totalPages=Math.ceil(totalproducts / limit)
   
    res.render("admin/productList",{
      productList,
      currentPage: page,
      totalPages
    })

  }catch(error){
    console.log(error);
    res.status(500)
  }
}
// //  //  //   //  //          GET ADD PRODUCT PAGE   //  //  //  //  //  //  //
export const getAddProduct=async(req,res)=>{
  try{
    const categorylist=await categoryModel.find({})
    
    res.render('admin/addProducts',{categorylist})

  }catch(error){
    console.log(error);
    res.status(500)
  }
}

  // //  //  //   //  //          POST ADD PRODUCT   //  //  //  //  //  //  //


export const postAddProduct = async (req, res) => {
  try {
    const files = req.files; // Access the array of uploaded files
    const imageUrls = [];

    // Upload each image to Cloudinary
    for (let file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "Products",
        use_filename: true,
      });
      imageUrls.push(result.secure_url); // Store the Cloudinary URLs
    }

    // Create the product
    const newProduct = new productModel({
      name: req.body.productName,
      description: req.body.description,
      image: imageUrls, // Save the array of image URLs
      price: req.body.price,
      stock: req.body.stock,
      discount: req.body.discount || 0, // Default discount to 0 if not provided
      category: req.body.category,
      SKU: req.body.SKU
    });

    // Save the product to the database
    await newProduct.save();

    // Clean up the local uploaded files after uploading to Cloudinary
    files.forEach(file => fs.unlinkSync(file.path));

    res.redirect('/admin/products');
  } catch (error) {
    console.error("Error adding product:", error.message);
    res.status(500).send('Error adding product');
  }
};



// //  //  //   //  //          soft DELETE PRODUCT   //  //  //  //  //  //  //

export const softDeleteProduct=async(req,res)=>{
  try{
    const productId=req.params.id;
    const product=await productModel.findByIdAndUpdate(productId,{isDeleted:true})
    console.log(product);
    if(!product){
      return res.status(404).send("Product not found")
    }
    res.redirect("/admin/products")

  }catch(error){
    console.log(error);
    res.status(500).send("Error deleting product")
  }
}


// //  //  //   //  //         GET EDIT PRODUCT   //  //  //  //  //  //  //
export const getEditProduct=async(req,res)=>{
  try{
    const id=req.params.id;
    const categorylist=await categoryModel.find({})
    const products=await productModel.findById(id)
    res.render("admin/editProduct",{products,categorylist})

  }catch(error){
    console.log(error);
    res.status(500).send("internal server error")
  }
}


// //  //  //   //  //         POST EDIT PRODUCT   //  //  //  //  //  //  //

export const postEditProduct=async(req,res)=>{
  console.log("post edit product");
  try{
    const id=req.params.id;
    console.log("editing",id);
    const products={
      name:req.body.productName,
      description:req.body.description,
      price:req.body.price,
      stock:req.body.stock,
      discount:req.body.discount,
      category:req.body.category,
      SKU:req.body.SKU,
      image:req.file?
      (await cloudinary.uploader.upload(req.file.path,{
        folder:"Products",
        use_filename:true
      })).secure_url : req.body.image
    }
    console.log(products);

    const updatedProduct=await productModel.findByIdAndUpdate(id,products,{new: true})

    if(req.file){
      fs.unlinkSync(req.file.path)
    }
    res.redirect("/admin/products")


  }catch(error){
    console.log(error);
    res.status(500).send("internal server error")
  }
}