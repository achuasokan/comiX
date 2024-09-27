import productModel from '../../models/Product.js'
import categoryModel from '../../models/Category.js'


export const getProductsByCategory = async (req,res)=> {
  try{
    const categoryId =req.params.id
    //find the products by category id and populate the category details
    const product = await productModel.find({category: categoryId,isDeleted:false}).populate('category')
    //find the category by its id
    const category = await categoryModel.findById(categoryId)
    //if the category is not found, return a 404 error
    if(!category){
      return res.status(404).send("Category not found")
    }
    //render the category products page with the products and category
    res.render('user/categoryProducts',{product,category})

  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
  }
}


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

    //find related products by category and limit the results to 4 and also not showing the current product card on the list
    const relatedProducts = await productModel.find({category:product.category, _id:{$ne:productId}}).populate('category').limit(4)

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

