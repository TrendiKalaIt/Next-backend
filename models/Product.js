const mongoose = require('mongoose');
const slugify = require("slugify");

// Media schema
const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
}, { _id: false });

// Review schema
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  media: [mediaSchema],
}, { timestamps: true });

// Product schema
const productSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  productName: { type: String, required: true },
  slug: { type: String, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: String,
  media: [mediaSchema],
  thumbnail: String,
  description: String,
  detailedDescription: {
    paragraph1: String,
    paragraph2: String,
  },

  colors: [{ name: String, hex: String }],

  // Size-wise pricing & stock
  sizes: [{
    size: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    discountPercent: { type: Number },
    stock: { type: Number, required: true, default: 0 }
  }],

  details: {
    fabric: String,
    fitType: String,
    length: String,
    sleeveNeckType: String,
    patternPrint: String,
    occasionType: String,
    washCare: String,
    countryOfOrigin: String,
    deliveryReturns: String,
  },

  materialWashing: [{ label: String, value: String }],
  sizeShape: [{ label: String, value: String }],

  // Reviews
  reviews: [reviewSchema],
  numReviews: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }

}, { timestamps: true });


// Slug generate before save
productSchema.pre("save", function (next) {
  if (this.isModified("productName")) {
    this.slug = slugify(this.productName, { lower: true, strict: true });
  }
  next();
});


// Virtual field: product is in stock if any size has stock
productSchema.virtual('inStock').get(function () {
  return this.sizes.some(s => s.stock > 0);
});

// Ensure virtual fields are serialized
productSchema.set('toObject', { virtuals: true });
productSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
