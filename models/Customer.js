const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  location: String,
  gender: String
});

module.exports = mongoose.model('Customer', customerSchema);
