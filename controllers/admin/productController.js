import productModel from "../../models/Product.js"
import categoryModel from "../../models/Category.js"
import cloudinary from "../../config/cloudinary.js"
import fs from "fs"

//* //  //  //   //  //          GET PRODUCT LIST PAGE  //  //  //  //  //  //  //
export const getProduct=async(req,res)=>{
  try{
    const page=parseInt(req.query.page) || 1;
    const limit=7;
    const skip=(page -1) * limit

    const productList=await productModel.find({isDeleted:false})
    .populate('category', 'name')
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)

    const totalproducts=await productModel.countDocuments({isDeleted:false})
    const totalPages=Math.ceil(totalproducts / limit)
    const startIndex = skip + 1;
   
    res.render("admin/productList",{
      productList,
      currentPage: page,
      totalPages,
      startIndex,
      title:"Products"
    })

  }catch(error){
    console.log(error);
    res.status(500)
  }
}
//* //  //  //   //  //          GET ADD PRODUCT PAGE   //  //  //  //  //  //  //
export const getAddProduct=async(req,res)=>{
  try{
    const categorylist=await categoryModel.find({isBlocked:false})
    
    res.render('admin/addProducts',{categorylist,title:"Add Product"})

  }catch(error){
    console.log(error);
    res.status(500)
  }
}

  //* //  //  //   //  //          POST ADD PRODUCT   //  //  //  //  //  //  //

  export const postAddProduct = async (req, res) => {
    const files = req.files || [];
    try {
      const { productName, description, category, price, stock, SKU } = req.body;
      
  
      // validation
      const errors = [];
  
      //  Validate Product Name
      const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
      if (!productName || !productNameRegex.test(productName)) {
        errors.push("Product name must be between 3 and 50 characters.");
      }
  
      //  Validate Description
      const descriptionRegex = /^[a-zA-Z][\s\S]{9,999}$/;
      if (!description || !descriptionRegex.test(description.trim())) {
        errors.push("Description must be between 10 and 1000 characters.");
      }
  
      //  Validate Category
      if (!category) {
        errors.push("Please select a category.");
      }
  
      //  Validate Price
      const Price = parseFloat(price);
      if (isNaN(Price) || Price <= 0) {
        errors.push("Price must be a number greater than zero.");
      }
  
      //  Validate Stock
      const Stocks = parseFloat(stock);
      if (isNaN(Stocks) || Stocks < 0 || !Number.isInteger(Stocks)) {
        errors.push("Stock must be a number and zero or greater.");
      }
  
      //  Validate SKU
      const skuRegex = /^[a-zA-Z0-9\-]+$/;
      if (!SKU || !skuRegex.test(SKU)) {
        errors.push("Invalid SKU format. Only letters, numbers, and dashes are allowed.");
      }

      if (files.length === 0) {
        errors.push('Please upload at least one image')
      } else if (files.length > 3) {
        errors.push('You can upload up to 3 images')
      } else {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        const maxSize = 10 * 1024 * 1024; // 10 MB
        for (let  file of files) {
          if (!allowedTypes.includes(file.mimetype)) {
            errors.push(`Invalid file type ${file.originalname}. Only jpeg, png, jpg, gif, webp and svg are allowed.`)
          }

          if (file.size > maxSize) {
            errors.push(`File ${file.originalname} is too large. Maximum size is 10 MB`)
          }
        }
      }
       
      //  Check for existing product with same name or SKU
      const existingProduct = await productModel.findOne({ $or: [{ SKU: SKU }, {name: productName}] })
      if(existingProduct) {
        errors.push('A product is already exists with this name or SKU')
      }

      
  
      // If there are validation errors, return them
      if (errors.length > 0) {
        req.flash('error',errors)
        return res.redirect('/admin/addProduct')
      }
  
      // Upload each image to Cloudinary
      const imageUrls = [];
      for (let file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Products",
          use_filename: true,
        });
        imageUrls.push(result.secure_url);
      }
  
      // Create the product
      const newProduct = new productModel({
        name: productName,
        description: description,
        image: imageUrls, // Save the array of image URLs
        price: Price,
        stock: Stocks,
        category: category,
        SKU: SKU,
      });

      req.flash('success','product added successfully')
  
      // Save the product to the database
      await newProduct.save();
  
      res.redirect('/admin/products');
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).send('Error adding product');
    } finally {
      // Clean up the local uploaded files after uploading to Cloudinary
      files.forEach(file => {
        if(file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
      });
    }
  };



