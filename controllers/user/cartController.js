import cartModel from '../../models/Cart.js'
import productModel from '../../models/Product.js'
import { calculateDiscountPrice } from '../../utils/discountprice.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //         GET CART PAGE   //  //  //  //  //  //  //

export const getCartPage = async (req,res) => {
  try{
    const userId = req.session.userID

    const cart = await cartModel.findOne({user: userId}).populate({
      path: 'items.product',
      populate: {path: 'category', select: 'name'}
    })

   
    if (!cart) {
      return res.render('user/cart',{cart: null})
    }
    const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
    cart.subtotal = subtotal;
    cart.total = calculateTotal(subtotal, cart.discount);
    res.render('user/cart', {cart,
      totalDiscount,
      originalPrice: subtotal + totalDiscount,
      title:"Cart"
    })
  } catch (error) {
    console.log("Error in getCartPage:", error)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR})
  }
}


//* //  //  //   //  //         ADD TO CART   //  //  //  //  //  //  //

export const addToCart = async (req,res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId
    const quantity = parseInt(req.body.quantity,10) || 1;
    
    const product = await productModel.findById(productId).populate('discount')
    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).json({message: MESSAGES.COMMON.PRODUCT_NOT_FOUND})
    }

    
    if(quantity > product.stock) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({message: MESSAGES.CART.OUT_OF_STOCK})
    }
  
    const discountprice = await calculateDiscountPrice(product)

   
    let cart = await cartModel.findOne({user: userId})
   
    if (!cart) {
      cart = new cartModel({user: userId, items:[] })
    }

   
    const itemIndex = cart.items.findIndex(item => item.product.equals(productId))
  
    if(itemIndex > -1) {
    
      const newQuantity = cart.items[itemIndex].quantity + quantity


      if (newQuantity > 5) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CART.MAX_QUANTITY_REACHED });
      }
      
      cart.items[itemIndex].quantity += quantity
    } else {
  
      
      if(quantity > product.stock) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({message: MESSAGES.CART.OUT_OF_STOCK})
      }
    
      if (quantity > 5) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.CART.MAX_QUANTITY_REACHED });
      }
     
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        discountPrice: discountprice
      })
    }

   
    cart.subtotal = calculateSubtotal(cart.items).subtotal; 
    cart.total = calculateTotal(cart.subtotal, cart.discount)

    await cart.save()
   res.status(STATUS_CODES.OK).json({message: MESSAGES.CART.ADD_SUCCESS})

  } catch (error) {
    console.log("error in addtoCart",error);
   return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({message: MESSAGES.CART.GENERAL_ERROR})
  }
}

//* //  //  //   //  //         UPDATE CART ITEM QUANTITY AJAX  //  //  //  //  //  //  //
export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId
    const newQuantity = parseInt(req.body.quantity, 10)

    const cart = await cartModel.findOne({ user: userId }).populate('items.product')
    if (!cart) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: MESSAGES.CART.CART_NOT_FOUND })
    }

    const itemIndex = cart.items.findIndex(item => item.product._id.equals(productId))
    if (itemIndex > -1 && newQuantity > 0 && newQuantity <= 5) {
      const product = await productModel.findById(productId).populate('discount')
      if (newQuantity > product.stock) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ error: MESSAGES.CART.OUT_OF_STOCK })
      }

      cart.items[itemIndex].quantity = newQuantity;
     


      const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
      cart.subtotal = subtotal;
      cart.total = calculateTotal(subtotal, cart.discount);
      await cart.save()

      res.json({
        itemCount: cart.items.length,
        originalPrice: subtotal + totalDiscount,
        totalDiscount: totalDiscount,
        total: cart.total,
        items: cart.items.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          price: item.price,
          discountPrice: item.discountPrice,
          total: item.quantity * (item.discountPrice || item.price)
        }))
      })
    } else {
      res.status(STATUS_CODES.BAD_REQUEST).json({ error: MESSAGES.CART.INVALID_QUANTITY })
    }
  } catch (error) {
    console.log("Error in updateCartItemQuantity", error)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.CART.UPDATE_ERROR })
  }
}


//* // //  //  //   //  //         REMOVE CART ITEM   //  //  //  //  //  //  //

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId

    const cart = await cartModel.findOne({ user: userId })
    if (cart) {
      cart.items = cart.items.filter(item => !item.product.equals(productId))
      const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
      cart.subtotal = subtotal;
      cart.total = calculateTotal(subtotal, cart.discount);


       if (cart.items.length === 0) {
        cart.couponCode = null;
        cart.couponDiscount = 0;
      }
      await cart.save()

      res.json({
        itemCount: cart.items.length,
        originalPrice: subtotal + totalDiscount,
        totalDiscount: totalDiscount,
        total: cart.total,
        items: cart.items.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          total: item.quantity * (item.discountPrice || item.price)
        }))
      })
    } else {
      res.status(STATUS_CODES.NOT_FOUND).json({ error: MESSAGES.CART.CART_NOT_FOUND })
    }
  } catch (error) {
    console.log("Error in removeCartItem", error)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.CART.REMOVE_ERROR })
  }
}

//* //  //  //   //  //         CALCULATE SUBTOTAL && TOTAL   //  //  //  //  //  //  //



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

const calculateTotal = (subtotal, discount) => {
  const discountAmount = (subtotal * discount) / 100;
  return subtotal - discountAmount;
}







