const Product = require('./productModel');
const { validationResult } = require('express-validator');
const MachineLearner = require('../../models/machineLearner');

exports.getProducts = (req, res, next) => {
  console.log('Obtaining products from the database...');
  res.json('Obtaining products is working!');
  console.log('Successfully returned products');
};

exports.createProduct = (req, res, next) => {
  console.log('New product is being inserted into the database');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  const newProduct = req.body;
  Product.create(newProduct)
    .then(createdProduct => {
      console.log('New product successfully inserted');
      return res.status(201).json('Successfully created new product!')
    })
    .catch(err => {
      console.log(`Error creating new product: ${err}`);
      res.status(500).json(`Error creating new product: ${err}`)
    });
};

exports.recommendProducts = (req, res, next) => {
  MachineLearner.recommend("5dc9407ca6aca9469c8559b7")
    .then(data => res.json(data))
    .catch(err => console.log(`Error occurred: ${err}`));
};