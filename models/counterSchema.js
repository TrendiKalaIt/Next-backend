const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Using 'id' as the key
  seq: { type: Number, default: 0 }  // The counter sequence
});

module.exports = mongoose.model('Counter', counterSchema);
