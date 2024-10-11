import cartModel from '../../models/Cart.js';
import addressModel from '../../models/address.js';
import orderModel from '../../models/Order.js';
import productModel from '../../models/Product.js';
import mongoose from 'mongoose'


// //  //  //   //  //          get Checkout page     //  //  //  //  //  //  //
export const getCheckoutPage = async (req, res) => {
  try {
    // Get the user's cart
    const cart = await cartModel.findOne({ user: req.session.userID }).populate('items.product');

    if(!cart || cart.items.length === 0){
      return res.redirect('/cart');
    }
    
    // Get the user's saved addresses
    const addresses = await addressModel.find({ userId: req.session.userID });
    
    // calculate the subtotal and total discount of the cart items in the cart for the checkout page for the user for the order 
    const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
    
    // Render the checkout page
    res.render('user/checkout', {
      cart,
      addresses,
      totalDiscount,
      originalPrice: subtotal + totalDiscount,
      user: req.session.userID,
    });
  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(500).send('Server Error');
  }
};


// //  //  //   //  //         Placing a Order in checkout     //  //  //  //  //  //  //
export const postOrder = async (req, res) => {
  try {
    // get the address id and payment method from the request body
    const { addressId, paymentMethod } = req.body;
    console.log('Received addressId:', addressId); // Log the address ID

    // get the cart of the user and populate the product field with product details 
    const cart = await cartModel.findOne({ user: req.session.userID }).populate('items.product');

    // if the cart is empty or the cart is not found redirect to the cart page
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    // get the address of the user by the address id
    const address = await addressModel.findById(addressId);
    
    if (!address) {
      console.log('Address not found:', addressId); // Log if address is not found
      return res.status(400).send('Invalid address');
    }

    // map the items of the cart to the order items
    const items = cart.items.map(item => {
      const discountId = item.product.discount; // Get the discount field from the product

      // Ensure discount is an ObjectId or null
      const discount = (discountId && mongoose.Types.ObjectId.isValid(discountId)) 
        ? mongoose.Types.ObjectId(discountId) 
        : null;
        
      return {
        product: item.product._id, // Ensure this is the ObjectId of the product
        quantity: item.quantity,
        price: item.price,
        discount, // Use the validated discount
        discountPrice: item.discountPrice || item.price,
      };
    });
 
    // create a new order with the items, address, subtotal, total, payment method
    const newOrder = new orderModel({
      user: req.session.userID,
      items,
      address: address._id,
      subtotal: cart.subtotal,
      total: cart.total,
      paymentMethod: paymentMethod,
    });

    await newOrder.save();

// update the stock of the product
    for(const item of items){
      const product = await productModel.findById(item.product);
      // if the product is found and the stock is greater than or equal to the quantity of the item
      if(product && product.stock >= item.quantity){
        // decrease the stock of the product
        product.stock -= item.quantity;
        // save the product
        await product.save();
      } else {
        // log an error message if the product is not found or the stock is insufficient
        console.error(`Insufficient stock for product: ${product.name}`);     
        return res.status(400).send(`Insufficient stock for product: ${product.name}`);  
      }
    }
    
    // Empty the user's cart after placing the order
    await cartModel.findOneAndUpdate({ user: req.session.userID }, { items: [], total: 0, subtotal: 0 });
    
 
    res.render('user/orderConfirmation',{order:newOrder})
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Internal server error inthe post order');
  }
};

  
// //  //  //   //  //         Add New Address     //  //  //  //  //  //  //
export const addNewAddress = async (req, res) => {
  try {
    const { name, buildingName, street, city, state, country, pincode, mobile } = req.body;

    const newAddress = new addressModel({
        userId: req.session.userID,
      name,
      buildingName,
      street,
      city,
      state,
      country,
      pincode,
      mobile,
    });

    await newAddress.save();
    res.redirect('/checkout');
  } catch (error) {
    console.error('Error adding new address:', error);
    res.status(500).send('Server Error');
  }
};


const calculateSubtotal = (items) => {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const itemTotal = (item.discountPrice || 0) * (item.quantity || 0);
    subtotal += itemTotal;
    totalDiscount += (item.price - item.discountPrice) * item.quantity; // Calculate total discount
  });

  return { subtotal, totalDiscount }; // Return both subtotal and total discount
}

const calculateTotal = (subtotal, discount) => {
  const discountAmount = (subtotal * discount) / 100;
  return subtotal - discountAmount;
}




