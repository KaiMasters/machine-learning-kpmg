const router = require('express').Router();
const controller = require('./productController');
const validator = require('./productValidator');

router.route('/')
  .get(controller.getProducts)
  .post(validator.newProduct(), controller.createProduct);

module.exports = router;