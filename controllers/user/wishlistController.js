import wishListModel from '../../models/wishlist.js'
import { calculateDiscountPrice } from '../../utils/discountprice.js'



//* //  //  //   //  //         GET WISHLIST PAGE   //  //  //  //  //  //  //

export const getWishListPage = async(req,res) => {
  try {
  //get the user id from the session
    const userId = req.session.userID;
    
    // pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 8;

  //find the wishlist of the user
    const wishlist = await wishListModel.findOne({ user: userId });

  //if the wishlist is not found, render the wishlist page with an empty wishlist
      if(!wishlist || !wishlist.productsId || wishlist.productsId.length === 0){
        return res.render('user/wishlist',{ wishlist:{productsId:[]}, currentPage: 1, totalPages: 1, title: "Wishlist" })
      }

      // calculate pagination
      const totalItems = wishlist.productsId.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // slice for current page and populate
      wishlist.productsId = wishlist.productsId.slice(startIndex, endIndex);
      await wishlist.populate({
        path: 'productsId',
        populate: {path: 'category', select: 'name' }
      });

      for (let product of wishlist.productsId) {
        product.discountedPrice = await calculateDiscountPrice(product);
      }
  
    res.render('user/wishlist',{ wishlist, currentPage: page, totalPages, title:"Wishlist" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}


//* //  //  //   //  //         ADD TO WISHLIST   //  //  //  //  //  //  //

export const addToWishlist = async (req, res) => {
  try {
    //get the user id from the session
    const userId = req.session.userID; // Get logged-in user ID from session
    // Check if userId is valid
    if (!userId) {
      return res.status(400).send('User not logged in');
    }
    //get the product id from the route params
    const productId = req.params.productId; 

    
    await wishListModel.updateOne(
      { user: userId }, // Find the wishlist for the user
      { $addToSet: { productsId: productId } }, // Add product to wishlist if not already present
      { upsert: true } // Create a new wishlist if one doesn't exist
    );

    //  
    res.status(200).json({message: 'Added to your wishlist'});
  } catch (error) {
    console.log(error);
    res.status(500).send('Error adding product to wishlist');
  }
};

//* //  //  //   //  //         REMOVE FROM WISHLIST   //  //  //  //  //  //  //

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.userID; 
    const product = req.params.productId; 

    
    await wishListModel.updateOne(
      { user: userId }, // Find the wishlist for the user
      { $pull: { productsId: product } } // Remove the product from the wishlist
    );

    // res.redirect('/wishlist'); 
    res.status(200).json({message: 'Removed from your wishlist'});
  } catch (error) {
    console.log(error);
    res.status(500).send('Error removing product from wishlist');
  }
};