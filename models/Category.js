const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  categoryCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  slug: { type: String, unique: true, lowercase: true },
  icon: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

  // 🆕 SEO fields
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },
  canonicalUrl: { type: String, default: "" }, 

}, { timestamps: true });

// ✅ Pre-save hook for slug & SEO fields
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Auto SEO content agar blank ho
  if (!this.metaTitle?.trim()) {
    this.metaTitle = `${this.name} | Trendikala`;
  }

  if (!this.metaDescription?.trim()) {
    this.metaDescription = `Explore our latest ${this.name} collection at Trendikala. Find premium quality and best prices.`;
  }

  if (!this.metaKeywords?.trim()) {
    this.metaKeywords = `${this.name}, buy ${this.name}, Trendikala, ${this.name} online`;
  }

  // 🆕 Auto canonicalUrl generate karo agar blank hai
  if (!this.canonicalUrl?.trim() && this.slug) {
    this.canonicalUrl = `https://www.trendikala.com/${this.slug}`;
  }

  next();
});

module.exports = mongoose.model('Category', categorySchema);
