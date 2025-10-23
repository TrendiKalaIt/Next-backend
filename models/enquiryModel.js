const mongoose = require('mongoose');
 
const enquirySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  enquiryType: { type: String, required: true },
  message: { type: String, required: true },
  preferredContactMethod: { type: String, enum: ['Email', 'Phone'], default: 'Email' },
  preferredTime: String,
  image: { type: String },
 
}, {
  timestamps: true
});
 
module.exports = mongoose.model('Enquiry', enquirySchema);