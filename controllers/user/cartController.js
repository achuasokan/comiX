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

    // if the cart is not found return the cart page with the cart as null means the cart is empty
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

    // if the quantity is greater than the stock of the product return the status 400 and send the message not enough stock available
    if(quantity > product.stock) {
      return res.status(400).send({error: "Not enough stock availabless"})
    }
    // calculate the discount price of the product
    const discountprice = await calculateDiscountPrice(product)

    // find the cart of the user
    let cart = await cartModel.findOne({user: userId})
    // if the cart is not found create a new cart
    if (!cart) {
      cart = new cartModel({user: userId, items:[] })
    }

    // find the index of the product in the cart
    const itemIndex = cart.items.findIndex(item => item.product.equals(productId))
    // if the product is already in the cart
    if(itemIndex > -1) {
      // increase the quantity of the product
      const newQuantity = cart.items[itemIndex].quantity + quantity

      // if the new quantity is greater than the stock of the product return the status 400 and send the message not enough stock available
      if(newQuantity > product.stock) {
        return res.status(400).send({error: "Not enough stock available"})
      }
      // if the new quantity is greater than 5 return the status 400 and send the message cannot add more than 5 of the same item to the cart
      if (newQuantity > 5) {
        return res.status(400).json({ error: "Cannot add more than 5 of the same item to the cart" });
      }
      // increase the quantity of the product
      cart.items[itemIndex].quantity += quantity
    } else {
      // if the quantity is greater than the stock of the product return the status 400 and send the message not enough stock available
      if(quantity > product.stock) {
        return res.status(400).json({error: "Not enough stock available"})
      }
      // if the quantity is greater than 5 return the status 400 and send the message cannot add more than 5 of the same item to the cart
      if (quantity > 5) {
        return res.status(400).json({ error: "Cannot add more than 5 of the same item to the cart" });
      }
      // add the product to the cart
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        discountPrice: discountprice
      })
    }
// calculate the subtotal and total discount of the cart items in the cart for the cart page for the user
    // cart.subtotal = calculateSubtotal(cart.items)
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
export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.session.userID
    const productId = req.params.productId
    const newQuantity = parseInt(req.body.quantity, 10)

    const cart = await cartModel.findOne({ user: userId }).populate('items.product')
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }

    const itemIndex = cart.items.findIndex(item => item.product._id.equals(productId))
    if (itemIndex > -1 && newQuantity > 0 && newQuantity <= 5) {
      const product = await productModel.findById(productId).populate('discount')
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: "Not enough stock available" })
      }

      cart.items[itemIndex].quantity = newQuantity;
     
      // const discountPrice = await calculateDiscountPrice(product)
      // cart.items[itemIndex].discountPrice = discountPrice

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
      res.status(400).json({ error: "Invalid quantity" })
    }
  } catch (error) {
    console.log("Error in updateCartItemQuantity", error)
    res.status(500).json({ error: "Error updating cart item quantity" })
  }
}


// // //  //  //   //  //         REMOVE CART ITEM   //  //  //  //  //  //  //

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
      res.status(404).json({ error: "Cart not found" })
    }
  } catch (error) {
    console.log("Error in removeCartItem", error)
    res.status(500).json({ error: "Error removing cart item" })
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







