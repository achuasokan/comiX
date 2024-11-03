import cartModel from '../../models/Cart.js';
import addressModel from '../../models/address.js';
import orderModel from '../../models/Order.js';
import productModel from '../../models/Product.js';
import couponModel from '../../models/Coupon.js';



//* //  //  //   //  //          get Checkout page     //  //  //  //  //  //  //
export const getCheckoutPage = async (req, res) => {
  try {
    // Get the user's cart
    const cart = await cartModel.findOne({ user: req.session.userID }).populate('items.product');

    // if(!cart || cart.items.length === 0){
    //   return res.status(400).json({error:'Your cart is empty. Please add items to your cart before proceeding to checkout.'})
    // }
    
    const outOfStockItems = cart.items.filter(item => item.product.stock < item.quantity)
    if(outOfStockItems.length > 0){      
      return res.status(400).json({error:'Some of the items in your cart are out of stock.Please update your cart before proceeding to checkout.'})
    }
    // Get the user's saved addresses
    const addresses = await addressModel.find({ userId: req.session.userID });
    
    // calculate the subtotal and total discount of the cart items in the cart for the checkout page for the user for the order 
    const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
    
    // Recalculate total based on the current cart state
    const total = cart.subtotal - (cart.couponDiscount || 0); 

   
    // Render the checkout page
    res.render('user/checkout', {
      cart,
      addresses,
      totalDiscount,
      originalPrice: subtotal + totalDiscount,
      user: req.session.userID,
      total
    });
  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(500).send('Server Error');
  }
};


//* //  //  //   //  //         Placing a Order in checkout     //  //  //  //  //  //  //

export const postOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    

    const cart = await cartModel.findOne({ user: req.session.userID }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      
      return res.status(400).send('Invalid address');
    }

    const items = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      discountPrice: item.discountPrice || item.product.price,
      itemTotal: (item.discountPrice || item.product.price) * item.quantity,
      discountAmount: (item.product.price - (item.discountPrice || item.product.price)) * item.quantity
    }));

    const newOrder = new orderModel({
      user: req.session.userID,
      items,
      address: address._id,
      subtotal: cart.subtotal,
      total: cart.total,
      paymentMethod: paymentMethod 
    });

    console.log("new order", newOrder);
    
    await newOrder.save();

    // Update stock and handle insufficient stock
    for (const item of items) {
      const product = await productModel.findById(item.product);
      if (product && product.stock >= item.quantity) {
        product.stock -= item.quantity;
        await product.save();
      } else {
        console.error(`Insufficient stock for product: ${product.name}`);
        return res.status(400).send(`Insufficient stock for product: ${product.name}`);
      }
    }

    await cartModel.findOneAndUpdate({ user: req.session.userID }, { items: [], total: 0, subtotal: 0 });

    res.render('user/orderConfirmation', { order: newOrder });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Internal server error in post order');
  }
};

  
//* //  //  //   //  //         Add New Address     //  //  //  //  //  //  //
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

// //* //  //  //   //  //         Apply Coupon     //  //  //  //  //  //  //


export const applyCoupon = async (req,res) => {
  const { couponCode } = req.body;
  console.log("couponCode", couponCode);
  const userId = req.session.userID;
  console.log("userId", userId);
  try {
    //~ finding the coupon in the database
    const coupon = await couponModel.findOne({couponCode})
    console.log("coupon", coupon);
    if(!coupon) {
      return res.status(400).json({message:"Invalid coupon code"})
    }

    //~ finding the cart of the user
    const cart = await cartModel.findOne({user:userId}).populate('items.product')
    console.log("cart", cart);
    if(!cart)  {
      return res.status(400).json({message:"Cart not found"})
    }

    //~ checking coupon validity dates
    // const currentDate = new Date("2024-11-03T10:00:00Z"); 
    const currentDate = new Date(); 
    console.log("currentDate", currentDate);
    console.log("coupon.startDate", coupon.startDate);
    console.log("coupon.expiryDate", coupon.expiryDate);
    if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
      return res.status(400).json({message:"Coupon is not valid for the current date"})
    }

    //~ checking applicability of the coupon based (product/category/all)
    const isApplicable = coupon.applicableType === 'all' || 
    (coupon.applicableType === 'category' && cart.items.some(item => item.product.category.equals(coupon.applicableCategory))) ||
    (coupon.applicableType === 'product' && cart.items.some(item => item.product._id.equals(coupon.applicableProduct)))

    if(!isApplicable) {
      return res.status(400).json({message:"Coupon is not applicable for the products in your cart"})
    }

    //~ calculating the discount amount
    let discountAmount = 0;
    if(coupon.discountType === 'percentage') {
      discountAmount = (cart.subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    //~ checking the minimum spend of the coupon
    if(cart.subtotal < coupon.minSpend) {
      return res.json({success: false, message: `Minimum spend of ₹${coupon.minSpend} required to use this coupon`})
    }

    //~ checking the usage limit of the coupon
    if(coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({success: false, message: `Coupon limit reached`})
    }

    //~ updating the cart with the coupon code, discount and total
    cart.couponCode = coupon.couponCode;
    cart.couponDiscount = discountAmount;
    cart.total = cart.subtotal  - discountAmount;
    await cart.save();

    //~ updating the coupon used count
    coupon.usedCount += 1;
    await coupon.save();

    //~ sending the response to the client
    res.json({
      success: true, 
      discountAmount: discountAmount, 
      newTotal: cart.total,
      message: `Coupon applied successfully`
    })
  }catch (error) {
    console.log("error in apply coupon", error);
    res.status(500).send("Internal server error in apply coupon");
    
  }
}


//* //  //  //   //  //         Remove Coupon     //  //  //  //  //  //  //

export const removeCoupon = async (req,res) => {
  const userId = req.session.userID;

  try{
    const cart = await cartModel.findOne({user:userId})
    if(!cart || !cart.couponCode) {
      return res.status(400).json({message:"No coupon applied"})
    }

    cart.couponCode = null;
    cart.couponDiscount = 0;
    console.log("Subtotal before removing coupon:", cart.subtotal);
    cart.total = cart.subtotal;
    console.log("Total after removing coupon:", cart.total);
    await cart.save();

    res.json({
      message:"Coupon removed successfully", 
      success:true,
      newTotal:cart.total,
      couponDiscount:cart.couponDiscount
    })
  }catch(error){
    console.log("error in remove coupon", error);
    res.status(500).send("Internal server error in remove coupon");
  }
}

