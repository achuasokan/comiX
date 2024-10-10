import orderModel from '../../models/Order.js'
import productModel from '../../models/Product.js'

//  //  //   //  //          GET ORDER  HistoryPAGE   //  //  //  //  //  //  //

export const getorderhistoryPage = async (req,res) => {
  try {
    const userId = req.session.userID 
    const orders = await orderModel.find( {user:userId} )
    .populate({
      path:'items.product',
      select:'name image category',
      populate:{path:'category',select:'name'}
    })
    .sort({createdAt:-1}).exec()

    res.render('profile/orderHistory',{orders})

  } catch (error) {
    console.log("get order history page error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//  //  //   //  //          GET ORDER  DetailPAGE   //  //  //  //  //  //  //

export const getOrderDetailpage = async (req,res) => {
  try{
    const userId = req.session.userID
    const orderId = req.params.orderID
    const order = await orderModel.findOne( {_id:orderId,user:userId} )
    .populate({
      path:'items.product',
      select:'name image category',
      populate:{path:'category',select:'name'}
    }).populate('address')
    res.render('profile/orderDetail',{order})
  } catch (error) {
    console.log("get order detail page error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//  //  //   //  //          GET ORDER  Cancel   //  //  //  //  //  //  //

export const orderCancel = async (req,res) => {
  try {
    const userId = req.session.userID
    const orderId = req.params.orderID
    const order = await orderModel.findOne( {_id:orderId,user:userId} )

    if(!order){
      return res.status(404).send('Order not found')
    }

    if(order.orderStatus !=='Processing' && order.orderStatus !=='Confirmed'){
      return res.status(400).send('Order cannot be cancelled')
    }

    order.orderStatus = 'Cancelled'
    await order.save()

    for(const item of order.items) {
      const product = await productModel.findById(item.product._id)
      if(product){
        product.stock += item.quantity
        await product.save()
      } else {
        console.log('Product not found for item :', item.product._id);
      }
    }

    console.log('Order cancelled successfully');
    res.redirect('/profile/order')
  }catch (error) {
    console.log("order cancel error :",error);
    res.status(500).send('Internal Server Error');
  }
}
