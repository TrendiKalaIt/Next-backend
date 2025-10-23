// config/cloudinary.js
const cloudinary = require('cloudinary').v2;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//  Optional: ping to test connection
const connectCloudinary = async () => {
  try {
    const result = await cloudinary.api.ping(); 
    console.log('Cloudinary connected:', result);
  } catch (error) {
    console.error('Cloudinary connection failed');
    console.error('Full Error:', error);
  }
};

module.exports = {
  cloudinary,
  connectCloudinary,
};
