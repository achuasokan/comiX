import discountModel from "../../models/discount.js";
import productModel from "../../models/Product.js"
import categoryModel from "../../models/Category.js"
import { STATUS_CODES } from "../../constants/statusCodes.js"
import { MESSAGES } from "../../constants/messages.js"



//* //  //  //   //  //          GET   DISCOUNT LIST PAGE   //  //  //  //  //  //  //

export const getDiscountListPage = async (req,res) => {
  try{
    const page = parseInt(req.query.page) || 1
    const limit = 9
    const skip = (page - 1) * limit
    
    const discountList = await discountModel.find({})
    .populate('product category')
    .skip(skip).limit(limit)

    const totalDiscounts = await discountModel.countDocuments({})
    const totalPages = Math.ceil(totalDiscounts / limit)
    const startIndex = skip + 1;

    res.render('admin/discountList',{
      discountList,
      currentPage: page,
      totalPages,
      startIndex,
      title:"Discounts"
    })
  } catch(error) {
    console.log("error in getDiscountListPage", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          GET  Add DISCOUNT PAGE   //  //  //  //  //  //  //

export const addDiscountPage = async (req,res) => {
  try{
    
    const productList = await productModel.find({isDeleted: false})
    const categoryList = await categoryModel.find({isBlocked: false})
    res.render("admin/addDiscount", {productList, categoryList,title:"Add Discount"})
  }catch(error) {
    console.log("error in addDiscountPage", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* //  //  //   //  //          POST  Add DISCOUNT   //  //  //  //  //  //  //

export const addDiscount = async (req,res) => {
  try{
    
    const {discountType, discountValue,product,category} =req.body

    const errors = [];

    const discountValues = parseInt(discountValue);
    if(isNaN(discountValues) || discountValues < 1 || discountValues > 90 || discountValue.startsWith('0')) {
      errors.push(MESSAGES.DISCOUNT.INVALID_VALUE)
    }

    
    if(discountType === 'product'){
      const existingDiscount = await discountModel.findOne({product})
      if(existingDiscount){
       errors.push(MESSAGES.DISCOUNT.PRODUCT_EXISTS)
      }
    }

    if(discountType === 'category'){
      const existingDiscount = await discountModel.findOne({category})
      if(existingDiscount){
       errors.push(MESSAGES.DISCOUNT.CATEGORY_EXISTS)
      }
    }

    if(errors.length > 0) {
      req.flash('error', errors)
      return res.status(STATUS_CODES.BAD_REQUEST).redirect('/admin/addDiscount')
    }


    const newDiscount = new discountModel({
      discountType,
      discountValue,
      product: discountType === 'product' ? product : null,
      category: discountType === 'category' ? category : null,
      
    })

    await newDiscount.save()

    
  
     if (discountType === 'product') {
      await productModel.findByIdAndUpdate(product, { discount: newDiscount._id });
    }

   
    if (discountType === 'category') {
      await categoryModel.findByIdAndUpdate(category, { discount: newDiscount._id });
    }

    res.redirect("/admin/discounts")
    
  } catch(error) {
    console.log("error in addDiscount", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//*  //  //   //  //          GET  Edit DISCOUNT PAGE   //  //  //  //  //  //  //

export const editDiscountPage = async (req,res) => {
  try{
    const discountId = req.params.id
    const discount = await discountModel.findById(discountId)
    const productList = await productModel.find({isDeleted: false})
    const categoryList = await categoryModel.find({isBlocked: false})
    res.render("admin/editDiscount", {discount, productList, categoryList,title:"Edit Discount"})
  }catch(error) {
    console.log("error in editDiscountPage", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


//* // //  //  //   //  //          POST  Edit DISCOUNT   //  //  //  //  //  //  //

export const postEditDiscount = async (req,res) => {
  try{
    const discountId = req.params.id
    const {discountType,discountValue,product,category} = req.body

    const errors = [];

    const discountValues = parseInt(discountValue);
    if(isNaN(discountValues) || discountValues < 1 || discountValues > 90 || discountValue.startsWith('0')) {
      errors.push(MESSAGES.DISCOUNT.INVALID_VALUE)
    }

    if(discountType === 'product'){
      const existingDiscount = await discountModel.findOne({product,
        _id: {$ne: discountId}}
      )
      if(existingDiscount){
       errors.push(MESSAGES.DISCOUNT.PRODUCT_EXISTS)
      }
    }

    if(discountType === 'category'){
      const existingDiscount = await discountModel.findOne({category,
        _id: {$ne: discountId}}
      )
      if(existingDiscount){
       errors.push(MESSAGES.DISCOUNT.CATEGORY_EXISTS)
      }
    }

    if(errors.length > 0) {
      req.flash('error', errors)
      return res.status(STATUS_CODES.BAD_REQUEST).redirect(`/admin/editDiscount/${discountId}`)
    }

    const updatedDiscount = await discountModel.findByIdAndUpdate(discountId,{
      discountType,
      discountValue,
      product: discountType === 'product' ? product : null,
      category: discountType === 'category' ? category : null,
      
    })

    if (discountType === 'product') {
      await productModel.findByIdAndUpdate(product, { discount: discountId });
    }

    if (discountType === 'category') {
      await categoryModel.findByIdAndUpdate(category, { discount: discountId });
    }

    res.redirect("/admin/discounts")
  }catch(error) {
    console.log("error in editDiscount", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //          POST  Block/Unblock DISCOUNT   //  //  //  //  //  //  //

export const blockDiscount = async (req,res) => {
  try{
    const discountId = req.params.id
    const discount = await discountModel.findById(discountId)
    if(!discount) {
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.DISCOUNT.NOT_FOUND)
    }
    discount.isActive = !discount.isActive;
    await discount.save()
    res.redirect("/admin/discounts")

  }catch(error) {
    console.log("error in blockDiscount", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}
