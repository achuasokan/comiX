import cartModel from '../../models/Cart.js';
import addressModel from '../../models/address.js';
import orderModel from '../../models/Order.js';
import productModel from '../../models/Product.js';
import couponModel from '../../models/Coupon.js';
import { razorpay } from '../../config/razorpay.js'
import crypto from 'crypto';
import walletModel from '../../models/wallet.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'




//* //  //  //   //  //          get Checkout page     //  //  //  //  //  //  //
export const getCheckoutPage = async (req, res) => {
  try {

    const cart = await cartModel.findOne({ user: req.session.userID }).populate({path:'items.product', populate:{path:'category'}});

    
    if (cart.couponCode) {
      cart.couponCode = null;
      cart.couponDiscount = 0;
      await cart.save();
    }
    
    const outOfStockItems = cart.items.filter(item => item.product.stock < item.quantity)
    if(outOfStockItems.length > 0){      
      return res.status(STATUS_CODES.BAD_REQUEST).json({error: MESSAGES.CHECKOUT.OUT_OF_STOCK})
    }
    
    const addresses = await addressModel.find({ userId: req.session.userID });
    

    const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
    
    const coupons = await couponModel.find({}).populate('applicableCategory').populate('applicableProduct');
    

   

    res.render('user/checkout', {
      cart,
      addresses,
      totalDiscount,
      originalPrice: subtotal + totalDiscount,
      user: req.session.userID,
      coupons,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      title:"Checkout"
    });
  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
};


//* //  //  //   //  //         Placing a Order in checkout     //  //  //  //  //  //  //


export const postOrder = async (req, res) => {
  try {
    const userId = req.session.userID;
    const { addressId, paymentMethod } = req.body;
    console.log('in post order', addressId);

    const cart = await cartModel.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CHECKOUT.INVALID_ADDRESS });
    }


    const totalAmount = cart.total
    if (paymentMethod === 'COD'  && totalAmount > 1000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({success:false, message: MESSAGES.CHECKOUT.COD_LIMIT_EXCEEDED})
    }

    const items = cart.items.map(item => {
      const itemTotal = (item.discountPrice * item.quantity) - item.couponDiscountAmount; // Calculate item total
      const discountAmount = (item.product.price - (item.discountPrice || item.product.price)) * item.quantity;
      const totalDiscount = discountAmount + (item.couponDiscountAmount || 0);
      return {
        product: item.product._id, 
        quantity: item.quantity, 
        price: item.product.price, 
        discountPrice: item.discountPrice, 
        itemTotal: itemTotal, 
        discountAmount: discountAmount, 
        couponCode: item.couponCode || null, 
        couponDiscountAmount: item.couponDiscountAmount || 0, 
        totalDiscount: totalDiscount > 0 ? totalDiscount : 0 
      };
    });

    const newOrder = new orderModel({
      user: userId, 
      items, 
      address: address._id, 
      subtotal: cart.subtotal, 
      total: cart.total, 
      paymentMethod: paymentMethod, 
      couponCode: cart.couponCode || null, 
      couponDiscountAmountAll: cart.couponDiscount || 0, 
      totalDiscount: items.reduce((acc, item) => acc + item.totalDiscount, 0) 
    });


    if (paymentMethod === 'Razorpay') {
      const options = {
        amount: cart.total * 100,
        currency: 'INR',
        receipt: `receipt_${newOrder._id}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      console.log("razorpayOrder", razorpayOrder);
     
      await newOrder.save();
      await updateStock(items);
      await clearCart(userId);
      res.status(STATUS_CODES.OK).json({ success: true, razorpayOrderId: razorpayOrder.id, OrderId: newOrder._id });

    } else if (paymentMethod === 'Wallet') {
      const wallet = await walletModel.findOne({ user: userId });

      if (!wallet || wallet.balance < cart.total) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.CHECKOUT.INSUFFICIENT_WALLET_BALANCE });
      }

      wallet.balance -= cart.total;
      wallet.transaction.push({
        walletAmount: cart.total,
        transactionType: 'Debited',
        order_id: newOrder._id,
        transactionDate: Date.now()
      });

      await wallet.save();
      newOrder.paymentStatus = 'Completed';
      await newOrder.save();
      await updateStock(items);
      await clearCart(userId);


      if(cart.couponCode) {
        const coupon = await couponModel.findOne({couponCode:cart.couponCode})
        if(coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
      res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.CHECKOUT.ORDER_PLACED, order: newOrder });

    } else if (paymentMethod === 'COD') {
      await newOrder.save();
      await updateStock(items);
      await clearCart(userId);


      if(cart.couponCode) {
        const coupon = await couponModel.findOne({couponCode:cart.couponCode})
        if(coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
      res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.CHECKOUT.ORDER_PLACED, order: newOrder });

    } else {
      res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.CHECKOUT.INVALID_PAYMENT_METHOD });
    }

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
};


//* //  //  //   //  //         Verify Payment     //  //  //  //  //  //  //
export const verifyPayment = async (req,res) => {
  try {
    const {razorpayOrderId, paymentId, signature,address,paymentMethod,OrderId} = req.body;
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${paymentId}`).digest('hex');
  const userId = req.session.userID
 

    if(signature === generatedSignature) {
      const newOrder = await orderModel.findById(OrderId);
      if(newOrder) {
        newOrder.paymentStatus = 'Completed';
        await newOrder.save();
      }
      res.status(STATUS_CODES.OK).json({success:true, message: MESSAGES.CHECKOUT.PAYMENT_VERIFIED})
    } else {
      res.status(STATUS_CODES.BAD_REQUEST).json({success:false, message: MESSAGES.CHECKOUT.PAYMENT_VERIFICATION_FAILED})
    }
  }  catch (error) {
    console.log("error in verify payment", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}
  


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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
};



