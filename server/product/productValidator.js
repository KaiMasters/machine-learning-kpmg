const { check } = require('express-validator');

exports.newProduct = function() {
  return [
    check('manufacturer')
      .exists()
      .withMessage('A product must have a manufacturer to be in existence')
      .trim()
      .stripLow()
      .escape()
      .isLength({ min: 1 })
      .withMessage('Manufacturer name cannot be empty'),
    check('brand')
      .exists()
      .withMessage('A product must have a brand!')
      .trim()
      .stripLow()
      .escape()
      .isLength({ min: 1 })
      .withMessage(`Product's brand cannot be empty`),
    check('sub_brand')
      .optional()
      .trim()
      .stripLow()
      .escape()
      .isLength({ min: 1 })
      .withMessage(`Product's sub_brand cannot be empty`),
    check('category')
      .exists()
      .withMessage('A product needs to be placed in a category')
      .trim()
      .stripLow()
      .escape()
      .isLength({ min: 1 })
      .withMessage(`Product's category cannot be empty`),
    check('product_type')
      .exists()
      .withMessage('Product must have a type')
      .trim()
      .stripLow()
      .escape()
      .isLength({ min: 1})
      .withMessage(`Product's type cannot be empty`),
    check('price')
      .exists()
      .withMessage(`Every product must have a price! This isn't a free world`)
      .isNumeric()
      .withMessage('Price must be a valid number')
  ]
};