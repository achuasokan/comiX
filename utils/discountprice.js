import discountmodel from "../models/discount.js"

export const calculateDiscountPrice = async (product) => {
  const discount = await discountmodel.findOne({
    $or:[{product: product._id},{category: product.category}],
    isActive: true
  })

  const discountPrice = discount ? product.price - (product.price * discount.discountValue) / 100 : product.price
  return Math.floor(discountPrice)
}