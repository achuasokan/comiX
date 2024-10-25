import wishListModel from '../../models/wishlist.js'
import userModel from '../../models/User.js'
import productModel from '../../models/Product.js'



//* //  //  //   //  //         GET WISHLIST PAGE   //  //  //  //  //  //  //

export const getWishListPage = async(req,res) => {
  try {
  //get the user id from the session
    const userId = req.session.userID;
  //find the wishlist of the user
    const wishlist = await wishListModel.findOne({ user: userId })
      .populate({
        path: 'productsId',
        populate: { path: 'category', select: 'name' } 
      });
  //if the wishlist is not found, render the wishlist page with an empty wishlist
      if(!wishlist){
        return res.render('user/wishlist',{wishlist:{productsId:[]}})
      }
  
    res.render('user/wishlist', { wishlist });
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

    res.redirect('/wishlist'); 
  } catch (error) {
    console.log(error);
    res.status(500).send('Error adding product to wishlist');
  }
};

//* //  //  //   //  //         REMOVE FROM WISHLIST   //  //  //  //  //  //  //

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.userID; 
    const product = req.params.id; 

    
    await wishListModel.updateOne(
      { user: userId }, // Find the wishlist for the user
      { $pull: { productsId: product } } // Remove the product from the wishlist
    );

    res.redirect('/wishlist'); 
  } catch (error) {
    console.log(error);
    res.status(500).send('Error removing product from wishlist');
  }
};