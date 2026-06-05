import productModel from '../../models/Product.js'
import categoryModel from '../../models/Category.js'
import bannerModel from '../../models/Banner.js'
import {calculateDiscountPrice} from '../../utils/discountprice.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //         GET PRODUCTS BY CATEGORY   //  //  //  //  //  //  //
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
    .populate('category', 'name')
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
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.COMMON.CATEGORY_NOT_FOUND)
    }

  const totalProducts = await productModel.countDocuments({category: categoryId, isDeleted: false})
  const totalPages = Math.ceil(totalProducts / limit)

    //render the category products page with the products and category
    res.render('user/categoryProducts',{
      product,
      category,
      currentPage: page,
      totalPages,
      sortOption,
      title:category.name
    })

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //         GET PRODUCT DETAIL   //  //  //  //  //  //  //
export const getProductDetail = async (req,res) => {
  try{

 
    const productId=req.params.id

   
    const product = await productModel.findById(productId).populate('category', 'name').populate('reviews.userId', 'name')

    
    if(!product){
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.COMMON.PRODUCT_NOT_FOUND)
    }
   
   
    product.discountedPrice = await calculateDiscountPrice(product)

   
    const relatedProducts = await productModel.find({category:product.category, _id:{$ne:productId}}).populate('category', 'name').limit(4)

    for(let products of relatedProducts) {
      products.discountedPrice = await calculateDiscountPrice(products)
    }

    
    res.render('user/productDetail',{
      product,
      relatedProducts,
      title:product.name
    })

  }catch(error){
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //         ADD REVIEW   //  //  //  //  //  //  //
export const addReview = async (req,res) => {
  try{
    const productId = req.params.id
    const {rating,comment} = req.body
    const userId = req.session.userID

    const product = await productModel.findById(productId)
    if(!product){
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.COMMON.PRODUCT_NOT_FOUND)
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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //         GET ALL PRODUCTS PAGE   //  //  //  //  //  //  //

export const getAllProductPage = async (req, res) => {
  try {
    const categoryFilter = req.query.category || "all";
    const sortOption = req.query.sort || "latest";
    let  searchQuery = req.query.search || "";

    if (searchQuery.length > 12) {
      searchQuery = searchQuery.substring(0,12)+ '...';
    }

    // Pagination settings
    const page = parseInt(req.query.page) || 1; 
    const limit = 8;
    const skip = (page - 1) * limit;

    let filterOption = { isDeleted: false };
    if (categoryFilter !== "all") {
      const category = await categoryModel.findOne({ name: categoryFilter });
      if (!category) {
        return res.status(STATUS_CODES.BAD_REQUEST).send(MESSAGES.COMMON.CATEGORY_NOT_FOUND);
      }
      filterOption.category = category._id;
    }

    if (searchQuery) {
      const removeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filterOption.name = { $regex: removeQuery, $options: 'i' };
    }

  
    let products = await productModel
      .find(filterOption)
      .populate("category")
      .lean();

       products = products.filter(document => !document.category.isBlocked);
      

  
    for (let product of products) {
      product.discountedPrice = await calculateDiscountPrice(product);
    }

   
    switch (sortOption) {
      case 'discount':
        products.sort((a, b) => {
          const priceA = a.discountedPrice !== undefined ? a.discountedPrice : a.price; 
          const priceB = b.discountedPrice !== undefined ? b.discountedPrice : b.price; 
          return priceA - priceB; 
        });
        break;
      case 'discount-desc':
        products.sort((a, b) => {
          const priceA = a.discountedPrice !== undefined ? a.discountedPrice : a.price; 
          const priceB = b.discountedPrice !== undefined ? b.discountedPrice : b.price; 
          return priceB - priceA; 
        });
        break;
      case 'a-z':
        products.sort((a, b) => a.name.localeCompare(b.name)); 
        break;
      case 'z-a':
        products.sort((a, b) => b.name.localeCompare(a.name)); 
        break;
      default:
        products.sort((a, b) => b.createdAt - a.createdAt); 
        break;
    }

  
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const paginatedProducts = products.slice(skip, skip + limit);

    const categories = await categoryModel.find({ isBlocked: false });
    const banners = await bannerModel.findOne({title:'Festival', isActive:true})

    res.render('user/allProducts', {
      product: paginatedProducts,
      categories,
      categoryFilter,
      currentPage: page,
      totalPages,
      sortOption,
      searchQuery,
      title:"All Products",
      banners
    });

  } catch (error) {
    console.log("Error in all products page", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}


