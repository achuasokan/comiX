import productModel from "../../models/Product.js"
import categoryModel from "../../models/Category.js"
import cloudinary from "../../config/cloudinary.js"
import fs from "fs"
import { STATUS_CODES } from "../../constants/statusCodes.js"
import { MESSAGES } from "../../constants/messages.js"

//* //  //  //   //  //          GET PRODUCT LIST PAGEs  //  //  //  //  //  //  //
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

    const totalProducts=await productModel.countDocuments({isDeleted:false})
    const totalPages=Math.ceil(totalProducts / limit)
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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}
//* //  //  //   //  //          GET ADD PRODUCT PAGE   //  //  //  //  //  //  //
export const getAddProduct=async(req,res)=>{
  try{
    const categoryList=await categoryModel.find({isBlocked:false})
    
    res.render('admin/addProducts',{categoryList,title:"Add Product"})

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

  //* //  //  //   //  //          POST ADD PRODUCTs  //  //  //  //  //  //  //

  export const postAddProduct = async (req, res) => {
    const files = req.files || [];
    try {
      const { productName, description, category, price, stock, SKU } = req.body;
      
  
      
      const errors = [];
  
  
      const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
      if (!productName || !productNameRegex.test(productName)) {
        errors.push(MESSAGES.PRODUCT.INVALID_NAME_LENGTH);
      }
  
    
      const descriptionRegex = /^[a-zA-Z][\s\S]{9,999}$/;
      if (!description || !descriptionRegex.test(description.trim())) {
        errors.push(MESSAGES.PRODUCT.INVALID_DESCRIPTION_LENGTH);
      }
  
      
      if (!category) {
        errors.push(MESSAGES.PRODUCT.CATEGORY_REQUIRED);
      }
  
    
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0 || !/^\d+(\.\d{1,2})?$/.test(price)) {
          errors.push(MESSAGES.PRODUCT.INVALID_PRICE);
      }
  
      
      const Stocks = parseFloat(stock);
      if (isNaN(Stocks) || Stocks < 0 || !Number.isInteger(Stocks)) {
        errors.push(MESSAGES.PRODUCT.INVALID_STOCK);
      }
  
      
      const skuRegex = /^[a-zA-Z0-9\-]+$/;
      if (!SKU || !skuRegex.test(SKU)) {
        errors.push(MESSAGES.PRODUCT.INVALID_SKU);
      }

      if (files.length === 0) {
        errors.push(MESSAGES.PRODUCT.IMAGE_REQUIRED)
      } else if (files.length > 3) {
        errors.push(MESSAGES.PRODUCT.MAX_IMAGES_EXCEEDED)
      } else {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        const maxSize = 10 * 1024 * 1024; // 10 MB
        for (let  file of files) {
          if (!allowedTypes.includes(file.mimetype)) {
            errors.push(MESSAGES.PRODUCT.INVALID_IMAGE_TYPE)
          }

          if (file.size > maxSize) {
            errors.push(MESSAGES.PRODUCT.IMAGE_SIZE_EXCEEDED)
          }
        }
      }
       
    
      const existingProduct = await productModel.findOne({ $or: [{ SKU: SKU }, {name: productName}] })
      if(existingProduct) {
        errors.push(MESSAGES.PRODUCT.ALREADY_EXISTS)
      }

      
  
      
      if (errors.length > 0) {
        req.flash('error',errors)
        return res.redirect('/admin/addProduct')
      }
  
    
      const imageUrls = [];
      for (let file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Products",
          use_filename: true,
        });
        imageUrls.push(result.secure_url);
      }
  
    
      const newProduct = new productModel({
        name: productName,
        description: description,
        image: imageUrls, 
        price: priceValue,
        stock: Stocks,
        category: category,
        SKU: SKU,
      });

      req.flash('success', MESSAGES.PRODUCT.ADD_SUCCESS)
  
     
      await newProduct.save();
  
      res.redirect('/admin/products');
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
    } finally {
      
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
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.COMMON.PRODUCT_NOT_FOUND)
    }
    res.redirect("/admin/products")

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //         GET EDIT PRODUCT   //  //  //  //  //  //  //
export const getEditProduct=async(req,res)=>{
  try{
    const id=req.params.id;
    const categoryList=await categoryModel.find({isBlocked:false})
    const products=await productModel.findById(id).populate('category')
    res.render("admin/editProduct",{products,categoryList,title:"Edit Product"})

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //          POST EDIT PRODUCT   //  //  //  //  //  //  //

export const postEditProduct = async (req, res) => {
  const files = req.files || [];
  try {
    const id = req.params.id;
    const { productName, description, price, stock, category, SKU, existingImages } = req.body;

    const currentProduct = await productModel.findById(id);

 
    const errors = [];


    const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
    if (!productName || !productNameRegex.test(productName)) {
      errors.push(MESSAGES.PRODUCT.INVALID_NAME_LENGTH);
    }

  
    const descriptionRegex = /^[a-zA-Z][\s\S]{9,999}$/;
    if (!description || !descriptionRegex.test(description.trim())) {
      errors.push(MESSAGES.PRODUCT.INVALID_DESCRIPTION_LENGTH);
    }

    
    if (!category) {
      errors.push(MESSAGES.PRODUCT.CATEGORY_REQUIRED);
    }

  
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0 || !/^\d+(\.\d{1,2})?$/.test(price)) {
        errors.push(MESSAGES.PRODUCT.INVALID_PRICE);
    }

  
    const Stocks = parseFloat(stock);
    if (isNaN(Stocks) || Stocks < 0 || !Number.isInteger(Stocks)) {
      errors.push(MESSAGES.PRODUCT.INVALID_STOCK);
    }

  
    const skuRegex = /^[a-zA-Z0-9\-]+$/;
    if (!SKU || !skuRegex.test(SKU)) {
      errors.push(MESSAGES.PRODUCT.INVALID_SKU);
    }

    const existingProduct = await productModel.findOne({
      $or: [{ SKU: SKU }, { name: productName }],
      _id: { $ne: id }
    });

    if (existingProduct) {
      errors.push(MESSAGES.PRODUCT.ALREADY_EXISTS);
    }


    let updatedImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];

      
      if (files.length > 3) {
        errors.push(MESSAGES.PRODUCT.MAX_IMAGES_EXCEEDED);
      } else {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        const maxSize = 10 * 1024 * 1024; // 10 MB
        for (let file of files) {
          if (!allowedTypes.includes(file.mimetype)) {
            errors.push(MESSAGES.PRODUCT.INVALID_IMAGE_TYPE);
          }

          if (file.size > maxSize) {
            errors.push(MESSAGES.PRODUCT.IMAGE_SIZE_EXCEEDED);
          }
        }
      }
    
     
    if (updatedImages.length === 0 && files.length === 0){
      errors.push(MESSAGES.PRODUCT.IMAGE_REQUIRED);
    }
    if (errors.length > 0) {
      req.flash('error', errors);
      return res.redirect(`/admin/editProduct/${id}`);
    }

   
    const updateData = {
      name: productName,
      description: description,
      price: priceValue ,
      stock: Stocks,
      category: category,
      SKU: SKU,
    };

    
   
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

    
    const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  } finally {
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
};





