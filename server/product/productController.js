const Product = require('./productModel');
const { validationResult } = require('express-validator');

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
  res.json({
    orderedSimilarities: {},
    similaritySum: 7.993845875,
    mostSimilarUsers: [],
    orderedRecommendations: {},
    recommendedProducts: [
      "5dc8dbebc765e4469c50423d",
      "5dc8dbebc765e4469c504264",
      "5dc8dbebc765e4469c504290",
      "5dc8dbebc765e4469c5042a7",
      "5dc8dbebc765e4469c5042b8"
    ]
  });
};