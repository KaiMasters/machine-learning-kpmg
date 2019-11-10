const Product = require('./productModel');

exports.getProducts = (req, res, next) => {
  console.log('Obtaining products from the database...');
  res.json('Obtaining products is working!');
  console.log('Successfully returned products')
};

exports.createProduct = (req, res, next) => {
  console.log('New product is being inserted into the database');
  res.json('New product is now entering the database!');
  console.log('New product successfully inserted');
};