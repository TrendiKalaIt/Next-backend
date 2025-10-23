const Enquiry = require('../models/enquiryModel');
const { cloudinary } = require('../config/cloudinary'); // <- destructured!
const streamifier = require('streamifier');
 
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'enquiries', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
 
exports.sendEnquiry = async (req, res) => {
  try {
 
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }
 
    const enquiry = await Enquiry.create({
      ...req.body,
      image: imageUrl,
    });
 
    res.status(201).json({ message: 'Enquiry submitted successfully', enquiry });
  } catch (error) {
    console.error('Error saving enquiry:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};
 
 