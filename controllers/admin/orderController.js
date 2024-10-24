import orderModel from '../../models/Order.js'
import productModel from '../../models/Product.js'
import addressModel from '../../models/address.js'
import userModel from '../../models/User.js'

//*  //  //   //  //          GET ORDER LIST PAGE   //  //  //  //  //  //  //

export const getOrderListPage = async (req,res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit

    

    const orderlist = await orderModel.find({})
    .populate({
      path: 'items.product',
      select: 'name image'
    })
    .populate('user', 'name')
    .populate('address')
    .skip(skip)
    .limit(limit)
    .sort({createdAt: -1})

    const totalorders = await orderModel.countDocuments({})
    const totalPages = Math.ceil(totalorders / limit)
    const startIndex = skip + 1;

    

    res.render('admin/orderList', {
      orderlist,
      currentPage: page,
      totalPages,
      startIndex
    })

  }catch (error) {
    console.log("get order list page error :",error);
    res.status(500).send('Internal Server Error');
  }
 }



//* //  //  //   //  //          CHANGE ITEM STATUS   //  //  //  //  //  //  //

export const changeItemStatus = async (req,res) => {
  try{
    const orderId = req.params.orderId
    const itemId = req.params.itemId

    const status = ['Pending', 'Confirmed', 'Shipped', 'Delivered']

    const order = await orderModel.findOne({
      _id: orderId,
     'items._id': itemId
    });

    if(!order) {
      return res.status(404).json({success:false, message:"Order or item not found"})
    }

    const item = order.items.id(itemId)

   
    const currentStatusIndex = status.indexOf(item.itemStatus)
    

    if(currentStatusIndex === -1 || currentStatusIndex >= status.length - 1) {
      return res.status(400).json({success:false, message:"Cannot change item status no more"})
    }

    const newStatus = status[currentStatusIndex + 1]

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: {"items.$.itemStatus": newStatus}},{new: true}
    );

    const allItemStatus = updatedOrder.items.map((itm) => itm.itemStatus);
    if(allItemStatus.every((status) => status === newStatus)) {
      updatedOrder.orderStatus = newStatus;
      await updatedOrder.save()
    }

    res.status(200).json({success:true, newStatus})

  } catch (error) {
    console.log("Error changing item status :",error);
    res.status(500).json({success:false, message:"Internal Server Error"})
  }
}

//* //  //  //   //  //        get Order Details   //  //  //  //  //  //  //

export const getOrderDetails = async (req,res) => {
  try{
    const orderId = req.params.orderId

    const order = await orderModel.findById(orderId)
    .populate('user', 'name email')
    .populate('address')
    .populate({
      path: 'items.product',
      select: 'name image price'
    })

    if(!order) {
      return res.status(404).send("Order not found")
    }

   console.log(order.items[0].product.image); 
    res.render('admin/orderDetailsModal', {order , layout :false})
    
  } catch (error) {
    console.log("Error getting order details :",error);
    res.status(500).send('Internal Server Error');
  }
}