//* //  //  //   //  //          soft DELETE PRODUCT   //  //  //  //  //  //  //

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


//* //  //  //   //  //         GET EDIT PRODUCT   //  //  //  //  //  //  //
export const getEditProduct=async(req,res)=>{
  try{
    const id=req.params.id;
    const categorylist=await categoryModel.find({isBlocked:false})
    const products=await productModel.findById(id).populate('category')
    res.render("admin/editProduct",{products,categorylist,title:"Edit Product"})

  }catch(error){
    console.log(error);
    res.status(500).send("internal server error")
  }
}

//* //  //  //   //  //          POST EDIT PRODUCT   //  //  //  //  //  //  //

export const postEditProduct = async (req, res) => {
  const files = req.files || [];
  try {
    const id = req.params.id;
    const { productName, description, price, stock, category, SKU, existingImages } = req.body;

    const currentProduct = await productModel.findById(id);

    //  validation
    const errors = [];

    //  Validate Product Name
    const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
    if (!productName || !productNameRegex.test(productName)) {
      errors.push("Product name must be between 3 and 50 characters.");
    }

    //  Validate Description
    const descriptionRegex = /^[a-zA-Z][\s\S]{9,999}$/;
    if (!description || !descriptionRegex.test(description.trim())) {
      errors.push("Description must be between 10 and 1000 characters.");
    }

    //  Validate Category
    if (!category) {
      errors.push("Please select a category.");
    }

    //  Validate Price
    const Price = parseFloat(price);
    if (isNaN(Price) || Price <= 0) {
      errors.push("Price must be a number greater than zero.");
    }

    //  Validate Stock
    const Stocks = parseFloat(stock);
    if (isNaN(Stocks) || Stocks < 0 || !Number.isInteger(Stocks)) {
      errors.push("Stock must be a whole number and zero or greater.");
    }

    //  Validate SKU
    const skuRegex = /^[a-zA-Z0-9\-]+$/;
    if (!SKU || !skuRegex.test(SKU)) {
      errors.push("Invalid SKU format. Only letters, numbers, and dashes are allowed.");
    }

    // Check for existing product with same name or SKU (excluding the current product)
    const existingProduct = await productModel.findOne({
      $or: [{ SKU: SKU }, { name: productName }],
      _id: { $ne: id }
    });

    if (existingProduct) {
      errors.push('Another product already exists with this name or SKU');
    }


    let updatedImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];

      //  Validate Image
      if (files.length > 3) {
        errors.push('You can upload up to 3 images');
      } else {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        const maxSize = 10 * 1024 * 1024; // 10 MB
        for (let file of files) {
          if (!allowedTypes.includes(file.mimetype)) {
            errors.push(`Invalid file type ${file.originalname}. Only jpeg, png, jpg, gif, webp, and svg are allowed.`);
          }

          if (file.size > maxSize) {
            errors.push(`File ${file.originalname} is too large. Maximum size is 10 MB.`);
          }
        }
      }
    
     //  Validate Image
    if (updatedImages.length === 0 && files.length === 0){
      errors.push('Please upload at least one image');
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      req.flash('error', errors);
      return res.redirect(`/admin/editProduct/${id}`);
    }

    // Prepare the update object
    const updateData = {
      name: productName,
      description: description,
      price: Price,
      stock: Stocks,
      category: category,
      SKU: SKU,
    };

    // Handle image updates
   
    if (files && files.length > 0) {
      for (let file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Products",
          use_filename: true,
        });
        updatedImages.push(result.secure_url);
      }
    }

    updateData.image = updatedImages;

    // Update the product
    const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal server error");
  } finally {
    // Clean up the local uploaded files
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
};





