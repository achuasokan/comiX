import orderModel from '../../models/Order.js'
import productModel from '../../models/Product.js'
import addressModel from '../../models/address.js'
import userModel from '../../models/User.js'
import walletModel from '../../models/wallet.js'
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

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
      startIndex,
      title:"Orders"
    })

  }catch (error) {
    console.log("get order list page error :",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
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
      return res.status(STATUS_CODES.NOT_FOUND).json({success:false, message:MESSAGES.ORDER.NOT_FOUND})
    }

    const item = order.items.id(itemId)

   
    const currentStatusIndex = status.indexOf(item.itemStatus)
    

    if(currentStatusIndex === -1 || currentStatusIndex >= status.length - 1) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({success:false, message:MESSAGES.ORDER.STATUS_CHANGE_ERROR})
    }

    const newStatus = status[currentStatusIndex + 1]

    const updateFields= { "items.$.itemStatus": newStatus };
    if (newStatus === 'Delivered') {
      updateFields.paymentStatus = 'Completed'
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: updateFields},{new: true}
    );

    res.status(STATUS_CODES.OK).json({success:true, newStatus})

  } catch (error) {
    console.log("Error changing item status :",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success:false, message:MESSAGES.COMMON.INTERNAL_SERVER_ERROR})
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
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.ORDER.NOT_FOUND)
    }

   console.log(order.items[0].product.image); 
    res.render('admin/orderDetailsModal', {order , layout :false})
    
  } catch (error) {
    console.log("Error getting order details :",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
}


//* //  //  //   //  //       return request details   //  //  //  //  //  //  //
export const getReturnRequestDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;

    const order = await orderModel.findOne({ _id: orderId, 'items._id': itemId })
      .populate('user', 'name')
      .populate('items.product');

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER.NOT_FOUND });
    }

    const item = order.items.id(itemId);
    res.json({
      user: order.user,
      product: item.product,
      returnReason: item.returnReason,
      returnStatus: item.returnStatus,
    });
  } catch (error) {
    console.log("Error fetching return request details:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR);
  }
};


//* //  //  //   //  //      CHANGE RETURN STATUS   //  //  //  //  //  //  //

export const changeReturnStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;
    const { returnStatus } = req.body;

    const order = await orderModel.findOne({
      _id: orderId,
      'items._id': itemId
    }).populate('items.product')

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ORDER.NOT_FOUND });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ORDER.ITEM_NOT_FOUND });
    }

    item.returnStatus = returnStatus;

    if(returnStatus === 'Approved') {
      item.itemStatus = 'Returned';
      item.returnRequested = false;

      const product = item.product
      if (product) {
        product.stock += item.quantity
        product.sold -= item.quantity;
        await product.save()
      }

      const refundAmount = item.itemTotal
      let wallet = await walletModel.findOne({ user:order.user })
      if(!wallet) {
        wallet = new walletModel({
          user:order.user,
          balance:refundAmount,
          transaction:[{
            walletAmount:refundAmount,
            transactionType:'Credited',
            order_id:orderId,
            transactionDate:Date.now()
          }]
        })
      } else {
        wallet.balance += refundAmount
        wallet.transaction.push({
          walletAmount:refundAmount,
          transactionType:'Credited',
          order_id:orderId,
          transactionDate:Date.now()
        })
      }
      await wallet.save()
    } else if(returnStatus === 'Rejected') {
      item.itemStatus = 'Rejected';
    } else if(returnStatus === 'Refunded') {
      item.itemStatus = 'Refunded';
    } else {
      item.itemStatus = 'Return Requested';
    }

    await order.save();

    res.status(STATUS_CODES.OK).json({ success: true, newStatus: returnStatus });
  } catch (error) {
    console.log("Error changing return status:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
  }
};


