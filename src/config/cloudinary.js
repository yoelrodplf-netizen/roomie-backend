// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dsyajouuy',
  api_key: '679214349577751',
  api_secret: 'D6IVpDI80YB3CMI_ZHjz5GDXe0c',
  secure: true
});

module.exports = cloudinary;