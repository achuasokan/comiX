import orderModel from '../../models/Order.js'
import productModel from '../../models/Product.js'
import mongoose from 'mongoose'

import walletModel from '../../models/wallet.js'


//*  //  //   //  //          GET ORDER  HistoryPAGE   //  //  //  //  //  //  //

export const getOrderHistoryPage = async (req,res) => {
  try {
    const userId = req.session.userID 
    const orders = await orderModel.find( {user:userId} )
    .populate({
      path:'items.product',
      select:'name image category',
      populate:{path:'category',select:'name'}
    })
    .sort({createdAt:-1}).exec()
    res.render('profile/orderHistory',{orders,title:"Order History"})
  } catch (error) {
    console.log("get order history page error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//*  //  //   //  //          GET ORDER  HistoryPage   //  //  //  //  //  //  //

export const getOrderDetailPage = async (req,res) => {
  try {

    const userId = req.session.userID
    const orderId = req.params.orderID
    const itemId = req.params.itemId
    
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).send('Invalid Order ID or Item ID');
    }

    const order = await orderModel.findOne({ _id:orderId, user:userId})
    .populate({
      path: 'items.product',
      select: 'name image category',
      populate: {path: 'category', select: 'name'}
    }).populate('address')

    if(!order){
      return res.status(404).send('Order not found')
    }
   

    const item = order.items.id(itemId)
    if(!item){
      return res.status(404).send('Item not found')
    }
   

    res.render('profile/orderDetail',{ order, item,title:"Order Detail" })    
  } catch (error) {
    console.log("get order detail page error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//*  //  //   //  //         ORDER  Cancel   //  //  //  //  //  //  //


export const orderCancel = async (req,res) => {
  try {

    const userId = req.session.userID
    // get the order ID, item ID, product ID from the request parameters
    const orderId = req.params.orderID
    const itemId = req.params.itemId
    const productId = req.params.productId

    // find the order associated with the user
    const order = await orderModel.findOne({ _id: orderId, user: userId})
    console.log("order in cancel",order);

    if(!order){
      return res.status(404).json({message: 'Order not found'})
    }
   
    //update the order document to set the item status to cancelled
    const updatedOrder= await orderModel.findOneAndUpdate(
      { _id: orderId, user: userId, 'items._id': itemId, 'items.product': productId },
      { $set: { 'items.$.itemStatus': 'Cancelled' } },
      {new: true}
    );

    if(!updatedOrder){
      return res.status(404).json({message: 'Item not found in the order'})
    }
  

    // finding the cancelled item from the updated order
    const cancelledItem = updatedOrder.items.id(itemId)

 
    const product = await productModel.findById(cancelledItem.product._id)

// updating stock
    if(product) {
      product.stock += cancelledItem.quantity;
      await product.save()
    } else {
      console.log('Product not found for item :', cancelledItem.product._id);
    }


    // find the wallet associated with the user
    let wallet = await walletModel.findOne({ user:userId });
    // finding the refund amount by using the itemTotal of the cancelled item
    const refundAmount =cancelledItem.itemTotal

 
    if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') {
      // if the wallet is not found then create a new wallet for the user with the refund amount
      if (!wallet) {
        wallet = new walletModel({
          user: userId,
          balance: refundAmount,
          transaction: [{
            walletAmount: refundAmount,
            transactionType: 'Credited',
            orderId: orderId,
            transactionDate: Date.now()
          }]
        });
      } else {        
        // if the wallet is found then update the balance of the wallet by adding the refund amount
        wallet.balance += refundAmount;
        wallet.transaction.push({
          walletAmount: refundAmount,
          transactionType: 'Credited',
          orderId: orderId,
          transactionDate: Date.now()
        });
      }
    }
    await wallet.save();
    res.status(200).json({message: 'Order cancelled successfully'})
  } catch (error) {
    console.log("order cancel error :",error);
    res.status(500).send('Internal Server Error');
  }
}

//*  //  //   //  //         RETURN ORDER   //  //  //  //  //  //  //
export const requestReturn = async (req, res) => {
  try {
    const userId = req.session.userID;
    const orderId = req.params.orderID;
    const itemId = req.params.itemId;
    const { returnReason } = req.body;

    const order = await orderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update the item with return request details
    item.returnRequested = true;
    item.itemStatus = 'Return Requested';
    item.returnReason = returnReason;
    item.returnDate = new Date();
    await order.save();

    

    res.status(200).json({ message: 'Return request submitted successfully' });
  } catch (error) {
    console.log("Error in requesting return:", error);
    res.status(500).send('Internal Server Error');
  }
};

