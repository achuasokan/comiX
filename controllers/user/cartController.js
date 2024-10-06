import cartModel from '../../models/Cart.js'
import productModel from '../../models/Product.js'
import { calculateDiscountPrice } from '../../utils/discountprice.js'

// //  //  //   //  //         GET CART PAGE   //  //  //  //  //  //  //

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
      originalPrice: subtotal + totalDiscount
    })
  } catch (error) {
    console.log("Error in getCartPage:", error)
    res.status(500).json({error: "Internal server error"})
  }
}


// //  //  //   //  //         ADD TO CART   //  //  //  //  //  //  //

export const addToCart = async (req,res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId
    const quantity = parseInt(req.body.quantity,10) || 1;
    
    const product = await productModel.findById(productId).populate('discount')
    if (!product) {
      return res.status(404).send({error: "Product not found"})
    }

    if(quantity > product.stock) {
      return res.status(400).send({error: "Not enough stock availabless"})
    }

    const discountprice = await calculateDiscountPrice(product)

    let cart = await cartModel.findOne({user: userId})
    if (!cart) {
      cart = new cartModel({user: userId, items:[] })
    }

    const itemIndex = cart.items.findIndex(item => item.product.equals(productId))

    if(itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity

      if(newQuantity > product.stock) {
        return res.status(400).send({error: "Not enough stock available"})
      }
      // if (newQuantity > 5) {
      //   return res.status(400).json({ error: "Cannot add more than 5 of the same item to the cart" });
      // }
      cart.items[itemIndex].quantity += quantity
    } else {

      if(quantity > product.stock) {
        return res.status(400).json({error: "Not enough stock available"})
      }
      if (quantity > 5) {
        return res.status(400).json({ error: "Cannot add more than 5 of the same item to the cart" });
      }
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        discountPrice: discountprice
      })
    }

    cart.subtotal = calculateSubtotal(cart.items)
    cart.subtotal = calculateSubtotal(cart.items).subtotal; // Update subtotal
    cart.total = calculateTotal(cart.subtotal, cart.discount)

    await cart.save()
    res.redirect('/cart')

  } catch (error) {
    console.log("error in addtoCart",error);
    res.status(500).send("Error Adding product to cart")
  }
}

// //  //  //   //  //         UPDATE CART ITEM QUANTITY AJAX  //  //  //  //  //  //  //

export const updateCartItemQuantity = async (req,res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId
    const newQuantity = parseInt(req.body.quantity,10)
    

    const cart = await cartModel.findOne({ user: userId})
    if (!cart) {
      return res.status(404).send({error: "Cart not found"})
    }


    const itemIndex = cart.items.findIndex(item => item.product.equals(productId))
    if(itemIndex > -1 && newQuantity > 0) {
      cart.items[itemIndex].quantity = newQuantity;
      const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
      cart.subtotal = subtotal;
      cart.total = calculateTotal(subtotal, cart.discount);
      await cart.save()
     
    } 
      res.redirect('/cart')
    

  } catch (error) {
    console.log("Error in updateCartItemQuantity", error)
    res.status(500).send("Error updating cart item quantity")
  }
}

// //  //  //   //  //         REMOVE CART ITEM   //  //  //  //  //  //  //

export const removeCartItem = async (req,res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId

    const cart = await cartModel.findOne({ user: userId })
    if (cart) {
      cart.items = cart.items.filter(item => !item.product.equals(productId))
      const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
      cart.subtotal = subtotal;
      cart.total = calculateTotal(subtotal, cart.discount);

      await cart.save()     
    }

    res.redirect('/cart')

  } catch (error) {
    console.log("Error in removeCartItem", error)
    res.status(500).send("Error removing cart item")
  }
}

// //  //  //   //  //         CALCULATE SUBTOTAL && TOTAL   //  //  //  //  //  //  //



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





