const express = require('express');
const compression = require('compression');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const connectDb = require('./config/db');
const { connectCloudinary } = require('./config/cloudinary');

// Route imports (CommonJS)
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const contactRoutes = require('./routes/contactRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require("./routes/couponRoutes");
const path = require('path');

// Load environment variables


// Initialize Express
const app = express();

// Enable CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://next-frontend-dwdpfvdsgabqc5ch.southeastasia-01.azurewebsites.net", 
  "https://next-frontend-test-fjb8hqdrdjcmbagh.centralindia-01.azurewebsites.net",
  "https://trendikala.com",
  "https://www.trendikala.com"
  
  
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));


// **Enable compression**
app.use(compression());

// Middleware to parse JSON
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDb();

// Connect to Cloudinary
connectCloudinary();

// Mount API Routes
app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payment', paymentRoutes);
app.use("/api/coupons", couponRoutes);

// Test POST route
app.post('/test', (req, res) => {
  res.send('POST request received');
});

// Root route
app.get('/', (req, res) => {
  res.send('Trendikala Client Backend API is working fine.');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
