// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const { cloudinary } = require('../config/cloudinary'); // No .js needed for CommonJS

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => ({
//     folder: 'trendiKala/profiles',
//     resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
//     public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
//   }),
// });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|webp|mp4|mov|webm/;
//     const ext = file.originalname.toLowerCase().split('.').pop();
//     if (allowedTypes.test(ext)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image and video files are allowed'), false);
//     }
//   }
// });

// module.exports = upload;





const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary'); // No .js needed for CommonJS

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'trendiKala/profiles',
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
    public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
  }),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime', // mov files
      'video/webm'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

module.exports = upload;
