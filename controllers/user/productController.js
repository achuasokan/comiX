import productModel from '../../models/Product.js'
import categoryModel from '../../models/Category.js'
import {calculateDiscountPrice} from '../../utils/discountprice.js'

// //  //  //   //  //         GET PRODUCTS BY CATEGORY   //  //  //  //  //  //  //
export const getProductsByCategory = async (req,res)=> {
  try{
    const categoryId =req.params.id

    //Pagination settings
    const page = parseInt(req.query.page) || 1    //Default to page 1 if not specified                    
    const limit = 4                              // Number of products per page
    const skip = (page -1) * limit

    //sorting 
    const sortOption = req.query.sort || 'latest'

    let sortCriteria = {}
    switch (sortOption) {
      case 'asc':
        sortCriteria = {price : 1}
        break;
      case 'desc':
        sortCriteria = {price : -1}
        break;
      case 'a-z':
        sortCriteria = {name: 1}
        break;
      case 'z-a':
        sortCriteria = {name: -1}
        break;
      case 'latest':
        sortCriteria = {createdAt : -1}
        break;
      case 'discount':
        sortCriteria = {discount : -1}
        break;
      default:
        sortCriteria = {createdAt : -1}
        break;
    }

    //find the products by category id and populate the category details
    const product = await productModel
    .find({category: categoryId,isDeleted:false})
    .populate('category')
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .lean()

    //calculate the discounted price for each product
   for(let products of product) {
    products.discountedPrice = await calculateDiscountPrice(products)
   }


    //find the category by its id
    const category = await categoryModel.findById(categoryId)
    
    //if the category is not found, return a 404 error
    if(!category){
      return res.status(404).send("Category not found")
    }

  const totalProducts = await productModel.countDocuments({category: categoryId, isDeleted: false})
  const totalPages = Math.ceil(totalProducts / limit)

    //render the category products page with the products and category
    res.render('user/categoryProducts',{
      product,
      category,
      currentPage: page,
      totalPages,
      sortOption
    })

  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
  }
}

// //  //  //   //  //         GET PRODUCT DETAIL   //  //  //  //  //  //  //
export const getProductDetail = async (req,res) => {
  try{

    //get the product id from the request parameters
    const productId=req.params.id

    //find the product by its id and populate the category details
    const product = await productModel.findById(productId).populate('category').populate('reviews.userId', 'name')

    //if the product is not found, return a 404 error
    if(!product){
      return res.status(404).send("Product not found")
    }
   
    //calculate the discounted price for the product
    product.discountedPrice = await calculateDiscountPrice(product)

    //find related products by category and limit the results to 4 and also not showing the current product card on the list
    const relatedProducts = await productModel.find({category:product.category, _id:{$ne:productId}}).populate('category').limit(4)

    for(let products of relatedProducts) {
      products.discountedPrice = await calculateDiscountPrice(products)
    }

    //render the product detail page with the product and related products
    res.render('user/productDetail',{product,relatedProducts,
      
    })

  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
  }
}


export const addReview = async (req,res) => {
  try{
    const productId = req.params.id
    const {rating,comment} = req.body
    const userId = req.session.userID

    const product = await productModel.findById(productId)
    if(!product){
      return res.status(404).send("Product not found")
    }

    const review = {
      rating,
      comment,
      userId
    }

    product.reviews.push(review)
    const totalRating = product.reviews.reduce((sum,review)  => sum + review.rating, 0)
    const averageRating = totalRating / product.reviews.length
    product.rating = averageRating
    await product.save()
    res.redirect(`/product/${productId}`)
    
    
  }catch(error){
    console.log("adding review error",error);
    res.status(500).send("Internal server error")
  }
}

// //  //  //   //  //         GET ALL PRODUCTS PAGE   //  //  //  //  //  //  //

export const getAllProductPage = async(req,res) => {
  try{
  
  const categoryFilter = req.query.category || "all";                      
  const sortOption = req.query.sort || "latest"
  const searchQuery = req.query.search || ""; 
    
 // Pagination settings
 const page = parseInt(req.query.page) || 1;   //default to page 1
 const limit = 8
 const skip = (page -1) * limit

    let sortCriteria = {}
    switch (sortOption) {
      case 'asc':
        sortCriteria = {price : 1}
        break;
      case 'desc':
        sortCriteria = {price : -1}
        break;
      case 'a-z':
        sortCriteria = {name: 1}
        break;
      case 'z-a':
        sortCriteria = {name: -1}
        break;
      case 'latest':
        sortCriteria = {createdAt : -1}
        break;
      case 'discount':
        sortCriteria = {discount : -1}
        break;
      default:
        sortCriteria = {createdAt : -1}
        break;
    }

  let filterOption = {isDeleted: false}
  if(categoryFilter !== "all") {
    const category = await categoryModel.findOne({name:categoryFilter})
    if(!category) {
      return res.status(400).send("category not found")
    }
    filterOption.category = category._id
  }

  if(searchQuery){
    filterOption.name = {$regex: searchQuery, $options: 'i'}
  } 


  const product = await productModel
  .find(filterOption)
  .populate("category")
  .sort(sortCriteria)
  .skip(skip)
  .limit(limit)
  .lean()

  for(let products of product) {
    products.discountedPrice = await calculateDiscountPrice(products)
  }

  const categories =await categoryModel.find({isBlocked:false})

  const totalProducts = await productModel.countDocuments(filterOption)
  const totalPages = Math.ceil(totalProducts / limit)

  res.render('user/allProducts',  {
    product,
    categories,
    categoryFilter,
    currentPage: page,
    totalPages,
    sortOption,
    searchQuery
  })
  
  } catch(error) {
    console.log("Error in allp products page");
    res.status(500).send("Internal server error")
  }
}


