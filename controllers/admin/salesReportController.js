import orderModel from '../../models/Order.js'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

 //* //  //  //   //  //          GET SALES REPORT PAGE   //  //  //  //  //  //  //
export const getSalesReportPage = async (req,res) => {
  try {

    const query = req.query;
    const filterType = query.filterType || 'daily';
    const startDate = query.startDate
    const endDate = query.endDate;
    const page = parseInt(query.page) || 1;
    const limit = 10;
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
    startIndex,
    title:"Sales Report"
   })

  }catch (error) {
    console.log("Error in getSalesReportPage",error);
    res.status(500).send("Internal Server Error");   
  }
}


 //* //  //  //   //  //         GENERATE PDF REPORT     //  //  //  //  //  //  //

 
export const generatePDFReport = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const matchCriteria = getMatchCriteria(filterType, startDate, endDate);

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
        },
      },
    ]);

    const reportData = salesReport[0] || { totalRevenue: 0, totalDiscount: 0, salesCount: 0 };

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#333')
      .text('Comix Sales Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#666')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333')
      .text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#444')
      .text(`Total Revenue: ₹${reportData.totalRevenue}`)
      .text(`Total Discount: ₹${reportData.totalDiscount}`)
      .text(`Total Sales Count: ${reportData.salesCount}`);
    doc.moveDown(1);

    const headers = [
      { label: 'User', width: 60 },
      { label: 'Order ID', width: 80 },
      { label: 'Product', width: 100 },
      { label: 'Qty', width: 40 },
      { label: 'Total Disc', width: 60 },
      { label: 'Coupon Disc', width: 70 },
      { label: 'Item Total', width: 60 }
    ];

    let x = doc.x, y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff')
      .rect(x, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 18)
      .fill('#007acc');
    headers.forEach((header) => {
      doc.text(header.label, x + 5, y + 4, { width: header.width, align: 'center' });
      x += header.width;
    });
    y += 18;

    const truncate = (str, len) => (str.length > len ? `${str.slice(0, len - 3)}...` : str);

    const orders = await orderModel.find(matchCriteria)
      .populate('user', 'name')
      .populate('items.product', 'name');

    doc.font('Helvetica').fontSize(9).fillColor('#000');
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.itemStatus === 'Delivered') {
          x = doc.page.margins.left;
          y += 15;

          const rowData = [
            truncate(order.user.name, 8),
            truncate(order._id.toString(), 12),
            truncate(item.product.name, 15),
            item.quantity.toString(),
            `₹${item.totalDiscount}`,
            `₹${item.couponDiscountAmount}`
          ];

          rowData.forEach((text, i) => {
            doc.text(text, x + 3, y, { width: headers[i].width, align: 'center' });
            x += headers[i].width;
          });

          if (y > doc.page.height - 50) {
            doc.addPage(); // Add a new page when reaching bottom
            y = doc.y;
          }
        }
      });
    });

    doc.end();
  } catch (error) {
    console.error('Error in generatePDFReport:', error);
    res.status(500).send('Internal Server Error');
  }
};



 //* //  //  //   //  //         GENERATE EXCEL REPORT     //  //  //  //  //  //  //

export const generateExcelReport = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const matchCriteria = getMatchCriteria(filterType, startDate, endDate);

    const orders = await orderModel.find(matchCriteria)
      .populate('user', 'name')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define columns first 
    worksheet.columns = [
      { header: '', key: 'user', width: 20 },
      { header: '', key: 'orderId', width: 30 },
      { header: '', key: 'product', width: 30 },
      { header: '', key: 'quantity', width: 15 },
      { header: '', key: 'totalDiscount', width: 15 },
      { header: '', key: 'couponDiscount', width: 15 },
      { header: '', key: 'itemTotal', width: 15 },
      { header: '', key: 'paymentStatus', width: 15 },
      { header: '', key: 'date', width: 15 }
    ];

    // Add and style title row
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'comiX Sales Report';
    titleCell.font = {
      name: ' Georgia',
      size: 16,
      bold: true,
     
     
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
  
    }
    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
    worksheet.getRow(1).height = 30;

    // Add filter information below the title
    const filterInfoRow = worksheet.getRow(2);
    filterInfoRow.getCell(1).value = `Filter Type: ${filterType || 'All'}`;
    filterInfoRow.getCell(2).value = `Start Date: ${startDate || 'N/A'}`;
    filterInfoRow.getCell(3).value = `End Date: ${endDate || 'N/A'}`;

    // Merge cells for filter info
    worksheet.mergeCells('A2:I2');
    filterInfoRow.getCell(1).alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };

    // Style the filter info row
    filterInfoRow.eachCell((cell) => {
      cell.font = {
        bold: true,
    
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
   
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
    });
    filterInfoRow.height = 20;

    
    const headers = [
      'User',
      'Order ID',
      'Product',
      'Quantity',
      'Discount',
      'Coupon Discount',
      'Total',
      'Payment Status',
      'Date'
    ];

    // Add and style header row
    const headerRow = worksheet.getRow(3); // Adjusted to row 3
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = {
        bold: true,
      
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
      
        // Dark blue background
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
    });
    headerRow.height = 25;

    // Add data rows starting from row 4
    let rowIndex = 3;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.itemStatus === 'Delivered') {
          const row = worksheet.addRow({
            user: order.user.name,
            orderId: order._id,
            product: item.product.name,
            quantity: item.quantity,
            totalDiscount: item.totalDiscount,
            couponDiscount: item.couponDiscountAmount,
            itemTotal: item.itemTotal,
            paymentStatus: order.paymentStatus,
            date: new Date(order.orderedAt).toLocaleDateString()
          });

          // Style each cell in the row
          row.eachCell((cell) => {
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          
          rowIndex++;
        }
      });
    });

    // Add borders to title and header rows
    [1, 2].forEach(rowNumber => {
      worksheet.getRow(rowNumber).eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Set response headers for Excel file download
    const filename = `ComiX_sales_report_${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Error in generateExcelReport", error);
    res.status(500).send("Internal Server Error");
  }
};









 //* //  //  //   //  //          GET MATCH CRITERIA   //  //  //  //  //  //  //
const getMatchCriteria = (filterType,startDate,endDate) => {
  let matchCriteria = {
    paymentStatus: 'Completed',
    orderedAt: {}
  }

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
  return matchCriteria;
}



