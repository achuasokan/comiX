import Cart from '../../models/Cart.js';
import Address from '../../models/address.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

export const getCheckoutPage = async (req, res) => {
  try {
    // Get the user's cart
    const cart = await Cart.findOne({ user: req.session.userID }).populate('items.product');
    
    // Get the user's saved addresses
    const addresses = await Address.find({ userId: req.session.userID });
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

export const postOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    console.log('Received addressId:', addressId); // Log the address ID

    const cart = await Cart.findOne({ user: req.session.userID }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const address = await Address.findById(addressId);
    if (!address) {
      console.log('Address not found:', addressId); // Log if address is not found
      return res.status(400).send('Invalid address');
    }

    const items = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      discountPrice: item.discountPrice || item.price,
    }));

    const newOrder = new Order({
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
      const product = await Product.findById(item.product);
      if(product && product.stock >= item.quantity){
        product.stock -= item.quantity;
        await product.save();
      } else {
        console.error(`Insufficient stock for product: ${product.name}`);
        
      }
    }
    
    // Empty the user's cart after placing the order
    await Cart.findOneAndUpdate({ user: req.session.userID }, { items: [], total: 0, subtotal: 0 });
    
    res.redirect('/order-confirmation/' + newOrder._id);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Server Error');
  }
};

// Controller function to add a new address
export const addNewAddress = async (req, res) => {
  try {
    const { name, buildingName, street, city, state, country, pincode, mobile } = req.body;

    const newAddress = new Address({
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


// //  //  //   //  //         ORDER CONFIRMATION   //  //  //  //  //  //

export const getOrderConfirmationPage = async (req, res) => {
  try {
    const orderID =req.params.orderId
    const order = await Order.findById(orderID);
   
    res.render('user/orderConfirmation', { order});
  } catch (error) {
    console.error('Error loading order confirmation page:', error);
    res.status(500).send('Server Error');
  }
};

