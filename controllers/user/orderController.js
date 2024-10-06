import orderModel from '../../models/Order.js'
import productModel from '../../models/Product.js'

// //  //  //   //  //          GET ORDER  HistoryPAGE   //  //  //  //  //  //  //

// export const getOrderHistorypage = async (req,res) => {
//   try{
//     const userId = req.session.userID

//     const orders = await orderModel.find({user: userId})
//     .populate('items.product')
//     .sort({createdAt: -1})
//     .exec()

//     res.render('user/orderHistory',{orders})
//   }catch (error) {
//     console.log("Error in getOrderHistorypage :",error);
//     res.status(500).send('Internal Server Error');
//   }
// }