// //* //  //  //   //  //         Apply Coupon     //  //  //  //  //  //  //


export const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.userID;
  try {

    const coupon = await couponModel.findOne({ couponCode });
    console.log("coupon", coupon);
    if (!coupon) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CHECKOUT.INVALID_COUPON });
    }


    const cart = await cartModel.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CART.CART_NOT_FOUND });
    }


    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CHECKOUT.COUPON_EXPIRED });
    }


    const applicableItems = cart.items.filter(item => 
      coupon.applicableType === 'all' ||
      (coupon.applicableType === 'category' && item.product.category.equals(coupon.applicableCategory)) ||
      (coupon.applicableType === 'product' && item.product._id.equals(coupon.applicableProduct))
    );

    if (applicableItems.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CHECKOUT.COUPON_NOT_APPLICABLE });
    }


    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = applicableItems.reduce((total, item) => {
        const calculatedDiscount = (item.discountPrice * coupon.discountValue / 100);
        const applicableDiscount = Math.min(calculatedDiscount, item.discountPrice);
        item.couponCode = coupon.couponCode; 
        item.couponDiscountAmount = applicableDiscount * item.quantity; 
        return total + (applicableDiscount * item.quantity);
      }, 0);

      if (coupon.discountValue === 100 && discountAmount >= cart.subtotal) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CHECKOUT.COUPON_CANNOT_BE_APPLIED });
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = applicableItems.reduce((total, item) => {
        const applicableDiscount = Math.min(coupon.discountValue, item.price);
        
        item.couponCode = coupon.couponCode; 
        item.couponDiscountAmount = applicableDiscount * item.quantity; 
        return total + (applicableDiscount * item.quantity);
      }, 0);
    }

    
    if (coupon.discountValue >= cart.subtotal) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CHECKOUT.COUPON_CANNOT_BE_APPLIED });
    }

 
    if (cart.subtotal < coupon.minSpend) {
      return res.json({ success: false, message: `Minimum spend of ₹${coupon.minSpend} required to use this coupon` });
    }


    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, message: MESSAGES.CHECKOUT.COUPON_LIMIT_REACHED });
    }

    cart.couponCode = coupon.couponCode;
    cart.couponDiscount = discountAmount;
    cart.total = cart.subtotal - discountAmount;
    await cart.save();

    


    res.json({
      success: true, 
      discountAmount: discountAmount, 
      newTotal: cart.total,
      message: MESSAGES.CHECKOUT.COUPON_APPLIED
    });
  } catch (error) {
    console.log("error in apply coupon", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
};


//* //  //  //   //  //         Remove Coupon     //  //  //  //  //  //  //

export const removeCoupon = async (req,res) => {
  const userId = req.session.userID;

  try{
    const cart = await cartModel.findOne({user:userId})
    if(!cart || !cart.couponCode) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({message: MESSAGES.CHECKOUT.NO_COUPON_APPLIED})
    }

    const coupon = await couponModel.findOne({couponCode:cart.couponCode})

    if(coupon) {
      coupon.usedCount -= 1;
      await coupon.save();
    }


    cart.items.forEach(item => {
      item.couponCode = null; 
      item.couponDiscountAmount = 0; 
    });

    cart.couponCode = null;
    cart.couponDiscount = 0;
    cart.total = cart.subtotal;
    await cart.save();

    res.json({
      message: MESSAGES.CHECKOUT.COUPON_REMOVED, 
      success:true,
      newTotal:cart.total,
      couponDiscount:cart.couponDiscount
    })
  }catch(error){
    console.log("error in remove coupon", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}

//* //  //  //   //  //         Order Confirmation Page     //  //  //  //  //  //  //

export const orderConfirmation = async (req,res) => {
  try {
    const userId = req.session.userID;
    const newOrder = await orderModel.findOne({user:userId}).sort({createdAt:-1}).populate('items.product');

    if(!newOrder) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({message: MESSAGES.CHECKOUT.NO_ORDERS_FOUND})
    }
    res.render('user/orderConfirmation', {order:newOrder,title:"Order Confirmation"})
  }catch (error) {
    console.error('Error loading order confirmation:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}


//* //  //  //   //  //         Updating selected Address     //  //  //  //  //  //  //

export const updateSelectedAddress = async (req,res) => {
  try {
    const {addressId} = req.body;
    const userId = req.session.userID;

    const address = await addressModel.findOne({_id:addressId, userId:userId});
    if(!address) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({message: MESSAGES.CHECKOUT.INVALID_ADDRESS})
    }
  res.status(STATUS_CODES.OK).json({success:true, message: MESSAGES.CHECKOUT.ADDRESS_SELECTED})
  } catch (error) {
    console.log("error in update selected address", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}


//* //  //  //   //  //         Payment Method selection     //  //  //  //  //  //  //

export const updatePaymentMethod = async (req,res) => {
  try {
    const {paymentMethod} = req.body;
    const userId = req.session.userID;

    if(!['COD','Razorpay','Wallet'].includes(paymentMethod)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({message: MESSAGES.CHECKOUT.INVALID_PAYMENT_METHOD})
    }
   res.status(STATUS_CODES.OK).json({success:true, message: MESSAGES.CHECKOUT.PAYMENT_METHOD_SELECTED})
  } catch (error) {
    console.log('error in update payment method', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}




//* //  //  //   //  //         Repay Order     //  //  //  //  //  //  //

export const repayOrder = async (req,res) => {
  try {
    const orderId = req.params.orderId;
    const order = await orderModel.findById(orderId)
    if(!order) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({success:false, message: MESSAGES.ORDER.NOT_FOUND})
    }

    const options = {
      amount: order.total * 100,
      currency: 'INR',
      receipt: `repay_${order._id}`,
    }

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("razorpayOrder", razorpayOrder);

   res.status(STATUS_CODES.OK).json({success:true, razorpayOrderId:razorpayOrder.id, OrderId:order._id})

  }catch (error) {
    console.log("error in repay order", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}



//* //  //  //   //  //         Failed Order Page     //  //  //  //  //  //  //

export const failedOrderPage = async (req,res) => {
  try {
    res.render('user/failedOrder', {title:"Order Failed"})
  } catch (error) {
    console.log("error in failed order page", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}


//* //  //  //   //  //         Calculate Subtotal     //  //  //  //  //  //  //
const calculateSubtotal = (items) => {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const itemTotal = (item.discountPrice || 0) * (item.quantity || 0);
    subtotal += itemTotal;
    totalDiscount += (item.price - item.discountPrice) * item.quantity; 
  });

  return { subtotal, totalDiscount }; 
}

//* //  //  //   //  //         Calculate Total     //  //  //  //  //  //  //
const calculateTotal = (subtotal, discount) => {
  const discountAmount = (subtotal * discount) / 100;
  return subtotal - discountAmount;
}


//* //  //  //   //  //         Helper Function Update Stock     //  //  //  //  //  //
const updateStock = async (items) => {
  for (const item of items) {
    const product = await productModel.findById(item.product);
    if(product && product.stock >= item.quantity) {
      product.stock -= item.quantity;
      product.sold += item.quantity;
      await product.save();
    } else {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }
  }
}

//* //  //  //   //  //         Helper Function Clear Cart     //  //  //  //  //  //
const clearCart = async (userId) => {
  await cartModel.findOneAndUpdate({user:userId}, {items:[], total:0, subtotal:0, couponCode:null, couponDiscount:0});
}