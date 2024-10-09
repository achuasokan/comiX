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
    const { addressId, paymentMethod } = req.body;
    console.log('Received addressId:', addressId); // Log the address ID

    const cart = await cartModel.findOne({ user: req.session.userID }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      console.log('Address not found:', addressId); // Log if address is not found
      return res.status(400).send('Invalid address');
    }

    const items = cart.items.map(item => {
      const discountId = item.product.discount; // Get the discount field

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
      if(product && product.stock >= item.quantity){
        product.stock -= item.quantity;
        await product.save();
      } else {
        console.error(`Insufficient stock for product: ${product.name}`);
        
      }
    }
    
    // Empty the user's cart after placing the order
    await cartModel.findOneAndUpdate({ user: req.session.userID }, { items: [], total: 0, subtotal: 0 });
    
    res.redirect('/order-confirmation/' + newOrder._id);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Internal server error inthe post order');
  }
};

// Controller function to add a new address
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


// //  //  //   //  //         ORDER CONFIRMATION Page   //  //  //  //  //  //

export const getOrderConfirmationPage = async (req, res) => {
  try {
    const orderID =req.params.orderId
    const order = await orderModel.findById(orderID);
   
    res.render('user/orderConfirmation', { order});
  } catch (error) {
    console.error('Error loading order confirmation page:', error);
    res.status(500).send('Server Error');
  }
};

