import orderModel from '../../models/Order.js'

export const getSalesReportPage = async (req,res) => {
  try {

    const query = req.query;
    const filterType = query.filterType || 'daily';
    const startDate = query.startDate
    const endDate = query.endDate;
    const page = parseInt(query.page) || 1;
    const limit = 5;
    const skip = (page -1) * limit


    let matchCriteria = {
      paymentStatus: "Completed",
      orderedAt: {}
    }

    //filtering the orders based on the filter type

    switch (filterType) {
     case 'custom':
      if (startDate && endDate) {
        matchCriteria.orderedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      break;
    case 'weekly':
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      matchCriteria.orderedAt = { $gte: lastWeek }
      break;
    case 'monthly':
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      matchCriteria.orderedAt = { $gte: lastMonth }
      break;
    
    default:
      const today = new Date();
      matchCriteria.orderedAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) }
      break;
    }


    //fetch  the filtered orders for display with pagination
   const orders = await orderModel.find(matchCriteria)
        .populate('user', 'name')
        .populate('items.product', 'name')
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

   const totalOrders = await orderModel.countDocuments(matchCriteria)
   const totalPages = Math.ceil(totalOrders / limit)
   const startIndex = skip + 1;

   const salesReport = await orderModel.aggregate([
       { $match: matchCriteria },
       { $unwind: '$items' },
       { $match: { 'items.itemStatus': 'Delivered' } },
       {
         $group: {
          _id: null,
          totalRevenue: { $sum: '$items.itemTotal' },
          totalDiscount: { $sum: '$items.totalDiscount' },
          salesCount: { $sum: 1 },
         }
       }
   ])

   const reportData = salesReport[0] || { totalRevenue: 0, totalDiscount: 0, salesCount: 0}

   res.render('admin/salesReport',{
    orders,
    totalPages,
    reportData,
    currentPage: page,
    filterType,
    startDate,
    endDate,
    startIndex
   })

  }catch (error) {
    console.log("Error in getSalesReportPage",error);
    res.status(500).send("Internal Server Error");   
  }
}



