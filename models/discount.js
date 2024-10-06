import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  discountType: {
    type: String,
    enum: ["product", "category"],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: function () {
      return this.discountType === "product";
    },
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: function () {
      return this.discountType === "category";
    },
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Discount = mongoose.model("Discount", discountSchema)

export default Discount;
